'use client';
import React, { useState } from 'react';
import NavBar from '../../Agent/Views/NavBar';
import SideNav from '../Views/AdminNavigation';
import { useRouter } from 'next/navigation';
import AgentDataComponent from '../Views/AgentsData';
import TicketList from '../Views/TicketData';
import AgentPerformanceDashboard from '../Views/AgentPerformance';
import UpdateProfile from '../../Agent/Views/UpdateProfile';
import Settings from '../../Agent/Views/Settings';
import UserCreation from '../Views/UserCreation';

const Layout: React.FC = () => { 
  const [currentView, setCurrentView] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationTabOpen, setIsNotificationTabOpen] = useState(false);
  const router = useRouter();
  
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleNotifications = () => {
    if (!isNotificationTabOpen) {
      setIsSidebarOpen(false); // Collapse sidebar when opening notifications
      setIsNotificationTabOpen(true);
    } else {
      setIsNotificationTabOpen(false);
      setIsSidebarOpen(true); // Open sidebar when closing notifications
    }
  };
  
  function Logout() {
    setIsSidebarOpen(true);
    router.push('/components/login');
  }
  
  const renderContent = () => {
    switch (currentView) {
      case 'Dashboard':
        return <AgentDataComponent />;
      case 'Tickets':
        return <TicketList />;
      case 'Agents':
        return < AgentDataComponent/>; 
      
      case 'Agent Peformance':
        return <AgentPerformanceDashboard/>;

      case 'Settings':
        return <Settings/>
      case 'Update Profile':
        return <UpdateProfile />; 

      case 'CREATE':
        return <UserCreation/>
      default:
        return <TicketList />;
    }
  };
  
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-none">
        <NavBar 
          onModalChange={toggleModal} 
          showNotifications={toggleNotifications} 
        />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-none ${isSidebarOpen ? 'w-64' : 'w-16'} transition-width duration-300 ease-in-out`}>
          <SideNav
            isSidebarOpen={isSidebarOpen}
            onSelectPage={(view) => setCurrentView(view)}
          />
        </div>
        
        <div className="flex-1 bg-gray-100 p-6 overflow-auto mt-12 text-black">
          {renderContent()}
        </div>
      </div>
      
      {/* Modal */}
      {isModalOpen && (
  <div
    className="fixed top-20 right-6 z-50 w-80 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200"
    aria-hidden={!isModalOpen}
  >
    <div 
      onClick={Logout} 
      className="text-gray-800 hover:bg-gray-100 py-3 px-4 w-full text-left cursor-pointer transition-colors duration-200 flex items-center font-medium"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 mr-3 text-gray-600" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
        />
      </svg>
      Logout
    </div>
  </div>
)}
      
      {/* Notifications Tab */}
      {isNotificationTabOpen && (
        <div
          className="fixed top-20 right-6 z-50 w-80 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200"
          aria-hidden={!isNotificationTabOpen}
        >
          {/* Notifications Content */}
        </div>
      )}
    </div>
  );
};

export default Layout;
