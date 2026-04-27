import React from 'react';
import Image from 'next/image';
import { Bell, ChevronDown, Menu } from 'lucide-react';

interface NavBarProps {
  onModalChange: () => void;
  showNotifications: () => void;
  onToggleSidebar?: () => void;
  currentView?: string;
}

const NavBar: React.FC<NavBarProps> = ({
  onModalChange,
  showNotifications,
  onToggleSidebar,
  currentView = 'Dashboard',
}) => {
  const sectionTitle = currentView || 'Dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-200 bg-[#F8FAFC]/95 backdrop-blur-xl shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D1DDEB] bg-[#E8EEF5] text-[#334E68] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#4E6E8E]" />
            <span className="text-xs uppercase tracking-[0.18em] font-semibold">JoinAI Support</span>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 font-semibold">Workspace</p>
            <div className="flex items-center gap-1 text-slate-800">
              <span className="font-semibold text-sm md:text-base truncate">{sectionTitle}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#CFE3D0] bg-[#EEF7F0] text-[#2F6D43]">
            <span className="w-2 h-2 rounded-full bg-[#4D8C62]" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Connected</span>
          </div>

          <button
            onClick={showNotifications}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500" />
          </button>

          <button
            onClick={onModalChange}
            className="relative inline-flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
            aria-label="Open profile menu"
          >
            <span className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
              <Image
                src="/Images/no-profile.jpg"
                alt="Profile"
                fill
                className="object-cover"
                sizes="32px"
              />
            </span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
            <span className="absolute bottom-1 right-10 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
