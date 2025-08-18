import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: number[]; // 1: Admin, 2: Staff, 3: Customer
}

const menuItems: MenuItem[] = [
  {
    id: 'statistics',
    label: '통계 분석',
    icon: '📊',
    path: '/statistics',
    roles: [1, 2] // Admin, Staff
  },
  {
    id: 'customer-management',
    label: '고객 관리',
    icon: '👥',
    path: '/customer-management',
    roles: [1, 2] // Admin, Staff
  },
  {
    id: 'staff-management',
    label: '담당자 관리',
    icon: '👨‍💼',
    path: '/staff-management',
    roles: [1] // Admin only
  },
  {
    id: 'membership-requests',
    label: '회원가입 요청',
    icon: '🔔',
    path: '/membership-requests',
    roles: [1] // Admin only
  },
  {
    id: 'estimate-request',
    label: '견적요청',
    icon: '📝',
    path: '/estimate-request',
    roles: [1, 2, 3] // All roles
  },
  {
    id: 'estimate-inquiry',
    label: '견적요청 조회',
    icon: '🔍',
    path: '/estimate-inquiry',
    roles: [1, 2, 3] // All roles
  },
  {
    id: 'estimate-management',
    label: '견적요청 관리',
    icon: '⚙️',
    path: '/estimate-management',
    roles: [1, 2] // Admin, Staff
  },
  {
    id: 'temporary-storage',
    label: '임시저장함',
    icon: '📁',
    path: '/temporary-storage',
    roles: [1, 2, 3] // All roles
  },
  {
    id: 'accessory-management',
    label: '악세서리 관리',
    icon: '🔧',
    path: '/accessory-management',
    roles: [1, 2] // Admin, Staff
  }
];

interface SidebarProps {
  userRole: number;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();

  // 사용자 역할에 맞는 메뉴만 필터링
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo">PROVAL PROVAL Co.,LTD.</h2>
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
        <div className="language-toggle">
          <span>영어 번역</span>
          <label className="toggle-switch">
            <input type="checkbox" />
            <span className="toggle-slider"></span>
          </label>
        </div>
        <div className="logout-section">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="logout-button"
          >
            🚪 로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 