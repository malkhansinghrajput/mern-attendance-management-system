import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../../styles/components.css';

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-container fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
