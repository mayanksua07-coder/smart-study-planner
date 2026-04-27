import React from 'react';
import { LayoutDashboard, Calendar, Timer, MessageSquare, LogOut, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeTab: 'dashboard' | 'planner' | 'focus' | 'chat';
  setActiveTab: (tab: 'dashboard' | 'planner' | 'focus' | 'chat') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'focus', label: 'Focus', icon: Timer },
    { id: 'chat', label: 'AI Tutor', icon: MessageSquare },
  ] as const;

  return (
    <aside className="w-20 md:w-64 border-r border-[var(--color-ink)] flex flex-col bg-white">
      <div className="p-6 border-bottom border-[var(--color-ink)] flex items-center gap-3">
        <GraduationCap className="w-8 h-8 text-[var(--color-ink)]" />
        <span className="hidden md:block font-display text-xl italic font-black">ETHOS</span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 text-sm font-medium transition-all duration-200 border border-transparent",
              activeTab === item.id 
                ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)] shadow-[4px_4px_0px_0px_rgba(0,245,255,1)]"
                : "text-[var(--color-ink)] hover:bg-gray-100 hover:border-[var(--color-ink)]"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-[var(--color-ink)]">
        <button
          onClick={() => signOut(auth)}
          className="w-full flex items-center gap-4 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden md:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
