"use client";

import { ArrowUp, FileText, Image, Plus, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type ChatAttachment = { id: string; name: string; text: string; truncated?: boolean };

type Props = {
  value: string;
  onSend: (value: string) => void;
  onStop: () => void;
  onAttach: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onGenerateImage: (prompt: string) => void;
  attachments: ChatAttachment[];
  attachmentBusy: boolean;
  attachmentProgress: string;
  busy: boolean;
  disabled?: boolean;
  generatingImage?: boolean;
};

function imagePromptFromMessage(message: string) {
  const trimmed = message.trim();
  if (/^image\s*:/i.test(trimmed)) return trimmed.replace(/^image\s*:/i, '').trim();

  const request = trimmed.match(/^(?:(?:please|can you|could you|would you)\s+)*(generate|create|draw|make|paint|design)\s+(?:me\s+)?(.+)$/i);
  if (!request) return null;
  const [, verb, description] = request;
  const isDirectDrawing = /^(draw|paint)$/i.test(verb);
  if (!isDirectDrawing && !/\b(image|picture|photo|illustration|drawing|artwork|wallpaper|logo|portrait)\b/i.test(description)) return null;

  return description.replace(/^(?:an?\s+)?(?:image|picture|photo|illustration|drawing|artwork|wallpaper|logo|portrait)\s+(?:of|showing)\s+/i, '').trim() || description.trim();
}

export default function ChatComposer({ value, onSend, onStop, onAttach, onRemoveAttachment, onGenerateImage, attachments, attachmentBusy, attachmentProgress, busy, disabled, generatingImage }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [draft]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const onFocus = () => {
      document.documentElement.classList.add('is-typing');
    };
    const onBlur = () => {
      document.documentElement.classList.remove('is-typing');
    };

    textarea.addEventListener('focus', onFocus);
    textarea.addEventListener('blur', onBlur);

    return () => {
      textarea.removeEventListener('focus', onFocus);
      textarea.removeEventListener('blur', onBlur);
      document.documentElement.classList.remove('is-typing');
    };
  }, []);


  return (
    <div className="chat-composer-wrap">
      {attachments.length > 0 && (
        <div className="chat-attachment-list" aria-label="Attached files">
          {attachments.map((attachment) => (
            <div className="chat-attachment-chip" key={attachment.id} title={attachment.truncated ? 'Only the first part of this document will be included' : attachment.name}>
              <FileText size={15} aria-hidden="true" />
              <span>{attachment.name}</span>
              <button type="button" onClick={() => onRemoveAttachment(attachment.id)} aria-label={`Remove ${attachment.name}`} disabled={busy}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {attachmentBusy && <p className="chat-attachment-progress" role="status">{attachmentProgress || 'Reading file for the assistant…'}</p>}
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); if (!busy && !attachmentBusy) { const currentDraft = draft; setDraft(''); onSend(currentDraft); } }}>
        <div className="chat-attach-control">
          <button
            type="button"
            className="chat-attach-button"
            aria-label="Add a file"
            aria-expanded={attachmentMenuOpen}
            aria-haspopup="menu"
            title="Add a file"
            disabled={busy || attachmentBusy || attachments.length >= 4}
            onClick={() => setAttachmentMenuOpen((open) => !open)}
          >
            <Plus size={19} />
          </button>
          {attachmentMenuOpen && (
            <div className="chat-attach-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setAttachmentMenuOpen(false); fileInputRef.current?.click(); }}>
                <FileText size={16} /> Upload files
              </button>
              <p>PDF, DOCX, or TXT · up to 10 MB each. Text remains available in this chat.</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            className="chat-file-input"
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            tabIndex={-1}
            aria-label="Choose PDF, DOCX, or TXT files"
            onChange={(event) => {
              onAttach(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = '';
            }}
          />
        </div>
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (!busy && !attachmentBusy && !generatingImage) {
                const currentDraft = draft;
                const trimmed = currentDraft.trim();
                const prompt = imagePromptFromMessage(currentDraft);
                if (prompt) {
                  setDraft('');
                  onGenerateImage(prompt);
                  return;
                }
                if (trimmed) {
                  setDraft('');
                  onSend(currentDraft);
                }
              }
            }
          }}
          placeholder="Message Stitch… or ask it to create an image"
          aria-label="Message Stitch"
          disabled={disabled || generatingImage}
          autoComplete="off"
          className="chat-composer-input"
        />
        {generatingImage ? (
          <button type="button" disabled className="chat-send-button" aria-label="Generating image">
            <Image size={19} />
          </button>
        ) : busy ? (
          <button type="button" onClick={onStop} className="chat-send-button chat-stop-button" aria-label="Stop generating" title="Stop generating">
            <Square size={15} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            disabled={(!draft.trim() && attachments.length === 0) || disabled || attachmentBusy}
            className="chat-send-button"
            aria-label="Send message"
            title="Send message"
            onClick={() => {
              const trimmed = draft.trim();
              if (!trimmed && attachments.length === 0) return;
              if (busy || attachmentBusy || generatingImage) return;
              const prompt = imagePromptFromMessage(trimmed);
              if (prompt) {
                setDraft('');
                onGenerateImage(prompt);
                return;
              }
              if (trimmed) {
                setDraft('');
                onSend(draft);
              }
            }}
          >
            <ArrowUp size={19} strokeWidth={2.4} />
          </button>
        )}
      </form>
      <p className="chat-composer-hint">Enter to send <span>·</span> Shift + Enter for a new line <span>·</span> Ask for an image to generate one</p>
    </div>
  );
}
