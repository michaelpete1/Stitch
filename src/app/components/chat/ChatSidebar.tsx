"use client";

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, MessageSquarePlus, MoreHorizontal, Pencil, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export type ConversationItem = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  conversations: ConversationItem[];
  activeId: string | null;
  collapsed: boolean;
  mobileOpen: boolean;
  loading: boolean;
  hasChats: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (conversation: ConversationItem) => void;
  onClearChats: () => void;
};

function groupFor(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.floor((startToday.getTime() - startDate.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'Previous 7 days';
  return 'Older';
}

export default function ChatSidebar(props: Props) {
  const [search, setSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const isCollapsed = props.collapsed && !props.mobileOpen;

  const groups = useMemo(() => {
    const filtered = props.conversations.filter((conversation) => conversation.title.toLowerCase().includes(search.toLowerCase()));
    const order = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];
    return order.map((label) => ({
      label,
      conversations: filtered.filter((conversation) => groupFor(conversation.updatedAt) === label),
    })).filter((group) => group.conversations.length > 0);
  }, [props.conversations, search]);

  const saveRename = async (id: string) => {
    const title = renameValue.trim();
    if (!title) return;
    await props.onRename(id, title);
    setRenamingId(null);
  };

  return (
    <>
      <AnimatePresence>
        {props.mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close chat history"
            className="chat-sidebar-scrim"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={props.onCloseMobile}
          />
        )}
      </AnimatePresence>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 288 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className={`chat-sidebar ${isCollapsed ? 'chat-sidebar-collapsed' : ''} ${props.mobileOpen ? 'chat-sidebar-mobile-open' : ''}`}
        aria-label="Chat history"
      >
        <div className="chat-sidebar-top">
          {!isCollapsed && <div className="chat-brand"><Image src="/stitch-mark.png" alt="" width={28} height={28} className="chat-brand-mark" /><span>Stitch</span></div>}
          <button type="button" className="chat-icon-button chat-sidebar-collapse" onClick={props.mobileOpen ? props.onCloseMobile : props.onToggleCollapsed} aria-label={props.mobileOpen ? 'Close sidebar' : props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={props.mobileOpen ? 'Close sidebar' : props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {props.mobileOpen ? <X size={18} /> : props.collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <button type="button" onClick={props.onNewChat} className="chat-new-button" title="New chat" aria-label="New chat">
          <MessageSquarePlus size={18} />
          {!isCollapsed && <span>New chat</span>}
        </button>

        {!isCollapsed && (
          <label className="chat-search-wrap">
            <Search size={16} aria-hidden="true" />
            <input aria-label="Search conversations" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chats" />
            <kbd>⌘ K</kbd>
          </label>
        )}

        {!isCollapsed && (
          <div className="chat-history-list">
            {props.loading ? (
              <div className="chat-skeleton-list" aria-label="Loading chats">
                {[0, 1, 2, 3, 4].map((item) => <div key={item} className="chat-skeleton-row" />)}
              </div>
            ) : groups.length ? groups.map((group) => (
              <section key={group.label} className="chat-history-group" aria-label={group.label}>
                <h2>{group.label}</h2>
                {group.conversations.map((conversation) => (
                  <div key={conversation.id} className={`chat-history-item ${props.activeId === conversation.id ? 'chat-history-item-active' : ''}`}>
                    {renamingId === conversation.id ? (
                      <form className="chat-rename-form" onSubmit={(event) => { event.preventDefault(); void saveRename(conversation.id); }}>
                        <input autoFocus aria-label="Conversation title" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setRenamingId(null); }} />
                        <button type="submit" className="sr-only">Save title</button>
                      </form>
                    ) : (
                      <button type="button" onClick={() => { props.onSelect(conversation.id); props.onCloseMobile(); }} className="chat-history-select" title={conversation.title}>
                        <span className="chat-history-title">{conversation.title}</span>
                      </button>
                    )}
                    {!renamingId && (
                      <details className="chat-history-menu">
                        <summary aria-label={`Actions for ${conversation.title}`} title="Chat actions"><MoreHorizontal size={16} /></summary>
                        <div className="chat-history-menu-popover">
                          <button type="button" onClick={() => { setRenamingId(conversation.id); setRenameValue(conversation.title); }}><Pencil size={14} /> Rename</button>
                          <button type="button" className="chat-delete-action" onClick={() => props.onDelete(conversation)}><Trash2 size={14} /> Delete</button>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </section>
            )) : (
              <p className="chat-history-empty">{search ? 'No matching chats' : 'Your chats will appear here.'}</p>
            )}
          </div>
        )}

        <div className="chat-sidebar-bottom">
          {!isCollapsed ? (
            <div className="chat-sidebar-device-note">
              <span>Your chats are saved on this device.</span>
              <button type="button" onClick={props.onClearChats} disabled={!props.hasChats}>Clear my chats</button>
            </div>
          ) : (
            <button type="button" onClick={props.onClearChats} disabled={!props.hasChats} aria-label="Clear my chats" title="Clear my chats"><Trash2 size={17} /></button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
