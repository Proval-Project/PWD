import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';

// Auth Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// User Pages
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import StaffListPage from './pages/StaffListPage';
import CustomerListPage from './pages/CustomerListPage';

// Estimate Pages
import EstimatesPage from './pages/EstimatesPage';
import EstimateDetailPage from './pages/EstimateDetailPage';

// Stats Pages
import StatsPage from './pages/StatsPage';

// Admin Pages
import AdminMainPage from './pages/AdminMainPage';
import SalesMainPage from './pages/SalesMainPage';
import CustomerMainPage from './pages/CustomerMainPage';
import CustomerEstimatesPage from './pages/CustomerEstimatesPage';
import AdminEstimatesPage from './pages/AdminEstimatesPage';

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">관리 시스템</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">홈</Link>
              {!user && <Link to="/login" className="nav-link">로그인</Link>}
              {!user && <Link to="/register" className="nav-link">회원가입</Link>}
              {/* 관리자만 직원/회원 관리 메뉴 노출 */}
              {user && user.roleName === 'Admin' && (
                <>
                  <Link to="/staffs" className="nav-link">직원 관리</Link>
                  <Link to="/customers" className="nav-link">회원 관리</Link>
                </>
              )}
              <Link to="/estimates" className="nav-link">견적 관리</Link>
              <Link to="/stats" className="nav-link">통계</Link>
              {user && (
                <button onClick={handleLogout} className="nav-link logout-btn">로그아웃</button>
              )}
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            {/* 홈 페이지 */}
            <Route path="/" element={
              <div className="home-page">
                <h2>관리 시스템에 오신 것을 환영합니다</h2>
                <div className="feature-grid">
                  {user && user.roleName === 'Admin' && (
                    <div className="feature-card">
                      <h3>회원 관리</h3>
                      <p>회원 정보 조회 및 관리</p>
                      <Link to="/users" className="feature-link">바로가기</Link>
                    </div>
                  )}
                  <div className="feature-card">
                    <h3>견적 관리</h3>
                    <p>견적 정보 조회 및 관리</p>
                    <Link to="/estimates" className="feature-link">바로가기</Link>
                  </div>
                  <div className="feature-card">
                    <h3>통계</h3>
                    <p>시스템 통계 및 분석</p>
                    <Link to="/stats" className="feature-link">바로가기</Link>
                  </div>
                </div>
              </div>
            } />

            {/* 인증 관련 페이지 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* 사용자 관리 페이지 */}
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />

            {/* 직원/회원 관리 페이지 */}
            <Route path="/staffs" element={<StaffListPage />} />
            <Route path="/customers" element={<CustomerListPage />} />

            {/* 견적 관리 페이지: 권한별 분기 */}
            <Route path="/estimates" element={
              user && user.roleName === 'Customer' ? <CustomerEstimatesPage /> : <AdminEstimatesPage />
            } />
            <Route path="/estimates/:id" element={<EstimateDetailPage />} />

            {/* 통계 페이지 */}
            <Route path="/stats" element={<StatsPage />} />

            {/* 권한별 메인 페이지 */}
            <Route path="/admin" element={<AdminMainPage />} />
            <Route path="/sales" element={<SalesMainPage />} />
            <Route path="/customer" element={<CustomerMainPage />} />
            <Route path="/customer/estimates" element={<CustomerEstimatesPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
