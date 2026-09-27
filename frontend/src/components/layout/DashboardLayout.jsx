import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../../styles/components.css';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <Navbar onToggleSidebar={toggleSidebar} isSidebarOpen={sidebarOpen} />
        <main className="page-container fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
