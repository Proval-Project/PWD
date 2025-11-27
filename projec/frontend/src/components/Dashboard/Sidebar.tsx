import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import LanguageToggle from '../LanguageToggle';
import logo from './logo.svg';
import { FiBarChart2, FiUsers, FiUserCheck, FiBell, FiFileText, FiSearch, FiSettings, FiSave, FiFolder, FiLogOut, FiUser } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: number[]; // 1: Admin, 2: Staff, 3: Customer
}

const menuItems: MenuItem[] = [
  {
    id: 'statistics',
    label: '통계 분석',
    icon: <FiBarChart2 />,
    path: '/statistics',
    roles: [1, 2] // Admin, Staff
  },
  {
    id: 'customer-management',
    label: '고객 관리',
    icon: <FiUsers />,
    path: '/customer-management',
    roles: [1, 2] // Admin, Staff
  },
  {
    id: 'staff-management',
    label: '담당자 관리',
    icon: <FiUserCheck />,
    path: '/staff-management',
    roles: [1] // Admin only
  },
  {
    id: 'membership-requests',
    label: '회원가입 요청',
    icon: <FiBell />,
    path: '/membership-requests',
    roles: [1] // Admin only
  },
  {
  id: 'profile-management',
  label: '개인정보 관리',
  icon: <FiUser />,
  path: '/profile-management',
    roles: [1, 2, 3] // Admin, Staff, Customer 모두 사용
  },
  {
    id: 'estimate-request',
    label: '견적요청',
    icon: <FiFileText />,
    path: '/estimate-request',
    roles: [1, 2, 3] // All roles
  },
  {
    id: 'estimate-inquiry',
    label: '견적요청 조회',
    icon: <FiSearch />,
    path: '/estimate-inquiry',
    roles: [1, 2, 3] // All roles
  },
  {
    id: 'estimate-management',
    label: '견적요청 관리',
    icon: <FiSettings />,
    path: '/estimate-management',
    roles: [1, 2] // Admin, Staff
  },
  {
    id: 'temporary-storage',
    label: '임시저장함',
    icon: <FiSave />,
    path: '/temporary-storage',
    roles: [1, 2, 3] // All roles
  },
  {
    id: 'accessory-management',
    label: '제품코드 관리',
    icon: <FiFolder />,
    path: '/accessory-management',
    roles: [1, 2] // Admin, Staff
  }
];

interface SidebarProps {
  userRole: number;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 사용자 역할에 맞는 메뉴만 필터링
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };


  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Link to="/">
          <img src={logo} className="logo" alt="PROVAL PROVAL Co.,LTD." />
        </Link>
        <div className="user-box">
          <FaUserCircle className="user-icon" size={30} />
          <span className="user-text">
            {user.name || "사용자"} {user.position || ""}
          </span>
          <button className="logout-btn" onClick={handleLogout}>
            <FiLogOut size={20} />
          </button>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <LanguageToggle />
      </div>
    </div>
  );
};

export default Sidebar; 