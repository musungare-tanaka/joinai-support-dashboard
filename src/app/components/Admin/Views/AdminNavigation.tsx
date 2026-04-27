import React from 'react';
import { BsKanban } from 'react-icons/bs';
import { FaTicketAlt, FaUsers, FaBell, FaUserShield, FaClipboardList } from 'react-icons/fa';
import { MdDashboard, MdSettings } from 'react-icons/md';

interface SideNavProps {
  isSidebarOpen: boolean;
  onSelectPage: (page: string) => void;
  currentView: string;
}

const AdminNavigation: React.FC<SideNavProps> = ({ isSidebarOpen, onSelectPage, currentView }) => {
  const navItems = [
    { icon: <MdDashboard className="w-5 h-5" />, label: 'Dashboard', hint: 'Overview and system health' },
    { icon: <FaTicketAlt className="w-5 h-5" />, label: 'Tickets', hint: 'Queue and escalation control' },
    { icon: <FaUsers className="w-5 h-5" />, label: 'Agents', hint: 'Manage support team accounts' },
    { icon: <BsKanban className="w-5 h-5" />, label: 'Agent Performance', legacyLabel: 'Agent Peformance', hint: 'Productivity and response analytics' },
    { icon: <FaUserShield className="w-5 h-5" />, label: 'User Provisioning', legacyLabel: 'CREATE', hint: 'Create agents and admins' },
    { icon: <FaBell className="w-5 h-5" />, label: 'Update Profile', hint: 'Account details and preferences' },
    { icon: <FaClipboardList className="w-5 h-5" />, label: 'Audit Logs', hint: 'Security and API trail' },
    { icon: <MdSettings className="w-5 h-5" />, label: 'Settings', hint: 'Platform configuration' },
  ];

  return (
    <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} h-full bg-[#2B3A4B] border-r border-[#3B4E63] transition-all duration-300`}>
      <div className="h-full flex flex-col">
        <div className={`px-4 py-5 border-b border-[#3B4E63] ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          {isSidebarOpen && (
            <>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9FB2C6] font-semibold">Admin Console</p>
              <p className="text-sm text-[#E3ECF5] mt-1">Operations Navigation</p>
            </>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1.5">
            {navItems.map((item, index) => {
              const isActive = currentView === item.label || currentView === item.legacyLabel;
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
              <p className="text-xs text-[#AFC1D4]">Environment</p>
              <p className="text-sm font-semibold text-[#D3E6D8] mt-1">Production</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminNavigation;
