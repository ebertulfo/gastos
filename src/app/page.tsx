'use client';

import { ChatUI } from '@/components/ChatUI';
import { SpendingSidebar } from '@/components/SpendingSidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="flex h-[calc(100vh-theme(spacing.navbar)-1.25rem)]">
      {user && (
        <div className="flex-shrink-0 h-full hidden md:block">
          <SpendingSidebar />
        </div>
      )}
      <div className="flex-grow h-full overflow-hidden">
        <ChatUI />
      </div>
    </main>
  );
}
