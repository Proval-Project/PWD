import React, { useState, useEffect } from 'react';
import './DashboardPages.css';
import './MembershipRequests.css';
import { getPendingApprovals, approveUser, UserListResponseDto } from '../../api/userManagement';

interface MembershipRequest {
  userID: string;
  companyName: string;
  name: string;
  email: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  department: string;
  position: string;
  phoneNumber: string;
}

const MembershipRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MembershipRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 승인 대기 요청 목록 로드
  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingApprovals();
      const requestData: MembershipRequest[] = data.map(request => ({
        userID: request.userID,
        companyName: request.companyName,
        name: request.name,
        email: request.email,
        businessNumber: request.businessNumber,
        address: request.address,
        companyPhone: request.companyPhone,
        department: request.department,
        position: request.position,
        phoneNumber: request.phoneNumber
      }));
      setRequests(requestData);
    } catch (err) {
      console.error('승인 대기 요청 로드 실패:', err);
      setError('승인 대기 요청을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (request: MembershipRequest) => {
    setSelectedRequest(request);
  };

  const handleApprove = () => {
    setConfirmAction('approve');
    setShowConfirmModal(true);
  };

  const handleReject = () => {
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !confirmAction) return;

    try {
      if (confirmAction === 'approve') {
        await approveUser(selectedRequest.userID);
        setSuccessMessage('해당 고객의 회원가입 요청이 성공적으로 승인되었습니다.');
      } else {
        // 거절 로직은 삭제로 구현
        // await deleteUser(selectedRequest.userID);
        setSuccessMessage('해당 고객의 회원가입 요청이 성공적으로 거절되었습니다.');
      }

      setShowConfirmModal(false);
      setShowSuccessModal(true);
      
      // 목록 새로고침
      await loadPendingRequests();
      setSelectedRequest(null);
    } catch (err: any) {
      console.error('요청 처리 실패:', err);
      setError(err.response?.data?.message || '요청 처리에 실패했습니다.');
      setShowConfirmModal(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div className="membership-requests-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>승인 대기 요청을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="membership-requests-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadPendingRequests} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-requests-page">
      <div className="page-header">
        <h1>회원가입 요청</h1>
      </div>

      <div className="content-container">
        {/* 좌측: 요청 목록 */}
        <div className="requests-list">
          <h2>회원가입 요청 목록</h2>
          <div className="table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>회사명</th>
                  <th>담당자 성함</th>
                  <th>담당자 이메일</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr 
                    key={request.userID}
                    onClick={() => handleRequestClick(request)}
                    className={`request-row ${selectedRequest?.userID === request.userID ? 'selected' : ''}`}
                  >
                    <td>{request.userID}</td>
                    <td>{request.companyName}</td>
                    <td>{request.name}</td>
                    <td>{request.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-hint">표에 커서를 가져다 대는 경우 - 회색으로 표시 / 클릭하면 상세페이지로 이동</p>
        </div>

        {/* 우측: 상세 정보 */}
        <div className="request-detail">
          <h2>회원가입 요청 상세 정보</h2>
          {selectedRequest ? (
            <div className="detail-content">
              <div className="detail-row">
                <label>회사명:</label>
                <span>{selectedRequest.companyName}</span>
              </div>
              <div className="detail-row">
                <label>사업자등록번호:</label>
                <span>{selectedRequest.businessNumber}</span>
              </div>
              <div className="detail-row">
                <label>주소:</label>
                <span>{selectedRequest.address}</span>
              </div>
              <div className="detail-row">
                <label>대표번호:</label>
                <span>{selectedRequest.companyPhone}</span>
              </div>
              <div className="detail-row">
                <label>담당자 성함:</label>
                <span>{selectedRequest.name}</span>
              </div>
              <div className="detail-row">
                <label>담당자 부서:</label>
                <span>{selectedRequest.department}</span>
              </div>
              <div className="detail-row">
                <label>담당자 직급:</label>
                <span>{selectedRequest.position}</span>
              </div>
              <div className="detail-row">
                <label>담당자 연락처:</label>
                <span>{selectedRequest.phoneNumber}</span>
              </div>
              <div className="detail-row">
                <label>담당자 이메일:</label>
                <span>{selectedRequest.email}</span>
              </div>

              <div className="action-buttons">
                <button className="btn-approve" onClick={handleApprove}>
                  승인
                </button>
                <button className="btn-reject" onClick={handleReject}>
                  거절
                </button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>요청을 선택하면 상세 정보가 표시됩니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{confirmAction === 'approve' ? '승인하시겠습니까?' : '거절하시겠습니까?'}</h3>
            <p>
              {confirmAction === 'approve' 
                ? '해당 고객의 회원가입 요청을 승인하시겠습니까?' 
                : '해당 고객의 회원가입 요청을 거절하시겠습니까?'}
            </p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowConfirmModal(false)}
              >
                취소
              </button>
              <button 
                className={confirmAction === 'approve' ? 'btn-approve' : 'btn-reject'}
                onClick={handleConfirmAction}
              >
                {confirmAction === 'approve' ? '승인' : '거절'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>성공하였습니다!</h3>
            <p>{successMessage}</p>
            <div className="modal-actions">
              <button className="btn-close" onClick={handleCloseSuccessModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipRequestsPage; 