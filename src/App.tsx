import React, { useState } from 'react';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Planner } from './components/Planner';
import { Focus } from './components/Focus';
import { Chat } from './components/Chat';
import { Auth } from './components/Auth';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'focus' | 'chat'>('dashboard');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-paper)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--color-ink)]" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[var(--color-paper)] overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto relative p-6 md:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="max-w-7xl mx-auto h-full"
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'planner' && <Planner />}
            {activeTab === 'focus' && <Focus />}
            {activeTab === 'chat' && <Chat />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
