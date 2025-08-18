import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DashboardPages.css';
import './StaffDetail.css';
import { getStaffById, updateStaff, deleteStaff, UserResponseDto, UpdateUserDto } from '../../api/userManagement';

interface StaffDetail {
  userID: string;
  email: string;
  name: string;
  department: string;
  position: string;
  phoneNumber: string;
}

const StaffDetailPage: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const [staffDetail, setStaffDetail] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [modifyForm, setModifyForm] = useState<UpdateUserDto>({});

  // 담당자 상세 정보 로드
  useEffect(() => {
    if (staffId) {
      loadStaffDetail();
    }
  }, [staffId]);

  const loadStaffDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStaffById(staffId!);
      const staffData: StaffDetail = {
        userID: data.userID,
        email: data.email,
        name: data.name,
        department: data.department,
        position: data.position,
        phoneNumber: data.phoneNumber
      };
      setStaffDetail(staffData);
      setModifyForm({
        email: data.email,
        name: data.name,
        department: data.department,
        position: data.position,
        phoneNumber: data.phoneNumber
      });
    } catch (err) {
      console.error('담당자 상세 정보 로드 실패:', err);
      setError('담당자 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleModify = () => {
    setShowModifyModal(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmModify = async () => {
    try {
      await updateStaff(staffId!, modifyForm);
      setShowModifyModal(false);
      setSuccessMessage('해당 담당자의 정보가 성공적으로 수정되었습니다.');
      setShowSuccessModal(true);
      await loadStaffDetail(); // 데이터 새로고침
    } catch (err: any) {
      console.error('담당자 수정 실패:', err);
      setError(err.response?.data?.message || '담당자 수정에 실패했습니다.');
      setShowModifyModal(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteStaff(staffId!);
      setShowDeleteModal(false);
      setSuccessMessage('해당 담당자가 성공적으로 삭제되었습니다.');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('담당자 삭제 실패:', err);
      setError(err.response?.data?.message || '담당자 삭제에 실패했습니다.');
      setShowDeleteModal(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    if (successMessage.includes('삭제')) {
      navigate('/staff-management');
    }
  };

  if (loading) {
    return (
      <div className="staff-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>담당자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-detail-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadStaffDetail} className="retry-btn">다시 시도</button>
        </div>
      </div>
    );
  }

  if (!staffDetail) {
    return (
      <div className="staff-detail-page">
        <div className="error-container">
          <p className="error-message">담당자 정보를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/staff-management')} className="retry-btn">목록으로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-detail-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/staff-management')}>
            &lt;
          </button>
          <h1>담당자 상세 정보</h1>
        </div>
      </div>

      <div className="staff-detail-form">
        <div className="form-grid">
          <div className="form-group">
            <label>아이디</label>
            <div className="form-value">{staffDetail.userID}</div>
          </div>
          <div className="form-group">
            <label>이메일</label>
            <div className="form-value">{staffDetail.email}</div>
          </div>
          <div className="form-group">
            <label>담당자 성함</label>
            <div className="form-value">{staffDetail.name}</div>
          </div>
          <div className="form-group">
            <label>담당자 부서</label>
            <div className="form-value">{staffDetail.department}</div>
          </div>
          <div className="form-group">
            <label>담당자 직급</label>
            <div className="form-value">{staffDetail.position}</div>
          </div>
          <div className="form-group">
            <label>담당자 연락처</label>
            <div className="form-value">{staffDetail.phoneNumber}</div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-modify" onClick={handleModify}>
            수정
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </div>

      {/* 수정 모달 */}
      {showModifyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>담당자 정보 수정</h3>
            </div>
            <div className="modal-body">
              <form className="modify-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>이메일</label>
                    <input
                      type="email"
                      value={modifyForm.email || ''}
                      onChange={(e) => setModifyForm({...modifyForm, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>담당자 성함</label>
                    <input
                      type="text"
                      value={modifyForm.name || ''}
                      onChange={(e) => setModifyForm({...modifyForm, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>담당자 부서</label>
                    <input
                      type="text"
                      value={modifyForm.department || ''}
                      onChange={(e) => setModifyForm({...modifyForm, department: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>담당자 직급</label>
                    <input
                      type="text"
                      value={modifyForm.position || ''}
                      onChange={(e) => setModifyForm({...modifyForm, position: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>담당자 연락처</label>
                  <input
                    type="text"
                    value={modifyForm.phoneNumber || ''}
                    onChange={(e) => setModifyForm({...modifyForm, phoneNumber: e.target.value})}
                  />
                </div>
              </form>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModifyModal(false)}>
                취소
              </button>
              <button className="btn-modify" onClick={confirmModify}>
                수정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>삭제하시겠습니까?</h3>
            </div>
            <div className="modal-body">
              <p>해당 담당자를 삭제하시겠습니까?</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                취소
              </button>
              <button className="btn-delete" onClick={confirmDelete}>
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>성공하였습니다!</h3>
            </div>
            <div className="modal-body">
              <p>{successMessage}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-close" onClick={closeSuccessModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDetailPage; 