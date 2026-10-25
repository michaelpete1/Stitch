"use client";

import { motion } from 'framer-motion';
import React, { useState } from 'react';
import ReactMarkdown, { defaultUrlTransform, type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy, Pencil, ThumbsDown, ThumbsUp, RotateCw } from 'lucide-react';

export type ChatMessageData = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  tokens?: number;
  feedback?: 'up' | 'down' | null;
  optimistic?: boolean;
};

type Props = {
  message: ChatMessageData;
  busy?: boolean;
  canRegenerate?: boolean;
  onEdit?: (message: ChatMessageData) => void;
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, feedback: 'up' | 'down' | null) => void;
};

function textFromNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textFromNode(node.props.children);
  return '';
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(textFromNode(children));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="chat-code-wrap">
      <button type="button" onClick={copy} className="chat-copy-code" aria-label="Copy code block">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? 'Copied' : 'Copy code'}</span>
      </button>
      <pre>{children}</pre>
    </div>
  );
}

const markdownComponents: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => <div className="chat-table-wrap"><table>{children}</table></div>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
};

export default function ChatMessage({ message, busy, canRegenerate, onEdit, onRegenerate, onFeedback }: Props) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const timestamp = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(message.createdAt));

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`chat-message-row ${isUser ? 'chat-message-row-user' : ''}`}
      aria-label={`${isUser ? 'Your message' : 'Assistant response'}, ${timestamp}`}
    >
      <div className={`chat-avatar ${isUser ? 'chat-avatar-user' : 'chat-avatar-assistant'}`} aria-hidden="true">
        {isUser ? 'M' : 'S'}
      </div>
      <div className="chat-message-content">
        <div className="chat-message-meta">
          <span className="chat-message-author">{isUser ? 'You' : 'Stitch'}</span>
          <time dateTime={message.createdAt}>{timestamp}</time>
          {message.optimistic && <span className="chat-sending-label">Sending…</span>}
        </div>
        <div className={`chat-message-body ${isUser ? 'chat-user-content' : 'chat-assistant-content'}`}>
          {message.optimistic && !message.content ? (
            <span className="chat-typing-indicator" aria-label="Stitch is thinking"><i /><i /><i /></span>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
              urlTransform={(url, key) => key === 'src' && /^data:image\/(?:png|jpe?g|webp);base64,/i.test(url)
                ? url
                : defaultUrlTransform(url)}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <div className="chat-message-actions" aria-label="Message actions">
          <button type="button" onClick={copyMessage} disabled={!message.content} className="chat-icon-button" aria-label={copied ? 'Copied message' : 'Copy message'} title="Copy">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          {isUser && onEdit && (
            <button type="button" onClick={() => onEdit(message)} disabled={busy} className="chat-icon-button" aria-label="Edit message" title="Edit">
              <Pencil size={16} />
            </button>
          )}
          {!isUser && canRegenerate && onRegenerate && (
            <button type="button" onClick={onRegenerate} disabled={busy} className="chat-icon-button" aria-label="Regenerate response" title="Regenerate">
              <RotateCw size={16} />
            </button>
          )}
          {!isUser && onFeedback && (
            <>
              <button type="button" onClick={() => onFeedback(message.id, message.feedback === 'up' ? null : 'up')} className={`chat-icon-button ${message.feedback === 'up' ? 'chat-feedback-selected' : ''}`} aria-label="Helpful response" aria-pressed={message.feedback === 'up'} title="Helpful">
                <ThumbsUp size={16} />
              </button>
              <button type="button" onClick={() => onFeedback(message.id, message.feedback === 'down' ? null : 'down')} className={`chat-icon-button ${message.feedback === 'down' ? 'chat-feedback-selected' : ''}`} aria-label="Unhelpful response" aria-pressed={message.feedback === 'down'} title="Not helpful">
                <ThumbsDown size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}
