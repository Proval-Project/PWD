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
      <main className="dashboard-main bg-[#EFEFEF] min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout; 