import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Dashboard Layout
import DashboardLayout from './components/Dashboard/DashboardLayout';

// Dashboard Pages
import StatisticsPage from './pages/Dashboard/StatisticsPage';
import CustomerManagementPage from './pages/Dashboard/CustomerManagementPage';
import CustomerDetailPage from './pages/Dashboard/CustomerDetailPage';
import StaffManagementPage from './pages/Dashboard/StaffManagementPage';
import StaffDetailPage from './pages/Dashboard/StaffDetailPage';
import MembershipRequestsPage from './pages/Dashboard/MembershipRequestsPage';


import EstimateRequestPage from './pages/Dashboard/EstimateRequestPage';
import NewEstimateRequestPage from './pages/Dashboard/NewEstimateRequestPage';
import EstimateInquiryPage from './pages/Dashboard/EstimateInquiryPage';
import EstimateManagementPage from './pages/Dashboard/EstimateManagementPage';
import TemporaryStoragePage from './pages/Dashboard/TemporaryStoragePage';
import NewAccessoryManagementPage from './pages/Dashboard/NewAccessoryManagementPage';
import EstimateDetailPage from './pages/Dashboard/EstimateDetailPage';

function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  // 로그인하지 않은 경우 기본 홈페이지 표시
  if (!user) {
    return (
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="nav-container">
              <h1 className="nav-title">컨트롤 밸브 견적 시스템</h1>
              <div className="nav-links">
                <Link to="/" className="nav-link">홈</Link>
                <Link to="/login" className="nav-link">로그인</Link>
                <Link to="/register" className="nav-link">회원가입</Link>
              </div>
            </div>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={
                <div className="home-page">
                  <h2>컨트롤 밸브 견적 시스템에 오신 것을 환영합니다</h2>
                  <div className="feature-grid">
                    <div className="feature-card">
                      <h3>인증 관리</h3>
                      <p>로그인 및 회원가입</p>
                      <Link to="/login" className="feature-link">바로가기</Link>
                    </div>
                    <div className="feature-card">
                      <h3>아이디 찾기</h3>
                      <p>이메일로 아이디 찾기</p>
                      <Link to="/forgot-password" className="feature-link">바로가기</Link>
                    </div>
                    <div className="feature-card">
                      <h3>비밀번호 재설정</h3>
                      <p>이메일 인증을 통한 비밀번호 재설정</p>
                      <Link to="/forgot-password" className="feature-link">바로가기</Link>
                    </div>
                  </div>
                </div>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    );
  }

  // 로그인한 경우 대시보드 표시
  return (
    <Router>
      <Routes>
        {/* 대시보드 레이아웃이 적용된 라우트들 */}
        <Route path="/" element={<DashboardLayout userRole={user.roleId} />}>
          <Route index element={<StatisticsPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="customer-management" element={<CustomerManagementPage />} />
          <Route path="customer-detail/:customerId" element={<CustomerDetailPage />} />
          <Route path="staff-management" element={<StaffManagementPage />} />
          <Route path="staff-detail/:staffId" element={<StaffDetailPage />} />
          <Route path="membership-requests" element={<MembershipRequestsPage />} />

          <Route path="estimate-request" element={<EstimateRequestPage />} />
          <Route path="estimate-request/new" element={<NewEstimateRequestPage />} />
          <Route path="estimate-request/edit" element={<NewEstimateRequestPage />} />
          <Route path="estimate-request/:tempEstimateNo" element={<NewEstimateRequestPage />} />
          <Route path="estimate-inquiry" element={<EstimateInquiryPage />} />
          <Route path="estimate-detail/:tempEstimateNo" element={<EstimateDetailPage />} />
          <Route path="estimate-management" element={<EstimateManagementPage />} />
          <Route path="estimate-request/temporary" element={<TemporaryStoragePage />} />
          <Route path="temporary-storage" element={<TemporaryStoragePage />} />
          <Route path="accessory-management" element={<NewAccessoryManagementPage />} />
          <Route path="estimate-requests" element={<EstimateInquiryPage />} />
        </Route>

        {/* 대시보드 레이아웃이 적용된 다른 경로들 */}
        <Route path="/dashboard" element={<DashboardLayout userRole={user.roleId} />}>
          <Route index element={<StatisticsPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="customer-management" element={<CustomerManagementPage />} />
          <Route path="customer-detail/:customerId" element={<CustomerDetailPage />} />
          <Route path="staff-management" element={<StaffManagementPage />} />
          <Route path="staff-detail/:staffId" element={<StaffDetailPage />} />
          <Route path="membership-requests" element={<MembershipRequestsPage />} />

          <Route path="estimate-request" element={<EstimateRequestPage />} />
          <Route path="estimate-request/new" element={<NewEstimateRequestPage />} />
          <Route path="estimate-request/edit" element={<NewEstimateRequestPage />} />
          <Route path="estimate-request/:tempEstimateNo" element={<NewEstimateRequestPage />} />
          <Route path="estimate-inquiry" element={<EstimateInquiryPage />} />
          <Route path="estimate-detail/:tempEstimateNo" element={<EstimateDetailPage />} />
          <Route path="estimate-management" element={<EstimateManagementPage />} />
          <Route path="estimate-request/temporary" element={<TemporaryStoragePage />} />
          <Route path="temporary-storage" element={<TemporaryStoragePage />} />
          <Route path="accessory-management" element={<NewAccessoryManagementPage />} />
          <Route path="estimate-requests" element={<EstimateInquiryPage />} />
        </Route>

        {/* 권한별 메인 페이지 라우트들 */}
        <Route path="/admin" element={<DashboardLayout userRole={user.roleId} />}>
          <Route index element={<StatisticsPage />} />
        </Route>
        <Route path="/sales" element={<DashboardLayout userRole={user.roleId} />}>
          <Route index element={<StatisticsPage />} />
        </Route>

        {/* AuthSystem 관련 라우트들 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </Router>
  );
}

export default App;
