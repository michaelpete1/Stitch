"use client";

import ChatWorkspace from './chat/ChatWorkspace';

export default function LLMChat({ context, fullScreen = false, promptRequest }: {
  context?: string;
  fullScreen?: boolean;
  promptRequest?: { prompt: string; requestId: number } | null;
}) {
  return <ChatWorkspace context={context} fullScreen={fullScreen} promptRequest={promptRequest} />;
}
