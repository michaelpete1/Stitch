"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, Menu, Moon, Plus, Sun, Sparkles, RotateCw, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ChatComposer, { type ChatAttachment } from './ChatComposer';
import ChatMessage, { type ChatMessageData } from './ChatMessage';
import ChatSidebar, { type ConversationItem } from './ChatSidebar';

type Props = { context?: string; fullScreen?: boolean; promptRequest?: { prompt: string; requestId: number } | null };
type ChatProvider = 'gemini' | 'workers';
type RetryPayload = { content: string; context?: string; clientMessageId: string; provider: ChatProvider };
type ConversationListResponse = { conversations: ConversationItem[]; error?: string };
type ConversationResponse = {
  conversation: ConversationItem;
  messages: ChatMessageData[];
  nextCursor: string | null;
  error?: string;
};
type Theme = 'light' | 'dark';

async function readError(response: Response) {
  try {
    const data = await response.json();
    return typeof data.error === 'string' ? data.error : 'Something went wrong.';
  } catch {
    return 'Something went wrong.';
  }
}

function uuid() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ChatWorkspace({ context, fullScreen = false, promptRequest }: Props) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [provider, setProvider] = useState<ChatProvider>('gemini');
  const [error, setError] = useState('');
  const [retryPayload, setRetryPayload] = useState<RetryPayload | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<number | null>(null);
  const nearBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialHistoryLoadedRef = useRef(false);


  const refreshConversations = useCallback(async () => {
    const response = await fetch('/api/conversations', { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error(await readError(response));
    const data = (await response.json()) as ConversationListResponse;
    setConversations(data.conversations);
    return data.conversations;
  }, []);

  const loadConversation = useCallback(async (id: string, before?: string) => {
    const query = new URLSearchParams({ limit: '30' });
    if (before) query.set('before', before);
    const response = await fetch(`/api/conversations/${id}?${query}`, { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error(await readError(response));
    const data = (await response.json()) as ConversationResponse;
    if (before) {
      scrollAnchorRef.current = scrollAreaRef.current?.scrollHeight ?? null;
      setMessages((current) => [...data.messages, ...current]);
    } else {
      nearBottomRef.current = true;
      setMessages(data.messages);
    }
    setCursor(data.nextCursor);
    return data;
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('stitch-theme');
    const savedProvider = window.localStorage.getItem('stitch-ai-provider');
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(saved === 'dark' || saved === 'light' ? saved : preferred);
    if (savedProvider === 'gemini' || savedProvider === 'workers') setProvider(savedProvider);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('stitch-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('stitch-ai-provider', provider);
  }, [provider]);

  useEffect(() => {
    if (!promptRequest) return;
    setInput(promptRequest.prompt);
    document.querySelector<HTMLTextAreaElement>('.chat-composer-input')?.focus();
  }, [promptRequest]);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const items = await refreshConversations();
        if (active && !initialHistoryLoadedRef.current) {
          initialHistoryLoadedRef.current = true;
          if (items.length) setConversationId(items[0].id);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Chat history is unavailable.');
      } finally {
        if (active) setLoadingHistory(false);
      }
    };
    void initialize();
    return () => { active = false; };
  }, [refreshConversations]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setCursor(null);
      return;
    }
    let active = true;
    setLoadingConversation(true);
    setError('');
    void loadConversation(conversationId)
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load this chat.'); })
      .finally(() => { if (active) setLoadingConversation(false); });
    return () => { active = false; };
  }, [conversationId, loadConversation]);

  useLayoutEffect(() => {
    const scroller = scrollAreaRef.current;
    if (!scroller) return;
    if (scrollAnchorRef.current !== null) {
      scroller.scrollTop += scroller.scrollHeight - scrollAnchorRef.current;
      scrollAnchorRef.current = null;
    } else if (nearBottomRef.current) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sortedMessages = useMemo(() => messages, [messages]);

  const createConversation = useCallback(async () => {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(await readError(response));
    const data = await response.json() as { conversation: ConversationItem };
    setConversations((items) => [data.conversation, ...items]);
    setConversationId(data.conversation.id);
    setMessages([]);
    setError('');
    return data.conversation;
  }, []);

  const newChat = async () => {
    abortControllerRef.current?.abort();
    setBusy(false);
    setRetryPayload(null);
    setEditingId(null);
    setInput('');
    try {
      await createConversation();
      setMobileSidebarOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create a chat.');
    }
  };

  const streamResponse = async (url: string, body: object | undefined, assistantId: string, signal: AbortSignal, requestedProvider?: ChatProvider) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    if (!response.ok) throw new Error(await readError(response));
    if (!response.body) throw new Error('The assistant returned an empty response.');
    const actualProvider = response.headers.get('X-Stitch-AI-Provider');
    if (requestedProvider && actualProvider && actualProvider !== requestedProvider) {
      const selectedName = requestedProvider === 'gemini' ? 'Gemini' : 'Workers AI';
      const actualName = actualProvider === 'gemini' ? 'Gemini' : 'Workers AI';
      toast(`${selectedName} was unavailable. This reply used ${actualName}.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages((current) => current.map((message) => message.id === assistantId
        ? { ...message, content: message.content + chunk }
        : message));
    }
  };

  const addAttachments = async (files: File[]) => {
    const availableSlots = Math.max(0, 4 - attachments.length);
    if (files.length > availableSlots) toast.error('You can attach up to 4 files to one message.');
    const selectedFiles = files.slice(0, availableSlots);
    if (!selectedFiles.length) return;

    setAttachmentBusy(true);
    try {
      for (const [index, file] of selectedFiles.entries()) {
        setAttachmentProgress(`Preparing ${file.name} (${index + 1} of ${selectedFiles.length})`);
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !['pdf', 'docx', 'txt'].includes(extension)) {
          toast.error(`${file.name}: choose a PDF, DOCX, or TXT file.`);
          continue;
        }
        if (file.size === 0 || file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: files must be 10 MB or smaller.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await fetch('/api/chat/attachments', {
            method: 'POST',
            credentials: 'include',
            body: formData,
            signal: AbortSignal.timeout(45_000),
          });
          if (!response.ok) throw new Error(await readError(response));
          const data = await response.json() as { attachment: { name: string; text: string; truncated: boolean } };
          setAttachments((current) => [...current, { ...data.attachment, id: uuid() }]);
          if (data.attachment.truncated) toast('Only the first part of this file will be sent to the assistant.');
        } catch (cause) {
          const message = cause instanceof Error && cause.name === 'TimeoutError'
            ? `${file.name}: reading timed out. Try a smaller or simpler file.`
            : cause instanceof Error ? cause.message : `Could not read ${file.name}.`;
          toast.error(message);
        }
      }
    } finally {
      setAttachmentBusy(false);
      setAttachmentProgress('');
    }
  };

  const generateImage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || generatingImage || busy) return;
    setGeneratingImage(true);
    setError('');

    let activeId = conversationId;
    if (!activeId) {
      try {
        const created = await createConversation();
        activeId = created.id;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not create a chat.');
        setGeneratingImage(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/chat/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: prompt.trim(), provider, conversationId: activeId }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const data = await response.json() as { image: string; provider?: ChatProvider };
      if (activeId) {
        const updated = await loadConversation(activeId);
        setMessages(updated.messages);
        setConversations((items) => [updated.conversation, ...items.filter((item) => item.id !== activeId)]);
      }
      nearBottomRef.current = true;
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
      toast.success(data.provider && data.provider !== provider
        ? `Image generated with ${data.provider === 'gemini' ? 'Gemini' : 'Workers AI'} fallback`
        : 'Image generated');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to generate image.');
    } finally {
      setGeneratingImage(false);
      void refreshConversations().catch(() => undefined);
    }
  }, [busy, conversationId, createConversation, generatingImage, loadConversation, provider, refreshConversations]);

  const sendMessage = async (text: string, retry?: RetryPayload) => {
    const content = text.trim() || (attachments.length ? 'Please explain the attached document(s) in clear, simple language.' : '');
    if (!content || busy) return;
    setInput('');
    setError('');
    setRetryPayload(null);

    let activeId = conversationId;
    if (!activeId) {
      try {
        const created = await createConversation();
        activeId = created.id;
      } catch (cause) {
        setInput(content);
        setError(cause instanceof Error ? cause.message : 'Could not create a chat.');
        return;
      }
    }

    const attachmentContext = attachments.map((attachment) => `${attachment.name}\n${attachment.text}`).join('\n\n');
    const messageContext = retry?.context ?? [
      attachmentContext ? `Attached documents:\n${attachmentContext}` : '',
      context ? `Course context:\n${context}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 30_000);
    if (!retry) setAttachments([]);

    const clientMessageId = retry?.clientMessageId ?? uuid();
    const requestedProvider = retry?.provider ?? provider;
    const userMessageId = retry ? clientMessageId : uuid();
    const assistantId = `assistant-${clientMessageId}`;
    if (!retry) {
      setMessages((current) => [...current, {
        id: userMessageId, role: 'user', content, createdAt: new Date().toISOString(), optimistic: true,
      }]);
    }
    setMessages((current) => [...current, {
      id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString(), optimistic: true,
    }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setBusy(true);
    try {
      await streamResponse(`/api/conversations/${activeId}/messages`, {
        content,
        context: messageContext,
        clientMessageId,
        provider: requestedProvider,
      }, assistantId, controller.signal, requestedProvider);
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, optimistic: false } : message));
      setRetryPayload(null);
      const updated = await loadConversation(activeId);
      setConversations((items) => [updated.conversation, ...items.filter((item) => item.id !== activeId)]);
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') {
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, optimistic: false } : message));
      } else {
        setMessages((current) => current.filter((message) => message.id !== assistantId));
        setError(cause instanceof Error ? cause.message : 'The message could not be sent.');
        setRetryPayload({ content, context: messageContext, clientMessageId, provider: requestedProvider });
      }
    } finally {
      setBusy(false);
      abortControllerRef.current = null;
      void refreshConversations().catch(() => undefined);
    }
  };

  const regenerate = async () => {
    if (!conversationId || busy) return;
    const assistantId = `assistant-${uuid()}`;
    setMessages((current) => [...current, { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString(), optimistic: true }]);
    setError('');
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setBusy(true);
    try {
      await streamResponse(`/api/conversations/${conversationId}/regenerate`, { provider }, assistantId, controller.signal, provider);
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, optimistic: false } : message));
      const updated = await loadConversation(conversationId);
      setConversations((items) => [updated.conversation, ...items.filter((item) => item.id !== conversationId)]);
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === 'AbortError')) {
        setMessages((current) => current.filter((message) => message.id !== assistantId));
        setError(cause instanceof Error ? cause.message : 'Could not regenerate the response.');
      }
    } finally {
      setBusy(false);
      abortControllerRef.current = null;
    }
  };

  const editAndResend = async (message: ChatMessageData, editedContent: string) => {
    if (!conversationId || busy) return;
    const content = editedContent.trim();
    if (!content) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages/${message.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setMessages((current) => {
        const index = current.findIndex((item) => item.id === message.id);
        return index < 0 ? current : current.slice(0, index + 1).map((item, itemIndex) => itemIndex === index ? { ...item, content } : item);
      });
      setEditingId(null);
      setInput('');
      setBusy(false);
      const assistantId = `assistant-${uuid()}`;
      setMessages((current) => [...current, { id: assistantId, role: 'assistant', content: '', createdAt: new Date().toISOString(), optimistic: true }]);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setBusy(true);
      await streamResponse(`/api/conversations/${conversationId}/regenerate`, { provider }, assistantId, controller.signal, provider);
      const updated = await loadConversation(conversationId);
      setMessages(updated.messages);
      setConversations((items) => [updated.conversation, ...items.filter((item) => item.id !== conversationId)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this message.');
    } finally {
      setBusy(false);
      abortControllerRef.current = null;
    }
  };

  const updateFeedback = async (messageId: string, feedback: 'up' | 'down' | null) => {
    if (!conversationId) return;
    const previous = messages.find((message) => message.id === messageId)?.feedback ?? null;
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, feedback } : message));
    const response = await fetch(`/api/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ feedback }),
    });
    if (!response.ok) {
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, feedback: previous } : message));
      toast.error(await readError(response));
    }
  };

  const renameConversation = async (id: string, title: string) => {
    const response = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error(await readError(response));
    const data = await response.json() as { conversation: ConversationItem };
    setConversations((items) => items.map((item) => item.id === id ? data.conversation : item));
    toast.success('Chat renamed');
  };

  const deleteConversation = async (conversation: ConversationItem) => {
    if (!window.confirm(`Delete “${conversation.title}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/conversations/${conversation.id}`, { method: 'DELETE', credentials: 'include' });
    if (!response.ok) {
      toast.error(await readError(response));
      return;
    }
    setConversations((items) => items.filter((item) => item.id !== conversation.id));
    if (conversationId === conversation.id) {
      setConversationId(null);
      setMessages([]);
    }
    toast.success('Chat deleted');
  };

  const clearChats = async () => {
    if (!conversations.length) return;
    if (!window.confirm('Clear every chat saved for this device? This cannot be undone.')) return;
    abortControllerRef.current?.abort();
    setBusy(false);
    setError('');
    try {
      const response = await fetch('/api/conversations', { method: 'DELETE', credentials: 'include' });
      if (!response.ok) {
        toast.error(await readError(response));
        return;
      }
      setConversations([]);
      setConversationId(null);
      setMessages([]);
      setCursor(null);
      setRetryPayload(null);
      setEditingId(null);
      setInput('');
      toast.success('Your chats have been cleared');
    } catch {
      toast.error('Could not clear your chats. Check your connection and try again.');
    }
  };

  const loadOlder = async () => {
    if (!conversationId || !cursor || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      await loadConversation(conversationId, cursor);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Could not load older messages');
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  };

  const onScroll = () => {
    const scroller = scrollAreaRef.current;
    if (!scroller) return;
    const distanceToBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
    nearBottomRef.current = distanceToBottom < 120;
    setShowScrollButton(distanceToBottom > 240);
    if (scroller.scrollTop < 48 && cursor && !loadingOlderRef.current) void loadOlder();
  };

  const stop = () => abortControllerRef.current?.abort();
  const currentConversation = conversations.find((item) => item.id === conversationId);
  const isEmpty = messages.length === 0 && !loadingConversation;

  return (
    <div className={`chat-workspace ${fullScreen ? 'chat-workspace-full' : 'chat-workspace-embedded'}`}>
      <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
      <ChatSidebar
        conversations={conversations}
        activeId={conversationId}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        loading={loadingHistory}
        hasChats={conversations.length > 0}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onNewChat={() => void newChat()}
        onSelect={setConversationId}
        onRename={renameConversation}
        onDelete={(item) => void deleteConversation(item)}
        onClearChats={() => void clearChats()}
      />

      <main className="chat-main">
        <header className="chat-topbar">
          <div className="chat-topbar-title-wrap">
            <button type="button" className="chat-icon-button chat-mobile-menu" onClick={() => setMobileSidebarOpen(true)} aria-label="Open chat history"><Menu size={19} /></button>
            <div className="chat-topbar-title-group">
              <h1>{currentConversation?.title ?? 'New chat'}</h1>
              <p>
                <span className="chat-status-dot" />
                <label className="chat-provider-control">
                  <span className="sr-only">AI provider</span>
                  <select aria-label="AI provider" value={provider} onChange={(event) => setProvider(event.target.value as ChatProvider)}>
                    <option value="gemini">Gemini</option>
                    <option value="workers">Workers AI</option>
                  </select>
                </label>
                <span>{provider === 'gemini' ? 'Workers AI fallback' : 'Gemini fallback'}</span>
              </p>
            </div>
          </div>
          <div className="chat-topbar-actions">
            <button type="button" onClick={() => void newChat()} className="chat-icon-button chat-new-mobile" aria-label="Start a new chat" title="New chat"><Plus size={19} /></button>
            <button type="button" className="chat-icon-button" onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="chat-scroll-area" ref={scrollAreaRef} onScroll={onScroll}>
          {cursor && (
            <div className="chat-older-control">
              <button type="button" className="chat-button-subtle" onClick={() => void loadOlder()} disabled={loadingOlder}>
                {loadingOlder ? 'Loading earlier messages…' : 'Load earlier messages'}
              </button>
            </div>
          )}
          {loadingConversation ? (
            <div className="chat-thread chat-thread-loading" aria-label="Loading conversation">
              {[0, 1, 2].map((item) => <div key={item} className={`chat-message-skeleton chat-message-skeleton-${item}`} />)}
            </div>
          ) : isEmpty ? (
            <section className="chat-empty-state">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="chat-empty-inner">
                <div className="chat-empty-icon"><Sparkles size={22} /></div>
                <p className="chat-eyebrow">STITCH AI</p>
                <h2>What would you like to work through?</h2>
                <p className="chat-empty-description">Ask a question, explore an idea, or turn your lecture notes into a clear study guide.</p>
                <div className="chat-prompt-grid">
                  {[
                    'Explain a difficult concept in simple terms',
                    'Help me create a study plan for this week',
                    'Quiz me on the main ideas in my notes',
                  ].map((prompt) => (
                    <button type="button" key={prompt} onClick={() => setInput(prompt)} className="chat-prompt-card">
                      <span>{prompt}</span><span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </section>
          ) : (
            <div className="chat-thread" aria-label="Conversation messages">
              {sortedMessages.map((message, index) => {
                const isLastAssistant = message.role === 'assistant' && !sortedMessages.slice(index + 1).some((item) => item.role === 'assistant');
                const userMessage = message.role === 'user' ? message : null;
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    busy={busy}
                    canRegenerate={isLastAssistant && !busy}
                    onEdit={userMessage ? (selected) => { setEditingId(selected.id); setInput(selected.content); document.querySelector<HTMLTextAreaElement>('.chat-composer-input')?.focus(); } : undefined}
                    onRegenerate={regenerate}
                    onFeedback={updateFeedback}
                  />
                );
              })}
            </div>
          )}
          <div aria-live="polite" className="sr-only">{busy ? 'Stitch is responding' : ''}</div>
        </div>

        <AnimatePresence>
          {showScrollButton && (
            <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} type="button" className="chat-scroll-bottom" onClick={() => scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' })} aria-label="Scroll to latest message">
              <ArrowDown size={17} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="chat-bottom-area">
          {error && (
            <div className="chat-error-banner" role="alert">
              <p>{error}</p>
              {retryPayload && <button type="button" onClick={() => void sendMessage(retryPayload.content, retryPayload)}><RotateCw size={14} /> Retry</button>}
              <button type="button" className="chat-error-close" onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button>
            </div>
          )}
          {editingId && <div className="chat-editing-indicator">Editing a message <button type="button" onClick={() => { setEditingId(null); setInput(''); }}>Cancel</button></div>}
          <ChatComposer
            value={input}
            attachments={attachments}
            attachmentBusy={attachmentBusy}
            attachmentProgress={attachmentProgress}
            onAttach={(files) => void addAttachments(files)}
            onRemoveAttachment={(id) => setAttachments((current) => current.filter((attachment) => attachment.id !== id))}
            onGenerateImage={(prompt) => void generateImage(prompt)}
            onSend={(draft) => {
              if (editingId) {
                const message = messages.find((item) => item.id === editingId);
                if (message) void editAndResend(message, draft);
              } else void sendMessage(draft);
            }}
            onStop={stop}
            busy={busy}
            generatingImage={generatingImage}
          />
        </div>
      </main>
    </div>
  );
}
