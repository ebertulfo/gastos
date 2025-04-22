'use client';

import { ChatUI } from '@/components/ChatUI';

export default function Home() {
  return (
    <main className="flex flex-col h-[calc(100vh-theme(spacing.navbar)-1.25rem)]">
      <div className="h-full overflow-hidden">
        <ChatUI />
      </div>
    </main>
  );
}
