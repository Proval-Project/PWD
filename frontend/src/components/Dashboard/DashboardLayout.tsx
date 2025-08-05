import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  userRole: number;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ userRole }) => {
  return (
    <div className="dashboard-layout">
      <Sidebar userRole={userRole} />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout; 