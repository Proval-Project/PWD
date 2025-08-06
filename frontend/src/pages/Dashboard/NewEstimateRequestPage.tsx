import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './DashboardPages.css';
import './NewEstimateRequest.css';
import UserSearchModal from '../../components/UserSearchModal';
import { UserListResponseDto } from '../../api/userManagement';
import { 
  createEstimateSheet, 
  createEstimateRequest, 
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  downloadAttachment,
  CreateEstimateSheetDto,
  CreateEstimateRequestDto,
  EstimateAttachmentResponseDto
} from '../../api/estimateRequest';

interface TypeItem {
  id: string;
  name: string;
  quantity: number;
}

interface ValveItem {
  id: string;
  tagno: string;
  qty: number;
  medium?: string;
  fluid?: string;
}

interface EstimateFormData {
  project: string;
  customerRequirement: string;
  types: TypeItem[];
  valves: ValveItem[];
  currentValve: CreateEstimateRequestDto;
}

const NewEstimateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [tempEstimateNo, setTempEstimateNo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<EstimateAttachmentResponseDto[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  
  // localStorage에서 선택된 고객 정보 가져오기
  const [selectedCustomer, setSelectedCustomer] = useState<UserListResponseDto | null>(() => {
    const savedCustomer = localStorage.getItem('selectedCustomer');
    if (savedCustomer) {
      const customer = JSON.parse(savedCustomer);
      // 사용 후 localStorage에서 제거
      localStorage.removeItem('selectedCustomer');
      return customer;
    }
    return null;
  });

  const [formData, setFormData] = useState<EstimateFormData>({
    project: '',
    customerRequirement: '',
    types: [],
    valves: [],
    currentValve: {
      tagno: '',
      qty: 1,
      medium: '',
      fluid: '',
      isQM: false,
      flowRateUnit: '',
      flowRateMaxQ: undefined,
      flowRateNorQ: undefined,
      flowRateMinQ: undefined,
      isP2: false,
      inletPressureUnit: '',
      inletPressureMaxQ: undefined,
      inletPressureNorQ: undefined,
      inletPressureMinQ: undefined,
      outletPressureUnit: '',
      outletPressureMaxQ: undefined,
      outletPressureNorQ: undefined,
      outletPressureMinQ: undefined,
      differentialPressureUnit: '',
      differentialPressureMaxQ: undefined,
      differentialPressureNorQ: undefined,
      differentialPressureMinQ: undefined,
      inletTemperatureUnit: '',
      inletTemperatureQ: undefined,
      inletTemperatureNorQ: undefined,
      inletTemperatureMinQ: undefined,
      densityUnit: '',
      density: undefined,
      molecularWeightUnit: '',
      molecularWeight: undefined,
      bodySizeUnit: '',
      bodySize: '',
      bodyMat: '',
      trimMat: '',
      trimOption: '',
      bodyRatingUnit: '',
      bodyRating: '',
      actType: '',
      isHW: false,
      isPositioner: false,
      positionerType: '',
      explosionProof: '',
      isTransmitter: false,
      isSolenoid: false,
      isLimSwitch: false,
      isAirSet: false,
      isVolumeBooster: false,
      isAirOperated: false,
      isLockUp: false,
      isSnapActingRelay: false
    }
  });



  // Step 1: Type 관리
  const addType = () => {
    const newType: TypeItem = {
      id: `type-${Date.now()}`,
      name: `Type ${formData.types.length + 1}`,
      quantity: 1
    };
    setFormData(prev => ({
      ...prev,
      types: [...prev.types, newType]
    }));
  };

  const removeType = (id: string) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.filter(type => type.id !== id)
    }));
  };

  const updateType = (id: string, field: keyof TypeItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      types: prev.types.map(type => 
        type.id === id ? { ...type, [field]: value } : type
      )
    }));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(formData.types);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFormData(prev => ({
      ...prev,
      types: items
    }));
  };

  // Step 2: Valve 관리
  const addValve = (typeName: string) => {
    const newValve: ValveItem = {
      id: `valve-${Date.now()}`,
      tagno: `${typeName}-${formData.valves.filter(v => v.tagno.startsWith(typeName)).length + 1}`,
      qty: 1,
      medium: '',
      fluid: ''
    };
    setFormData(prev => ({
      ...prev,
      valves: [...prev.valves, newValve]
    }));
  };

  const removeValve = (id: string) => {
    setFormData(prev => ({
      ...prev,
      valves: prev.valves.filter(valve => valve.id !== id)
    }));
  };

  const updateValve = (id: string, field: keyof ValveItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      valves: prev.valves.map(valve => 
        valve.id === id ? { ...valve, [field]: value } : valve
      )
    }));
  };



  // 파일 업로드
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !tempEstimateNo) return;

    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      await uploadAttachment(tempEstimateNo, selectedFile, currentUser.userID || 'admin');
      await loadAttachments();
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '파일 업로드에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async () => {
    if (!tempEstimateNo) return;
    try {
      const atts = await getAttachments(tempEstimateNo);
      setAttachments(atts);
    } catch (err) {
      console.error('첨부파일 로드 실패:', err);
    }
  };

  const handleFileDelete = async (attachmentID: number) => {
    try {
      await deleteAttachment(attachmentID);
      await loadAttachments();
    } catch (err) {
      setError('파일 삭제에 실패했습니다.');
    }
  };

  const handleFileDownload = async (attachmentID: number, fileName: string) => {
    try {
      const blob = await downloadAttachment(attachmentID);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('파일 다운로드에 실패했습니다.');
    }
  };

  // 사용자 선택 핸들러
  const handleCustomerSelect = (user: UserListResponseDto) => {
    setSelectedCustomer(user);
  };



  // 견적 시트 생성
  const createEstimateSheetAsync = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const dto: CreateEstimateSheetDto = {
        project: formData.project,
        customerRequirement: formData.customerRequirement,
        customerID: selectedCustomer?.userID || currentUser.userID,
        writerID: currentUser.userID // 현재 로그인한 사용자 ID로 설정
      };
      const tempNo = await createEstimateSheet(dto);
      setTempEstimateNo(tempNo);
      return tempNo;
    } catch (err: any) {
      setError(err.response?.data?.message || '견적 시트 생성에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 견적 요청 생성
  const createEstimateRequestAsync = async (valve: ValveItem) => {
    if (!tempEstimateNo) return;

    try {
      const dto: CreateEstimateRequestDto = {
        ...formData.currentValve,
        tagno: valve.tagno,
        qty: valve.qty,
        medium: valve.medium,
        fluid: valve.fluid
      };
      await createEstimateRequest(tempEstimateNo, dto);
    } catch (err: any) {
      setError(err.response?.data?.message || '견적 요청 생성에 실패했습니다.');
      throw err;
    }
  };

  // 임시저장
  const handleTemporarySave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tempEstimateNo) {
        await createEstimateSheetAsync();
      }

      // 모든 valve에 대해 견적 요청 생성
      for (const valve of formData.valves) {
        await createEstimateRequestAsync(valve);
      }

      alert('임시저장되었습니다.');
    } catch (err) {
      console.error('임시저장 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 견적 요청
  const handleEstimateRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tempEstimateNo) {
        await createEstimateSheetAsync();
      }

      // 모든 valve에 대해 견적 요청 생성
      for (const valve of formData.valves) {
        await createEstimateRequestAsync(valve);
      }

      alert('견적 요청이 완료되었습니다.');
      navigate('/estimate-request');
    } catch (err) {
      console.error('견적 요청 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 다음 단계로
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 단계로
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="new-estimate-request-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            &lt;
          </button>
          <h1>신규 견적 요청</h1>
        </div>
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>Step 1</div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>Step 2</div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>Step 3</div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="main-content">
        {/* Step 1: Type 선택 */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>Step 1: Type 선택</h2>
            
            <div className="form-section">
              <h3>프로젝트 정보</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>프로젝트명</label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                    placeholder="프로젝트명을 입력하세요"
                  />
                </div>
                <div className="form-group">
                  <label>고객 요구사항</label>
                  <textarea
                    value={formData.customerRequirement}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerRequirement: e.target.value }))}
                    placeholder="고객 요구사항을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>고객 선택</label>
                  <div className="user-select">
                    <input
                      type="text"
                      value={selectedCustomer ? `${selectedCustomer.companyName} - ${selectedCustomer.name}` : ''}
                      placeholder="고객을 검색하여 선택하세요"
                      readOnly
                    />
                    <button 
                      type="button" 
                      className="btn-search"
                      onClick={() => setShowCustomerSearch(true)}
                    >
                      검색
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>작성자</label>
                  <div className="writer-info">
                    <span className="writer-name">현재 로그인한 사용자</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h3>Type 목록</h3>
                <button className="btn-add" onClick={addType}>Type 추가</button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="types">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="type-list">
                      {formData.types.map((type, index) => (
                        <Draggable key={type.id} draggableId={type.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="type-item"
                            >
                              <div className="drag-handle">⋮⋮</div>
                              <div className="type-content">
                                <input
                                  type="text"
                                  value={type.name}
                                  onChange={(e) => updateType(type.id, 'name', e.target.value)}
                                  placeholder="Type명"
                                />
                                <input
                                  type="number"
                                  value={type.quantity}
                                  onChange={(e) => updateType(type.id, 'quantity', parseInt(e.target.value) || 0)}
                                  placeholder="수량"
                                  min="1"
                                />
                              </div>
                              <button 
                                className="btn-remove" 
                                onClick={() => removeType(type.id)}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        )}

        {/* Step 2: Valve 추가 */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>Step 2: Valve 추가</h2>
            
            <div className="valve-sections">
              {formData.types.map(type => (
                <div key={type.id} className="valve-section">
                  <div className="section-header">
                    <h3>{type.name} ({type.quantity})</h3>
                    <button 
                      className="btn-add" 
                      onClick={() => addValve(type.name)}
                    >
                      Valve 추가
                    </button>
                  </div>
                  
                  <div className="valve-list">
                    {formData.valves
                      .filter(valve => valve.tagno.startsWith(type.name))
                      .map(valve => (
                        <div key={valve.id} className="valve-item">
                          <div className="valve-content">
                            <input
                              type="text"
                              value={valve.tagno}
                              onChange={(e) => updateValve(valve.id, 'tagno', e.target.value)}
                              placeholder="Tag No"
                            />
                            <input
                              type="number"
                              value={valve.qty}
                              onChange={(e) => updateValve(valve.id, 'qty', parseInt(e.target.value) || 0)}
                              placeholder="수량"
                              min="1"
                            />
                            <input
                              type="text"
                              value={valve.medium || ''}
                              onChange={(e) => updateValve(valve.id, 'medium', e.target.value)}
                              placeholder="Medium"
                            />
                            <input
                              type="text"
                              value={valve.fluid || ''}
                              onChange={(e) => updateValve(valve.id, 'fluid', e.target.value)}
                              placeholder="Fluid"
                            />
                          </div>
                          <button 
                            className="btn-remove" 
                            onClick={() => removeValve(valve.id)}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 상세 사양 */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>Step 3: 상세 사양</h2>
            <p>상세 사양 입력 폼이 여기에 표시됩니다.</p>
          </div>
        )}
      </div>

      {/* 첨부파일 섹션 */}
      <div className="attachments-section">
        <h3>첨부파일</h3>
        <div className="file-upload">
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          />
          <button 
            className="btn-upload" 
            onClick={handleFileUpload}
            disabled={!selectedFile || loading}
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
        </div>
        
        <div className="attachment-list">
          {attachments.map(attachment => (
            <div key={attachment.attachmentID} className="attachment-item">
              <span className="file-name">{attachment.fileName}</span>
              <div className="attachment-actions">
                <button 
                  className="btn-download"
                  onClick={() => handleFileDownload(attachment.attachmentID, attachment.fileName)}
                >
                  다운로드
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleFileDelete(attachment.attachmentID)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div className="bottom-actions">
        <div className="action-buttons">
          <button 
            className="btn-prev" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            이전
          </button>
          
          {currentStep < 3 ? (
            <button 
              className="btn-next" 
              onClick={nextStep}
              disabled={formData.types.length === 0}
            >
              다음
            </button>
          ) : (
            <div className="final-actions">
              <button 
                className="btn-temporary" 
                onClick={handleTemporarySave}
                disabled={loading}
              >
                {loading ? '저장 중...' : '임시저장'}
              </button>
              <button 
                className="btn-submit" 
                onClick={handleEstimateRequest}
                disabled={loading}
              >
                {loading ? '요청 중...' : '견적 요청'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 사용자 검색 모달들 */}
      <UserSearchModal
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        onSelectUser={handleCustomerSelect}
        title="고객 검색"
      />
      

    </div>
  );
};

export default NewEstimateRequestPage; 