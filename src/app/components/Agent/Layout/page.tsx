'use client';
import React, { useState } from 'react';
import Tickets from '../Views/Tickets';
import SideNav from '../Views/SideNav';
import NavBar from '../Views/NavBar';
import { useRouter } from 'next/navigation';
import AgentsStats from '../Views/Statistics';
import UpdateProfile from '../Views/UpdateProfile';
import TicketNotifications from '../Views/Notifications';
import Settings from '../Views/Settings';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationTabOpen, setIsNotificationTabOpen] = useState(false);
  const [currentView, setCurrentView] = useState('Tickets');

  const router = useRouter();
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const toggleModal = () => {
    setIsModalOpen((prev) => {
      if (!prev) {
        setIsNotificationTabOpen(false);
      }
      return !prev;
    });
  };

  const toggleNotifications = () => {
    setIsNotificationTabOpen((prev) => {
      if (!prev) {
        setIsSidebarOpen(false);
        setIsModalOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
      return !prev;
    });
  };

  function logout(): void {
    router.push('/components/login/');
  }

  function dailyStats(): void {
    router.push('/components/Agent/DaiyStats');
  }

  const renderContent = () => {
    switch (currentView) {
      case 'Dashboard':
        return <Tickets />;
      case 'Tickets':
        return <Tickets />;
      case 'Agents':
        return <UpdateProfile />;
      case 'Statistics':
        return <AgentsStats />;
      case 'Notifications':
        return <TicketNotifications />;
      case 'Settings':
        return <Settings />;
      default:
        return <UpdateProfile />;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-none">
        <NavBar
          onModalChange={toggleModal}
          showNotifications={toggleNotifications}
          onToggleSidebar={toggleSidebar}
          currentView={currentView}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-none ${isSidebarOpen ? 'w-72' : 'w-20'} transition-all duration-300 ease-in-out`}>
          <SideNav
            isSidebarOpen={isSidebarOpen}
            onSelectPage={(view) => setCurrentView(view)}
            currentView={currentView}
          />
        </div>

        <div className="flex-1 bg-[#EEF2F6] p-6 overflow-auto mt-16 text-black">
          {renderContent()}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed top-[4.6rem] right-6 z-50 w-80 bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200"
          aria-hidden={!isModalOpen}
        >
          <div className="text-black bg-[#F5F7FA] p-4 rounded-xl shadow-lg space-y-4">
            <div className="font-bold text-lg border-b border-slate-200 pb-2">Account Settings</div>
            <div onClick={dailyStats} className="text-sm text-slate-700 hover:text-blue-600 cursor-pointer">
              Daily Stats
            </div>
            <div className="text-sm text-slate-700 hover:text-red-500 cursor-pointer" onClick={logout}>
              Logout
            </div>
          </div>
        </div>
      )}

      {isNotificationTabOpen && (
        <div
          className={`fixed top-[4.6rem] right-6 z-50 w-80 bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200 ${
            isNotificationTabOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } transition-opacity duration-300`}
          aria-hidden={!isNotificationTabOpen}
        >
          <div className="p-4 text-center text-slate-500 text-sm">No Notifications</div>
        </div>
      )}
    </div>
  );
};

export default Layout;
