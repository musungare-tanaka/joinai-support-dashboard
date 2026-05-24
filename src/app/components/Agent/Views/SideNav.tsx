import React from 'react';
import { FaTicketAlt, FaChartBar, FaClipboardList } from "react-icons/fa";
import { MdSettings } from "react-icons/md";

interface SideNavProps {
  isSidebarOpen: boolean;
  onSelectPage: (page: string) => void;
  currentView: string; // <-- Add this prop
}

const SideNav: React.FC<SideNavProps> = ({ isSidebarOpen, onSelectPage, currentView }) => {
  const navItems = [
    { icon: <FaTicketAlt className="w-5 h-5" />, label: 'Tickets', hint: 'Assigned ticket queue' },
    { icon: <FaChartBar className="w-5 h-5" />, label: 'Statistics', hint: 'Performance trends' },
    { icon: <FaClipboardList className="w-5 h-5" />, label: 'Update Profile', hint: 'Personal information' },
    { icon: <MdSettings className="w-5 h-5" />, label: 'Settings', hint: 'Preferences and system options' },
  ];

  return (
    <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} h-full bg-[#2B3A4B] border-r border-[#3B4E63] transition-all duration-300`}>
      <div className="h-full flex flex-col">
        <div className={`px-4 py-5 border-b border-[#3B4E63] ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          {isSidebarOpen && (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9FB2C6] font-semibold">Agent Workspace</p>
              <p className="text-sm text-[#E3ECF5] mt-1">Daily Operations</p>
            </>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = currentView === item.label;
              return (
                <li key={`${item.label}-${index}`}>
                  <button
                    onClick={() => onSelectPage(item.label)}
                    className={`group w-full flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#3F5C79] text-white ring-1 ring-[#6F8AA6]/60'
                        : 'text-[#D2DDE8] hover:bg-[#364B61] hover:text-white'
                    }`}
                    title={!isSidebarOpen ? item.label : ''}
                  >
                    <span className={`${isActive ? 'text-white' : 'text-[#A8BBCF] group-hover:text-white'}`}>{item.icon}</span>
                    {isSidebarOpen && (
                      <span className="ml-3 min-w-0 text-left">
                        <span className="block text-sm font-medium truncate">{item.label}</span>
                        <span className={`block text-[11px] truncate ${isActive ? 'text-[#DDEAF7]' : 'text-[#9FB2C6]'}`}>
                          {item.hint}
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {isSidebarOpen && (
          <div className="p-4 border-t border-[#3B4E63]">
            <div className="rounded-xl bg-[#32465C] border border-[#4A6078] p-3">
              <p className="text-xs text-[#AFC1D4]">Shift</p>
              <p className="text-sm font-semibold text-[#D3E6D8] mt-1">Active and Ready</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SideNav;
