'use client';

import { ChatUI } from '@/components/ChatUI';

export default function Home() {

  return (
    <main className="flex flex-col h-screen">
      <div className="flex-1">
        <ChatUI />
      </div>
    </main>
  );
}
