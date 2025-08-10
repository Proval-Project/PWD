import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEstimateDetail, EstimateDetailResponseDto } from '../../api/estimateRequest';
import { updateEstimateStatus, statusChangeOptions } from '../../api/estimateInquiry';
import './EstimateDetail.css';

const EstimateDetailPage: React.FC = () => {
  const { tempEstimateNo } = useParams<{ tempEstimateNo: string }>();
  const navigate = useNavigate();
  const [estimateDetail, setEstimateDetail] = useState<EstimateDetailResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'requests' | 'attachments'>('basic');

  // 임시로 현재 사용자 ID를 하드코딩 (실제로는 인증 시스템에서 가져와야 함)
  const currentUserId = 'customer1';

  useEffect(() => {
    const fetchEstimateDetail = async () => {
      if (!tempEstimateNo) {
        setError('견적번호가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getEstimateDetail(tempEstimateNo, currentUserId);
        setEstimateDetail(data);
        setError(null);
      } catch (err) {
        console.error('견적 상세 조회 실패:', err);
        setError('견적 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimateDetail();
  }, [tempEstimateNo, currentUserId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (tempEstimateNo) {
      navigate(`/dashboard/estimate-request/${tempEstimateNo}`);
    }
  };

  const handleStatusChange = async (newStatus: number) => {
    if (!tempEstimateNo) return;
    
    try {
      await updateEstimateStatus(tempEstimateNo, newStatus);
      // 상태 변경 후 데이터 새로고침
      if (estimateDetail) {
        setEstimateDetail({
          ...estimateDetail,
          estimateSheet: {
            ...estimateDetail.estimateSheet,
            status: newStatus
          }
        });
      }
      alert('진행상태가 변경되었습니다.');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case 1: return 'status-draft';
      case 2: return 'status-requested';
      case 3: return 'status-reviewing';
      case 4: return 'status-quoted';
      case 5: return 'status-approved';
      case 6: return 'status-rejected';
      default: return 'status-unknown';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="estimate-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>견적 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !estimateDetail) {
    return (
      <div className="estimate-detail-page">
        <div className="error-container">
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button onClick={handleBack} className="btn btn-secondary">
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const { estimateSheet, estimateRequests, attachments, canEdit, currentUserRole } = estimateDetail;

  return (
    <div className="estimate-detail-page">
      {/* 헤더 */}
      <div className="detail-header">
        <div className="header-left">
          <button onClick={handleBack} className="btn btn-back">
            ← 돌아가기
          </button>
          <h1>견적 상세 정보</h1>
        </div>
        <div className="header-right">
          {canEdit && (
            <button onClick={handleEdit} className="btn btn-primary">
              수정하기
            </button>
          )}
        </div>
      </div>

      {/* 기본 정보 카드 */}
      <div className="detail-card">
        <div className="card-header">
          <h2>기본 정보</h2>
          <div className="status-section">
            {/* 관리자/직원이고 견적요청 상태인 경우 상태 변경 가능 */}
            {(currentUserRole === 'Admin' || currentUserRole === 'Staff') && estimateSheet.status === 2 ? (
              <select
                value={estimateSheet.status}
                onChange={(e) => handleStatusChange(parseInt(e.target.value))}
                className="status-select"
              >
                {statusChangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className={`status-badge ${getStatusBadgeClass(estimateSheet.status)}`}>
                {estimateSheet.statusText}
              </span>
            )}
          </div>
        </div>
        <div className="card-content">
          <div className="info-grid">
            <div className="info-item">
              <label>견적번호</label>
              <span>{estimateSheet.curEstimateNo || estimateSheet.tempEstimateNo}</span>
            </div>
            <div className="info-item">
              <label>임시견적번호</label>
              <span>{estimateSheet.tempEstimateNo}</span>
            </div>
            <div className="info-item">
              <label>요청일자</label>
              <span>{formatDate(estimateSheet.createdDate)}</span>
            </div>
            <div className="info-item">
              <label>고객사</label>
              <span>{estimateSheet.customerName}</span>
            </div>
            <div className="info-item">
              <label>작성자</label>
              <span>{estimateSheet.writerName}</span>
            </div>
            <div className="info-item">
              <label>담당자</label>
              <span>{estimateSheet.managerName || '미지정'}</span>
            </div>
            {estimateSheet.project && (
              <div className="info-item full-width">
                <label>프로젝트명</label>
                <span>{estimateSheet.project}</span>
              </div>
            )}
            {estimateSheet.customerRequirement && (
              <div className="info-item full-width">
                <label>고객 요구사항</label>
                <span className="requirement-text">{estimateSheet.customerRequirement}</span>
              </div>
            )}
            {estimateSheet.staffComment && (
              <div className="info-item full-width">
                <label>직원 코멘트</label>
                <span className="comment-text">{estimateSheet.staffComment}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          기본정보
        </button>
        <button 
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          견적요청 목록 ({estimateRequests.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'attachments' ? 'active' : ''}`}
          onClick={() => setActiveTab('attachments')}
        >
          첨부파일 ({attachments.length})
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'basic' && (
        <div className="tab-content">
          <div className="detail-card">
            <div className="card-header">
              <h3>권한 정보</h3>
            </div>
            <div className="card-content">
              <div className="permission-info">
                <div className="permission-item">
                  <label>현재 사용자 역할:</label>
                  <span className="role-badge">{currentUserRole}</span>
                </div>
                <div className="permission-item">
                  <label>편집 권한:</label>
                  <span className={`permission-badge ${canEdit ? 'allowed' : 'denied'}`}>
                    {canEdit ? '편집 가능' : '읽기 전용'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="tab-content">
          <div className="detail-card">
            <div className="card-header">
              <h3>견적요청 목록</h3>
            </div>
            <div className="card-content">
              {estimateRequests.length === 0 ? (
                <div className="empty-state">
                  <p>등록된 견적요청이 없습니다.</p>
                </div>
              ) : (
                <div className="requests-table-container">
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Tag No.</th>
                        <th>수량</th>
                        <th>매체</th>
                        <th>유체</th>
                        <th>Body Size</th>
                        <th>Body Mat</th>
                        <th>Trim Mat</th>
                        <th>Actuator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimateRequests.map((request, requestIndex) => 
                        request.tagNos.map((tagNo, tagIndex) => (
                          <tr key={`${requestIndex}-${tagNo.sheetID}`}>
                            <td>{requestIndex + 1}-{tagIndex + 1}</td>
                            <td>{tagNo.tagNo}</td>
                            <td>{tagNo.qty}</td>
                            <td>{tagNo.medium || '-'}</td>
                            <td>{tagNo.fluid || '-'}</td>
                            <td>{tagNo.bodySize || '-'}</td>
                            <td>{tagNo.bodyMat || '-'}</td>
                            <td>{tagNo.trimMat || '-'}</td>
                            <td>{tagNo.actType || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attachments' && (
        <div className="tab-content">
          <div className="detail-card">
            <div className="card-header">
              <h3>첨부파일</h3>
            </div>
            <div className="card-content">
              {attachments.length === 0 ? (
                <div className="empty-state">
                  <p>첨부된 파일이 없습니다.</p>
                </div>
              ) : (
                <div className="attachments-list">
                  {attachments.map((attachment) => (
                    <div key={attachment.attachmentID} className="attachment-item">
                      <div className="attachment-info">
                        <div className="attachment-name">{attachment.fileName}</div>
                        <div className="attachment-meta">
                          <span>크기: {formatFileSize(attachment.fileSize || 0)}</span>
                          <span>업로드: {formatDate(attachment.uploadDate)}</span>
                          {attachment.uploadUserName && (
                            <span>업로드자: {attachment.uploadUserName}</span>
                          )}
                        </div>
                      </div>
                      <div className="attachment-actions">
                        <button 
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            // 다운로드 기능은 추후 구현
                            console.log('Download:', attachment.attachmentID);
                          }}
                        >
                          다운로드
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstimateDetailPage;
