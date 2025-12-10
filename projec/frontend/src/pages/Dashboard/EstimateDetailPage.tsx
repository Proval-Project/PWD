import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getEstimateDetail, assignEstimate } from '../../api/estimateRequest';
import { buildApiUrl, buildClientAppUrl } from '../../config/api';
import './DashboardPages.css';
import './EstimateDetailPage.css';
import { IoIosArrowBack } from "react-icons/io";
import { MdArrowForward } from 'react-icons/md';
import { FaDownload } from 'react-icons/fa';
import { FaFilePdf, FaFileExcel, FaFileWord, FaFileImage, FaFileAlt } from 'react-icons/fa';

// 단위/사이즈 마스터 데이터 타입
interface BodySizeListDto {
  sizeUnitCode: string;  // RatingUnitCode와 동일한 패턴
  bodySizeCode: string;
  bodySize: string;
  sizeUnit: string;      // RatingUnit과 동일한 패턴
}

interface TrimPortSizeListDto {
  portSizeCode: string;
  unitCode: string;
  portSize: string;
  unitName: string;  // 단위명 (inch, mm 등)
}

// 크로스플랫폼 경로 처리를 위한 유틸리티 함수
const isManagerFile = (filePath: string): boolean => {
  if (!filePath) return false;
  
  // Windows와 Unix 경로 모두 지원
  const normalizedPath = filePath.replace(/\\/g, '/'); // Windows 백슬래시를 슬래시로 변환
  
  // 다양한 경로 패턴 지원
  const managerFilePatterns = [
    '/ResultFiles/',
    '\\ResultFiles\\',
    'ResultFiles/',
    'ResultFiles\\'
  ];
  
  return managerFilePatterns.some(pattern => normalizedPath.includes(pattern));
};

// 경로에서 managerFileType 추출하는 크로스플랫폼 함수
const extractManagerFileType = (filePath: string): string | null => {
  if (!filePath) return null;
  
  const normalizedPath = filePath.replace(/\\/g, '/');
  const pathParts = normalizedPath.split('/');
  const resultFilesIndex = pathParts.findIndex(part => part === 'ResultFiles');
  
  if (resultFilesIndex !== -1 && resultFilesIndex + 1 < pathParts.length) {
    return pathParts[resultFilesIndex + 1];
  }
  
  return null;
};

// CustomerRequest 파일인지 확인하는 크로스플랫폼 함수 (하위 고객요청 첨부 영역에 사용)
const isCustomerFile = (filePath: string): boolean => {
  if (!filePath) return false;
  
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  const customerFilePatterns = [
    '/CustomerRequest/',
    '\\CustomerRequest\\',
    'CustomerRequest/',
    'CustomerRequest\\'
  ];
  
  return customerFilePatterns.some(pattern => normalizedPath.includes(pattern));
};

// ResultFiles/customer 파인지 확인 (상단 "고객 제출 문서 업로드" 전용)
const isResultCustomerFile = (filePath: string): boolean => {
  if (!filePath) return false;
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  return normalizedPath.includes('/resultfiles/customer/');
};

interface AccessorySelectorProps {
  accTypeKey: string;
  typeCode: string;
  currentAcc: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
  accMakerList: any[];
  accModelList: any[];
  onAccessoryChange: (accessory: any) => void;
  isReadOnly: boolean;
}

interface ValveData {
  id: string;
  tagNo: string;
  qty: number;
  order: number;
  sheetID: number;
  typeId: string;
  fluid: {
    medium: string;
    fluid: string;
    density: string;
    molecular: string;
    t1: { max: number; normal: number; min: number; };
    p1: { max: number; normal: number; min: number; };
    p2: { max: number; normal: number; min: number; };
    dp: { max: number; normal: number; min: number; };
    qm: { max: number; normal: number; min: number; unit: string; };
    qn: { max: number; normal: number; min: number; unit: string; };
    pressureUnit: string;
    temperatureUnit: string;
  };
  body: {
    type: string;
    typeCode: string;
    size: string;
    sizeUnit: string;
    materialBody: string;
    materialTrim: string;
    option: string;
    rating: string;
    ratingUnit: string;
  };
  actuator: {
    type: string;
    hw: string;
  };
  accessory: {
    positioner: { type: string; exists: boolean; };
    explosionProof: string;
    transmitter: { type: string; exists: boolean; };
    solenoidValve: boolean;
    limitSwitch: boolean;
    airSet: boolean;
    volumeBooster: boolean;
    airOperatedValve: boolean;
    lockupValve: boolean;
    snapActingRelay: boolean;
  };
  isQM: boolean;
  isP2: boolean;
  isN1: boolean;
  isDensity: boolean;
  isHW: boolean;
}

interface TypeData {
  id: string;
  name: string;
  code: string;
  count: number;
  order: number;
}

interface BodyValveData {
  valveSeries: string;
  valveSeriesCode: string;
}



// 🔑 파일 관련 타입 추가
interface EstimateAttachment {
  attachmentID: number;
  tempEstimateNo: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
  uploadUserID: string | null;
  managerFileType: string;
}

// StaffCommentSection 컴포넌트를 EstimateDetailPage 바깥으로 분리
interface StaffCommentSectionProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isReadOnly: boolean;
}

const StaffCommentSection = React.memo<StaffCommentSectionProps>(({ value, onChange, isReadOnly }) => {
  console.log("StaffCommentSection is rendering"); // 디버깅용 로그
  return (
    <div className="step-section-detail">
      <div className="step-header-detail">
        <h3>관리자 코멘트</h3>
      </div>
      <div className="staff-comment-content-detail">
        <textarea
          value={value} // props로 받은 value 사용
          onChange={onChange} // props로 받은 onChange 사용
          readOnly={isReadOnly} // props로 받은 isReadOnly 사용
          placeholder="관리자 코멘트가 없습니다."
          className="staff-comment-textarea-detail"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
});

const EstimateDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tempEstimateNo } = useParams<{ tempEstimateNo: string }>();
  
  // 상태 관리
  const [types, setTypes] = useState<TypeData[]>([]);
  const [valves, setValves] = useState<ValveData[]>([]);
  const [selectedValve, setSelectedValve] = useState<ValveData | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 마스터 데이터
  const [bodyValveList, setBodyValveList] = useState<BodyValveData[]>([]);
  const [bodySizeList, setBodySizeList] = useState<BodySizeListDto[]>([]);
  const [bodySizeUnits, setBodySizeUnits] = useState<any[]>([]); // BodySizeUnit 데이터 추가
  const [bodyMatList, setBodyMatList] = useState<any[]>([]);
  const [trimMatList, setTrimMatList] = useState<any[]>([]);
  const [trimOptionList, setTrimOptionList] = useState<any[]>([]);
  const [bodyRatingList, setBodyRatingList] = useState<any[]>([]);
  
  // Step 3 마스터 데이터
  const [bodyBonnetList, setBodyBonnetList] = useState<any[]>([]);
  const [bodyConnectionList, setBodyConnectionList] = useState<any[]>([]);
  const [trimTypeList, setTrimTypeList] = useState<any[]>([]);
  const [trimSeriesList, setTrimSeriesList] = useState<any[]>([]);
  const [trimPortSizeList, setTrimPortSizeList] = useState<TrimPortSizeListDto[]>([]);
  const [trimFormList, setTrimFormList] = useState<any[]>([]);
  const [actTypeList, setActTypeList] = useState<any[]>([]);
  const [actSeriesList, setActSeriesList] = useState<any[]>([]);
  const [actSizeList, setActSizeList] = useState<any[]>([]);
  const [actHWList, setActHWList] = useState<any[]>([]);
  const [accMakerList, setAccMakerList] = useState<any[]>([]);
  const [accModelList, setAccModelList] = useState<any[]>([]);
  const [accMakerListByType, setAccMakerListByType] = useState<{ [key: string]: any[] }>({});
  const [accModelListByType, setAccModelListByType] = useState<{ [key: string]: any[] }>({});
  
  // 기타 데이터
  const [customerRequirement, setCustomerRequirement] = useState(''); // 고객 요청사항
  const [staffComment, setStaffComment] = useState(''); // 관리자 코멘트
  const [estimateData, setEstimateData] = useState<any>(null); // 견적 상세 데이터 (권한 체크용)

  // useCallback을 사용하여 함수가 불필요하게 재생성되는 것을 방지
  const handleStaffCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setStaffComment(e.target.value);
  }, []); // 의존성 배열이 비어있으므로 이 함수는 처음 한 번만 생성됩니다
  
  const [attachments, setAttachments] = useState<File[]>([]);
  const [customerAttachments, setCustomerAttachments] = useState<any[]>([]); // 고객 요청 첨부파일
  const [managerAttachments, setManagerAttachments] = useState<any[]>([]); // 관리 첨부파일
  const [currentStatus, setCurrentStatus] = useState<string>('견적요청');
  const [isReadOnly, setIsReadOnly] = useState(false); // 읽기 전용 상태 

  // 🔑 파일 관리 상태 추가
  const [managerFiles, setManagerFiles] = useState<EstimateAttachment[]>([]);
  const [customerFiles, setCustomerFiles] = useState<EstimateAttachment[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  // 🔑 PDF 업로드 관련 state 추가
  const [selectedPdfFiles, setSelectedPdfFiles] = useState<{ [key: string]: File | null }>({
    datasheet: null,
    cvlist: null,
    vllist: null,
    singlequote: null,
    multiquote: null
  });

  // 🔑 PDF 뷰어를 위한 state 추가
  const [uploadedPdfUrls, setUploadedPdfUrls] = useState<{ [key: string]: string | null }>({
    datasheet: null,
    cvlist: null,
    vllist: null,
    singlequote: null,
    multiquote: null
  });

  // 견적 시작 여부(UI 토글)
  const [quoteStarted, setQuoteStarted] = useState(false);
  // 서류 발급 생성/다운로드 진행 상태
  const [docGenerating, setDocGenerating] = useState<Record<string, boolean>>({});
  // Conval 호출 상태 관리
  const [isConvalProcessing, setIsConvalProcessing] = useState<boolean>(false);
  // 요약카드 표시값 상태
  const [summaryEstimateNo, setSummaryEstimateNo] = useState<string>('-');
  const [summaryCompanyName, setSummaryCompanyName] = useState<string>('-');
  const [summaryRequesterName, setSummaryRequesterName] = useState<string>('-');
  const [summaryRequestDate, setSummaryRequestDate] = useState<string>('-');
  const [summaryManager, setSummaryManager] = useState<string>('-');
  const [summaryCompletedDate, setSummaryCompletedDate] = useState<string>('-');

  // 🔑 파일 입력 ref 추가
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({
    datasheet: null,
    cvlist: null,
    vllist: null,
    singlequote: null,
    multiquote: null
  });

  // 고객 첨부 다중 업로드용 상태
  const [selectedCustomerFiles, setSelectedCustomerFiles] = useState<File[]>([]);
  const customerAddInputRef = useRef<HTMLInputElement | null>(null);

  // 이미 로드된 sheetID를 추적하여 중복 로드 방지
  const [loadedSheetIDs, setLoadedSheetIDs] = useState<Set<number>>(new Set());

  // ACC 섹션 선택 상태 관리
  const [accSelections, setAccSelections] = useState<{
    positioner: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
    solenoid: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
    limiter: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
    airSupply: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
    volumeBooster: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
    airOperator: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
    lockUp: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
    snapActingRelay: { typeCode: string; makerCode: string; modelCode: string; specification: string; };
  }>({ // 각 악세사리의 typeCode를 하드코딩된 값으로 초기화
    positioner: { typeCode: 'A', makerCode: '', modelCode: '', specification: '' },
    solenoid: { typeCode: 'B', makerCode: '', modelCode: '', specification: '' },
    limiter: { typeCode: 'C', makerCode: '', modelCode: '', specification: '' },
    airSupply: { typeCode: 'D', makerCode: '', modelCode: '', specification: '' },
    volumeBooster: { typeCode: 'E', makerCode: '', modelCode: '', specification: '' },
    airOperator: { typeCode: 'F', makerCode: '', modelCode: '', specification: '' },
    lockUp: { typeCode: 'G', makerCode: '', modelCode: '', specification: '' },
    snapActingRelay: { typeCode: 'H', makerCode: '', modelCode: '', specification: '' },
  });

  // 모든 상태 변수 선언 후, 렌더링 시 accSelections 상태 로깅
  //console.log('EstimateDetailPage render - accSelections:', accSelections);

  // TagNo별 사용자 선택값 임시 저장 (TagNo 변경 시 복원용)
  const [tempSelections, setTempSelections] = useState<{
    [sheetID: number]: {
      body: any;
      trim: any;
      act: any;
      acc: any;
    };
  }>({});
  // 파일 내 함수들 사이 아무 곳에 추가
  const buildSaveSpecFromSelections = (sel: { body:any; trim:any; act:any; acc:any; valveTypeCode?:string }) => ({
    valveId: sel.valveTypeCode || '',
    body: { bonnetType: sel.body?.bonnetType || '', materialBody: sel.body?.materialBody || '', rating: sel.body?.ratingCode || '', ratingUnit: sel.body?.ratingUnitCode || '', connection: sel.body?.connection || '', sizeUnit: sel.body?.sizeBodyUnitCode || '', size: sel.body?.sizeBodyCode || '' },
    trim: { type: sel.trim?.trimType || '', series: sel.trim?.trimSeries || '', portSize: sel.trim?.sizePortCode || '', portSizeUnit: sel.trim?.sizePortUnitCode || '', form: sel.trim?.formCode || sel.trim?.form || '', materialTrim: sel.trim?.materialTrim || '', option: sel.trim?.option || '' },
    actuator: { type: sel.act?.actionType || '', series: sel.act?.series || '', size: sel.act?.size || '', hw: sel.act?.hw || '' },
    accessories: {
      PosCode: sel.acc?.positioner?.modelCode || null, PosMakerCode: sel.acc?.positioner?.makerCode || null,
      SolCode: sel.acc?.solenoid?.modelCode || null,   SolMakerCode: sel.acc?.solenoid?.makerCode || null,
      LimCode: sel.acc?.limiter?.modelCode || null,    LimMakerCode: sel.acc?.limiter?.makerCode || null,
      ASCode: sel.acc?.airSupply?.modelCode || null,   ASMakerCode: sel.acc?.airSupply?.makerCode || null,
      VolCode: sel.acc?.volumeBooster?.modelCode || null, VolMakerCode: sel.acc?.volumeBooster?.makerCode || null,
      AirOpCode: sel.acc?.airOperator?.modelCode || null,  AirOpMakerCode: sel.acc?.airOperator?.makerCode || null,
      LockupCode: sel.acc?.lockUp?.modelCode || null,  LockupMakerCode: sel.acc?.lockUp?.makerCode || null,
      SnapActCode: sel.acc?.snapActingRelay?.modelCode || null, SnapActMakerCode: sel.acc?.snapActingRelay?.makerCode || null
    }
  });

  // 현재 선택값을 tempSelections에 저장하는 함수
  const saveCurrentSelections = (sheetID: number) => {
    if (sheetID) {
      setTempSelections(prev => ({
        ...prev,
        [sheetID]: {
          body: { ...bodySelections },
          trim: { ...trimSelections },
          act: { ...actSelections },
          acc: { ...accSelections }
        }
      }));
      //console.log(`${sheetID}의 선택값들을 임시 저장했습니다.`);
    }
  };

  // valve 선택 시 호출되는 함수
  const handleValveSelection = (valve: ValveData) => {
    // 현재 태그에서 떠나기 전, 현재 선택값 임시 저장
    if (selectedValve) {
      setTempSelections(prev => ({
        ...prev,
        [selectedValve.sheetID]: {
          body: { ...bodySelections },
          trim: { ...trimSelections },
          act:  { ...actSelections },
          acc:  { ...accSelections },
        }
      }));
    }
  
    setSelectedValve(valve);
  
    // 새 태그에 대해: 임시값 있으면 그걸 복원, 없으면 서버 초기값 로드
    console.log('🔍 handleValveSelection - sheetID:', valve.sheetID, 'tempSelections 존재:', !!tempSelections[valve.sheetID]);
    if (tempSelections[valve.sheetID]) {
      console.log('⚠️ handleValveSelection - tempSelections에서 복원');
      const saved = tempSelections[valve.sheetID];
      // 복원(각 selections set 함수 호출)
      setBodySelections(saved.body || {});
      setTrimSelections(saved.trim || {});
      setActSelections(saved.act || {});
      setAccSelections(saved.acc || {});
    } else {
      console.log('🔍 handleValveSelection - loadInitialSpecification 호출');
      loadInitialSpecification(valve.sheetID);
    }
  };

  const handleTypeSelection = (type: TypeData) => {
    setSelectedType(type.id);
    setSelectedValve(null); // Type을 변경하면 선택된 Valve는 초기화됩니다.
  };

                    // Body 섹션 선택 상태 관리
                  const [bodySelections, setBodySelections] = useState({
                    bonnetType: '',
                    bonnetTypeCode: '', // Code 값 추가
                    materialBody: '',
                    materialBodyCode: '', // Code 값 추가
                    sizeBodyUnit: '',
                    sizeBody: '',
                    sizeBodyUnitCode: '', // Code 값 추가
                    sizeBodyCode: '', // Code 값 추가
                    ratingUnit: '',
                    rating: '',
                    ratingUnitCode: '', // Code 값 추가
                    ratingCode: '', // Code 값 추가
                    connection: '',
                    connectionCode: '' // Code 값 추가
                  });
                
                  // Trim 섹션 선택 상태 관리
                  const [trimSelections, setTrimSelections] = useState({
                    trimType: '',
                    trimTypeCode: '', // Code 값 추가
                    trimSeries: '',
                    trimSeriesCode: '', // Code 값 추가
                    materialTrim: '',
                    materialTrimCode: '', // Code 값 추가
                    sizePortUnit: '',
                    sizePort: '',
                    sizePortUnitCode: '', // Code 값 추가
                    sizePortCode: '', // Code 값 추가
                    form: '',
                    formCode: '', // Code 값 추가
                    option: '' // Trim Option 필드 추가
                  });
                
                                    // ACT 섹션 선택 상태 관리
                  const [actSelections, setActSelections] = useState({
                    actionType: '',
                    actionTypeCode: '', // Code 값 추가
                    series: '',
                    seriesCode: '', // Code 값 추가
                    size: '',
                    sizeCode: '', // Code 값 추가
                    hw: '',
                    hwCode: '' // Code 값 추가
                  });

                  // 태그별 상태 초기값과 맵 상태
                  const INITIAL_BODY = {
                    bonnetType: '',
                    bonnetTypeCode: '',
                    materialBody: '',
                    materialBodyCode: '',
                    sizeBodyUnit: '',
                    sizeBody: '',
                    sizeBodyUnitCode: '',
                    sizeBodyCode: '',
                    ratingUnit: '',
                    rating: '',
                    ratingUnitCode: '',
                    ratingCode: '',
                    connection: '',
                    connectionCode: ''
                  };
                  const INITIAL_TRIM = {
                    trimType: '',
                    trimTypeCode: '',
                    trimSeries: '',
                    trimSeriesCode: '',
                    materialTrim: '',
                    materialTrimCode: '',
                    sizePortUnit: '',
                    sizePort: '',
                    sizePortUnitCode: '',
                    sizePortCode: '',
                    form: '',
                    formCode: '',
                    option: ''
                  };
                  const INITIAL_ACT = {
                    actionType: '',
                    actionTypeCode: '',
                    series: '',
                    seriesCode: '',
                    size: '',
                    sizeCode: '',
                    hw: '',
                    hwCode: ''
                  };
                  const INITIAL_ACC = {
                    positioner: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                    solenoid: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                    limiter: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                    airSupply: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                    volumeBooster: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                    airOperator: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                    lockUp: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                    snapActingRelay: { typeCode: '', makerCode: '', modelCode: '', specification: '' },
                  };

                  const [bodySelectionsBySheet, setBodySelectionsBySheet] = useState<{[key:number]: typeof INITIAL_BODY}>({});
                  const [trimSelectionsBySheet, setTrimSelectionsBySheet] = useState<{[key:number]: typeof INITIAL_TRIM}>({});
                  const [actSelectionsBySheet, setActSelectionsBySheet] = useState<{[key:number]: typeof INITIAL_ACT}>({});
                  const [accSelectionsBySheet, setAccSelectionsBySheet] = useState<{[key:number]: typeof INITIAL_ACC}>({});

                  // 태그 전환 시 해당 태그의 상태를 싱글 상태로 동기화
                  useEffect(() => {
                    const sid = selectedValve?.sheetID as number | undefined;
                    if (!sid) return;
                    
                    // 저장된 데이터가 있으면 해당 데이터 사용, 없으면 현재 상태 유지
                    // 단, 이미 로드된 sheetID이면 다시 로드하지 않음 (중복 로드 방지)
                    if (loadedSheetIDs.has(sid)) {
                      return;
                    }
                    
                    const savedBodySelections = bodySelectionsBySheet[sid];
                    const savedTrimSelections = trimSelectionsBySheet[sid];
                    const savedActSelections = actSelectionsBySheet[sid];
                    const savedAccSelections = accSelectionsBySheet[sid];
                    
                    if (savedBodySelections) {
                      setBodySelections(savedBodySelections);
                    }
                    if (savedTrimSelections) {
                      setTrimSelections(savedTrimSelections);
                    }
                    if (savedActSelections) {
                      setActSelections(savedActSelections);
                    }
                    if (savedAccSelections) {
                      setAccSelections(savedAccSelections);
                    }
                  }, [selectedValve?.sheetID, bodySelectionsBySheet, trimSelectionsBySheet, actSelectionsBySheet, accSelectionsBySheet, loadedSheetIDs]);

                  // selectedValve 변경 시 해당 TAG의 데이터 로드 (한 번만)
                  useEffect(() => {
                    const sid = selectedValve?.sheetID as number | undefined;
                    if (!sid) return;
                    
                    // 해당 TAG의 저장된 데이터가 있으면 로드, 없으면 현재 상태 유지
                    const savedBodySelections = bodySelectionsBySheet[sid];
                    const savedTrimSelections = trimSelectionsBySheet[sid];
                    const savedActSelections = actSelectionsBySheet[sid];
                    const savedAccSelections = accSelectionsBySheet[sid];
                    
                    // 저장된 데이터가 있으면 해당 데이터 사용, 없으면 현재 상태 유지
                    if (savedBodySelections) {
                      setBodySelections(prev => ({ ...prev, ...savedBodySelections }));
                    }
                    if (savedTrimSelections) {
                      setTrimSelections(prev => ({ ...prev, ...savedTrimSelections }));
                    }
                    if (savedActSelections) {
                      setActSelections(prev => ({ ...prev, ...savedActSelections }));
                    }
                    if (savedAccSelections) {
                      setAccSelections(prev => ({ ...prev, ...savedAccSelections }));
                    }
                    
                    // 액트 시리즈가 있으면 사이즈 목록 가져오기
                    if (savedActSelections?.series) {
                      fetchActSizeList(savedActSelections.series);
                    } else {
                      setActSizeList([]);
                    }
                  }, [selectedValve?.sheetID]); // 의존성 배열 단순화

                  // 상태 및 프로젝트 정보
  const [projectName, setProjectName] = useState<string>('');

  // BodyValveList 가져오기
  const fetchBodyValveList = async () => {
    try {
      const response = await fetch(buildApiUrl('/estimate/body-valve-list'));
      if (!response.ok) {
        console.error('body-valve-list 요청 실패:', response.status, response.statusText);
        setBodyValveList([]);
        return;
      }
      const data = await response.json();
      setBodyValveList(data ?? []);
    } catch (error) {
      console.error('BodyValveList 가져오기 실패:', error);
    }
  };

  // ACT Size 목록 가져오기
  const fetchActSizeList = async (actSeriesCode: string) => {
    try {
      console.log('fetchActSizeList 시작:', actSeriesCode);
      const response = await fetch(buildApiUrl(`/masterdata/act/size?actSeriesCode=${actSeriesCode}`));
      const data = await response.json();
      console.log('ACT Size API 응답:', data);
      setActSizeList(data || []);
    } catch (error) {
      console.error('ACT Size 목록 가져오기 실패:', error);
      setActSizeList([]);
    }
  };

  // 🔑 파일 관리 함수들 추가
  const fetchManagerFiles = async (): Promise<any[]> => {
    if (!tempEstimateNo) return [];
    
    try {
      setIsLoadingFiles(true);
      console.log('🔄 fetchManagerFiles 시작 - tempEstimateNo:', tempEstimateNo);
      const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/attachments`));
      console.log('📡 API 응답 상태:', response.status, response.ok);
      
      if (response.ok) {
        const attachments = await response.json();
        console.log('📥 API 응답 데이터:', attachments);
        console.log('📥 API 응답 데이터 길이:', attachments.length);
        
        // 🔑 ResultFiles 경로의 모든 파일 가져오기 (엑셀 + PDF)
        const allManagerFiles = attachments.filter((att: any) => {
          const filePath = att.path || att.filePath;
          const isManagerFileResult = filePath && isManagerFile(filePath);
          console.log('🔍 파일 필터링 체크:', att.name || att.fileName, '경로:', filePath, '관리파일여부:', isManagerFileResult);
          return isManagerFileResult;
        }).map((att: any) => {
          // 경로에서 managerFileType 추출 (크로스플랫폼)
          const filePath = att.path || att.filePath;
          att.managerFileType = extractManagerFileType(filePath);
          console.log('🏷️ 추출된 managerFileType:', att.managerFileType);
          return att;
        });
        
        setManagerFiles(allManagerFiles);
        console.log('✅ 관리자 파일 목록 로드 완료:', allManagerFiles.length, '개');
        console.log('🔍 필터링된 관리 파일들:', allManagerFiles);
        return allManagerFiles;
      } else {
        console.error('❌ API 응답 실패:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('관리자 파일 목록 조회 중 오류:', error);
      return [];
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const fetchCustomerFiles = async () => {
    if (!tempEstimateNo) return;
    
    try {
      setIsLoadingFiles(true);
      console.log('🔄 fetchCustomerFiles 시작 - tempEstimateNo:', tempEstimateNo);
      const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/attachments`));
      console.log('📡 API 응답 상태:', response.status, response.ok);
      
      if (response.ok) {
        const files = await response.json();
        const onlyResultCustomer = (files || []).filter((att: any) => isResultCustomerFile(att.filePath || att.path));
        setCustomerFiles(onlyResultCustomer);
        console.log('✅ 고객 파일 목록 로드 완료 (ResultFiles/customer 한정):', onlyResultCustomer.length, '개');
      } else {
        console.error('❌ API 응답 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('고객 파일 목록 조회 중 오류:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const deleteFile = async (managerFileType: string) => {
    if (!tempEstimateNo) return;
    
    if (!window.confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/files/${managerFileType}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // 파일 목록 새로고침
        await fetchManagerFiles();
        alert('파일이 삭제되었습니다.');
      } else {
        alert('파일 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 삭제 중 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  // 개별 첨부파일 삭제(attachmentID 기준) - 고객 다중 파일 대응
  const deleteAttachmentById = async (attachmentID: number) => {
    if (!tempEstimateNo) return;
    if (!window.confirm('정말로 이 파일을 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(buildApiUrl(`/estimate/attachments/${attachmentID}`), {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchCustomerFiles();
        await fetchManagerFiles();
      } else {
        alert('파일 삭제에 실패했습니다.');
      }
    } catch (e) {
      console.error('첨부파일 삭제 오류:', e);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      // 🔑 파일 다운로드 API 수정 - 새로 추가된 API 사용
      const response = await fetch(buildApiUrl(`/estimate/attachments/download?filePath=${encodeURIComponent(filePath)}`));
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // 🔑 다운로드 실패 시 상세 에러 정보 표시
        const errorText = await response.text();
        console.error('파일 다운로드 실패:', response.status, errorText);
        alert(`파일 다운로드에 실패했습니다. (${response.status})\n${errorText}`);
      }
    } catch (error) {
      console.error('파일 다운로드 중 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const getFileTypeDisplayName = (managerFileType: string) => {
    const typeMap: { [key: string]: string } = {
      'cvlist': 'CV List',
      'vllist': 'VL List',
      'datasheet': 'DataSheet',
      'singlequote': '단품견적서',
      'multiquote': '다수량견적서'
    };
    return typeMap[managerFileType] || managerFileType;
  };

  const formatFileSize = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  // 🔑 PDF 업로드 관련 함수들 추가
  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    // 🔑 화면 이동 방지
    event.preventDefault();
    
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('PDF 파일만 업로드 가능합니다.');
        return;
      }
      
      // 🔑 상태 업데이트를 비동기로 처리하여 화면 이동 방지
      setTimeout(() => {
        setSelectedPdfFiles(prev => ({
          ...prev,
          [fileType]: file
        }));
      }, 0);
    }
  };

  // 🔑 파일 선택을 위한 별도 함수 추가
  const handleFileSelect = (fileType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    // 고객/관리자 공통 선택기: 문서/압축 포함 광범위 허용
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.txt,.zip,.rar,.7z,.csv,.json';
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        // 고객 업로드/범용 선택: 파일 타입 제한 완화 (서버에서 최종 검증)
        
        setSelectedPdfFiles(prev => ({
          ...prev,
          [fileType]: file
        }));
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

                    // Body 섹션 이벤트 핸들러들
                  const handleBodyChange = (field: string, value: string) => {
                    setBodySelections(prev => {
                      // 기존 값들을 모두 유지하면서 특정 필드만 업데이트
                      const newSelections = { ...prev, [field]: value };
                      
                      // 기존 동기화 로직 유지...
                      if (field === 'bonnetType') {
                        const selectedItem = bodyBonnetList.find(item => item.bonnetCode === value);
                        if (selectedItem) newSelections.bonnetTypeCode = selectedItem.bonnetCode;
                      }
                      if (field === 'materialBody') {
                        const selectedItem = bodyMatList.find(item => item.bodyMatCode === value);
                        if (selectedItem) newSelections.materialBodyCode = selectedItem.bodyMatCode;
                      }
                      if (field === 'connection') {
                        const selectedItem = bodyConnectionList.find(item => item.connectionCode === value);
                        if (selectedItem) newSelections.connectionCode = selectedItem.connectionCode;
                      }
                      if (field === 'sizeBodyUnit') { 
                        newSelections.sizeBody = ''; 
                        newSelections.sizeBodyCode = ''; 
                      }
                      if (field === 'ratingUnit') { 
                        newSelections.rating = ''; 
                        newSelections.ratingCode = ''; 
                      }
                      
                      // 맵에 반영
                      const sid = selectedValve?.sheetID;
                      if (sid) {
                        setBodySelectionsBySheet((prevMap: any) => ({
                          ...prevMap,
                          [sid]: newSelections
                        }));
                      }
                      return newSelections;
                    });
                  };

                    // Trim 섹션 이벤트 핸들러들
                  const handleTrimChange = (field: string, value: string) => {
                    setTrimSelections(prev => {
                      // 기존 값들을 모두 유지하면서 특정 필드만 업데이트
                      const newSelections = { ...prev, [field]: value };
                      
                      // 기존 동기화 로직 유지...
                      if (field === 'trimType') {
                        const selectedItem = trimTypeList.find(item => item.trimTypeCode === value);
                        if (selectedItem) newSelections.trimTypeCode = selectedItem.trimTypeCode;
                      }
                      if (field === 'materialTrim') {
                        const selectedItem = trimMatList.find(item => item.trimMatCode === value);
                        if (selectedItem) newSelections.materialTrimCode = selectedItem.trimMatCode;
                      }
                      if (field === 'sizePortUnit') { 
                        newSelections.sizePort = ''; 
                        newSelections.sizePortCode = ''; 
                      }
                      if (field === 'sizePortUnitCode') { 
                        newSelections.sizePort = ''; 
                        newSelections.sizePortCode = ''; 
                      }
                      
                      // 맵에 반영
                      const sid = selectedValve?.sheetID;
                      if (sid) {
                        setTrimSelectionsBySheet((prevMap: any) => ({
                          ...prevMap,
                          [sid]: newSelections
                        }));
                      }
                      return newSelections;
                    });
                  };

                    // ACT 섹션 이벤트 핸들러들
                  const handleActChange = (field: string, value: string) => {
                    setActSelections(prev => {
                      // 기존 값들을 모두 유지하면서 특정 필드만 업데이트
                      const newSelections = { ...prev, [field]: value };
                      
                      // 시리즈가 변경되면 사이즈만 초기화 (다른 값들은 유지)
                      if (field === 'series') {
                        newSelections.size = '';
                        // 액트 사이즈 목록 새로 가져오기
                        if (value) {
                          fetchActSizeList(value);
                        } else {
                          setActSizeList([]);
                        }
                      }
                      
                      // 맵에 반영 - 기존 데이터 유지하면서 업데이트
                      const sid = selectedValve?.sheetID;
                      if (sid) {
                        setActSelectionsBySheet((prevMap: any) => ({
                          ...prevMap,
                          [sid]: newSelections
                        }));
                      }
                      return newSelections;
                    });
                  };



  // 악세사리 데이터 가져오기 (재시도 로직 포함)
  const fetchAccessoryData = async (retryCount = 0): Promise<boolean> => {
    const maxRetries = 3;
    
    try {
      console.log(`악세사리 데이터 로딩 시도 ${retryCount + 1}/${maxRetries + 1}...`);
      
      const accSearchRes = await fetch(buildApiUrl('/masterdata/acc/search'));
      
      if (accSearchRes.ok) {
        const accSearchData = await accSearchRes.json();
        console.log('악세사리 검색 데이터 로딩 성공:', accSearchData.length, '개');
        
        // 백엔드 응답 데이터 구조 확인
        if (accSearchData.length > 0) {
          console.log('🔍 백엔드 응답 데이터 첫 번째 항목 구조:', accSearchData[0]);
          console.log('🔍 백엔드 응답 데이터 첫 번째 항목의 모든 키:', Object.keys(accSearchData[0]));
        }
        
        // 메이커와 모델 데이터 분리 - 악세사리 타입별로 구분
        const allAccMakerData: any[] = [];
        const allAccModelData: any[] = [];
        
        // 악세사리 타입별로 데이터 그룹화
        const groupedByType = accSearchData.reduce((acc: any, item: any) => {
          if (!acc[item.accTypeCode]) {
            acc[item.accTypeCode] = [];
          }
          acc[item.accTypeCode].push(item);
          return acc;
        }, {});
        
        // 각 타입별로 메이커와 모델 데이터 처리
        Object.entries(groupedByType).forEach(([typeCode, items]: [string, any]) => {
          const typeItems = items as any[];
          
          // 메이커 데이터 (타입별로 중복 제거)
          typeItems.forEach((item: any) => {
            const existingMaker = allAccMakerData.find(maker => 
              maker.accMakerCode === item.accMakerCode && maker.accTypeCode === typeCode
            );
            if (!existingMaker) {
              allAccMakerData.push({
                accMakerCode: item.accMakerCode,
                accMakerName: item.accMakerName,
                accTypeCode: typeCode
              });
            }
          });
          
          // 모델 데이터
          typeItems.forEach((item: any) => {
            console.log(`🔍 ${typeCode} 타입 모델 데이터:`, {
              accMakerCode: item.accMakerCode,
              accModelCode: item.accModelCode,
              accModelName: item.accModelName,
              accSize: item.accSize,
              accTypeCode: typeCode
            });
            
            allAccModelData.push({
              accMakerCode: item.accMakerCode,
              accModelCode: item.accModelCode,
              accModelName: item.accModelName,
              accSize: item.accSize,
              accTypeCode: typeCode  // item.accTypeCode 대신 그룹화된 typeCode 사용
            });
          });
        });
        
        console.log('🔍 악세사리 타입별 데이터 그룹화 결과:', groupedByType);
        console.log('🔍 분리된 메이커 데이터:', allAccMakerData);
        console.log('🔍 분리된 모델 데이터:', allAccModelData);
        
        // 각 타입별 데이터 개수 확인
        Object.entries(groupedByType).forEach(([typeCode, items]: [string, any]) => {
          console.log(`🔍 ${typeCode} 타입: ${items.length}개`);
          const uniqueMakers = new Set(items.map((item: any) => item.accMakerCode));
          console.log(`  - 고유 메이커 수: ${uniqueMakers.size}`);
          console.log(`  - 메이커 코드들:`, Array.from(uniqueMakers));
          
          // 타입별 메이커 목록 확인
          const typeMakers = allAccMakerData.filter(maker => maker.accTypeCode === typeCode);
          console.log(`  - 타입별 메이커 목록:`, typeMakers);
        });
        
        // 악세사리 데이터 설정
        setAccMakerList(allAccMakerData);
        setAccModelList(allAccModelData);
        console.log('악세사리 데이터 설정 완료 - 메이커:', allAccMakerData.length, '개, 모델:', allAccModelData.length, '개');
        
        // accMakerList 구조 상세 확인
        console.log('🔍 accMakerList 상세 구조:');
        allAccMakerData.forEach((maker, index) => {
          console.log(`  [${index}] ${maker.accTypeCode} - ${maker.accMakerCode}: ${maker.accMakerName}`);
        });
        
        // 타입별 메이커 개수 확인
        const makerCountByType = allAccMakerData.reduce((acc: any, maker) => {
          if (!acc[maker.accTypeCode]) acc[maker.accTypeCode] = 0;
          acc[maker.accTypeCode]++;
          return acc;
        }, {});
        console.log('🔍 타입별 메이커 개수:', makerCountByType);
        
        // 타입별로 메이커와 모델 데이터 분리
        const makerDataByType: { [key: string]: any[] } = {};
        const modelDataByType: { [key: string]: any[] } = {};
        
        allAccMakerData.forEach(maker => {
          if (!makerDataByType[maker.accTypeCode]) {
            makerDataByType[maker.accTypeCode] = [];
          }
          makerDataByType[maker.accTypeCode].push(maker);
        });
        
        allAccModelData.forEach(model => {
          if (!modelDataByType[model.accTypeCode]) {
            modelDataByType[model.accTypeCode] = [];
          }
          modelDataByType[model.accTypeCode].push(model);
        });
        
        console.log('🔍 타입별 분리된 데이터:', {
          makerDataByType: Object.keys(makerDataByType).reduce((acc, key) => {
            acc[key] = makerDataByType[key].length;
            return acc;
          }, {} as any),
          modelDataByType: Object.keys(modelDataByType).reduce((acc, key) => {
            acc[key] = modelDataByType[key].length;
            return acc;
          }, {} as any)
        });
        
        // 타입별 데이터를 상태에 저장
        setAccMakerListByType(makerDataByType);
        setAccModelListByType(modelDataByType);
        
        // 악세사리 데이터 로드 완료 후 accSelections 초기화
        const initialAccSelections = {
          positioner: { typeCode: 'Positioner', makerCode: '', modelCode: '', specification: '' },
          solenoid: { typeCode: 'Solenoid', makerCode: '', modelCode: '', specification: '' },
          limiter: { typeCode: 'Limit', makerCode: '', modelCode: '', specification: '' },
          airSupply: { typeCode: 'Airset', makerCode: '', modelCode: '', specification: '' },
          volumeBooster: { typeCode: 'Volume', makerCode: '', modelCode: '', specification: '' },
          airOperator: { typeCode: 'Airoperate', makerCode: '', modelCode: '', specification: '' },
          lockUp: { typeCode: 'Lockup', makerCode: '', modelCode: '', specification: '' },
          snapActingRelay: { typeCode: 'Snapacting', makerCode: '', modelCode: '', specification: '' },
        };
        setAccSelections(initialAccSelections);
        
        return true; // 성공
      } else {
        console.error('악세사리 검색 API 응답 실패:', accSearchRes.status, accSearchRes.statusText);
        return false; // 실패
      }
    } catch (error) {
      console.error('악세사리 검색 데이터 로드 실패:', error);
      return false; // 실패
    }
  };

  // 악세사리 재로딩 핸들러
  const handleAccReload = useCallback(async () => {
    console.log('악세사리 재로딩...');
    try {
      await fetchAccessoryData();
      console.log('악세사리 데이터 재로딩 완료');
    } catch (error) {
      console.error('악세사리 데이터 재로딩 실패:', error);
    }
  }, []);

  // 마스터 데이터 가져오기
  const fetchMasterData = async () => {
    try {
      // Step 1, 2 마스터 데이터 (EstimateController)
      const [sizeRes, matRes, trimMatRes, optionRes, ratingRes] = await Promise.all([
        fetch(buildApiUrl('/estimate/body-size-list')),
        fetch(buildApiUrl('/estimate/body-mat-list')),
        fetch(buildApiUrl('/estimate/trim-mat-list')),
        fetch(buildApiUrl('/estimate/trim-option-list')),
        fetch(buildApiUrl('/estimate/body-rating-list'))
      ]);
      
      const [sizeData, matData, trimMatData, optionData, ratingData] = await Promise.all([
        sizeRes.json(),
        matRes.json(),
        trimMatRes.json(),
        optionRes.json(),
        ratingRes.json()
      ]);
      
      setBodySizeList(sizeData || []);
      setBodyMatList(matData || []);
      setTrimMatList(trimMatData || []);
      setTrimOptionList(optionData || []);
      setBodyRatingList(ratingData || []);
      //console.log('BodyRatingList 로드됨:', ratingData); // 디버깅 로그 추가

      // Step 3 마스터 데이터 (MasterDataController)
      const [bodyBonnetRes, bodyConnectionRes, trimTypeRes, trimSeriesRes, trimPortSizeRes, trimFormRes, 
            actTypeRes, actSeriesRes, actHWRes] = await Promise.all([
        fetch(buildApiUrl('/masterdata/body/bonnet')),
        fetch(buildApiUrl('/masterdata/body/connection')),
        fetch(buildApiUrl('/masterdata/trim-type')),
        fetch(buildApiUrl('/masterdata/trim/series')),
        fetch(buildApiUrl('/masterdata/trim/port-size')),
        fetch(buildApiUrl('/masterdata/trim/form')),
        fetch(buildApiUrl('/masterdata/act/type')),
        fetch(buildApiUrl('/masterdata/act/series')),
        fetch(buildApiUrl('/masterdata/act/hw'))
      ]);

      // 드래그 앤 드롭 핸들러 (추가)
const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number, listKey: 'types' | 'valves') => {
  e.dataTransfer.setData('text/plain', JSON.stringify({ index, listKey }));
};
const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
const onDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number, listKey: 'types' | 'valves') => {
  e.preventDefault();
  const { index } = JSON.parse(e.dataTransfer.getData('text/plain') || '{"index":-1}');
  if (index < 0) return;

  if (listKey === 'types') {
    setTypes(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(index, 1);
      arr.splice(dropIndex, 0, moved);
      return arr;
    });
  } else {
    setValves(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(index, 1);
      arr.splice(dropIndex, 0, moved);
      // 보기용 sheetNo 재부여(1부터)
      return arr.map((it, i) => ({ ...it, sheetNo: i + 1 }));
    });
  }
};

      // 각 API 응답을 개별적으로 처리하여 에러 발생 시에도 다른 데이터는 로드할 수 있도록 함
      let bodyBonnetData = [], bodyConnectionData = [], trimTypeData = [], trimSeriesData = [], 
          trimPortSizeData = [], trimFormData = [], actTypeData = [], actSeriesData = [], 
          actHWData = [];

      try {
        bodyBonnetData = await bodyBonnetRes.json();
        //console.log('Body Bonnet 데이터 로드 성공:', bodyBonnetData.length);
      } catch (e) {
        console.error('Body Bonnet 데이터 파싱 실패:', e);
      }

      try {
        bodyConnectionData = await bodyConnectionRes.json();
        //console.log('Body Connection 데이터 로드 성공:', bodyConnectionData.length);
      } catch (e) {
        console.error('Body Connection 데이터 파싱 실패:', e);
      }

      try {
        trimTypeData = await trimTypeRes.json();
        //console.log('Trim Type 데이터 로드 성공:', trimTypeData.length);
      } catch (e) {
        console.error('Trim Type 데이터 파싱 실패:', e);
      }

      try {
        trimSeriesData = await trimSeriesRes.json();
        //console.log('Trim Series 데이터 로드 성공:', trimSeriesData.length);
      } catch (e) {
        console.error('Trim Series 데이터 파싱 실패:', e);
      }

      try {
        trimPortSizeData = await trimPortSizeRes.json();
        //console.log('Trim Port Size 데이터 로드 성공:', trimPortSizeData.length);
      } catch (e) {
        console.error('Trim Port Size 데이터 파싱 실패:', e);
      }

      try {
        trimFormData = await trimFormRes.json();
        //console.log('Trim Form 데이터 로드 성공:', trimFormData.length);
      } catch (e) {
        console.error('Trim Form 데이터 파싱 실패:', e);
      }

      try {
        actTypeData = await actTypeRes.json();
        //console.log('Act Type 데이터 로드 성공:', actTypeData.length);
      } catch (e) {
        console.error('Act Type 데이터 파싱 실패:', e);
      }

      try {
        actSeriesData = await actSeriesRes.json();
        //console.log('Act Series 데이터 로드 성공:', actSeriesData.length);
      } catch (e) {
        console.error('Act Series 데이터 파싱 실패:', e);
      }

      try {
        actHWData = await actHWRes.json();
        //console.log('Act HW 데이터 로드 성공:', actHWData.length);
      } catch (e) {
        console.error('Act HW 데이터 파싱 실패:', e);
      }



      // 악세사리 데이터 로딩은 별도 함수로 분리하여 재시도 가능하도록 함
      await fetchAccessoryData();



      setBodyBonnetList(bodyBonnetData || []);
      setBodyConnectionList(bodyConnectionData || []);
      setTrimTypeList(trimTypeData || []);
      setTrimSeriesList(trimSeriesData || []);
      setTrimPortSizeList(trimPortSizeData || []);
      setTrimFormList(trimFormData || []);
      setActTypeList(actTypeData || []);
      setActSeriesList(actSeriesData || []);
      setActHWList(actHWData || []);

    } catch (error) {
      console.error('마스터 데이터 가져오기 실패:', error);
      
      // 개별 API 응답 상태 확인을 위한 로깅 추가
      //console.log('마스터 데이터 로딩 상태:');
      //console.log('- Body Size:', bodySizeList.length);
      //console.log('- Body Material:', bodyMatList.length);
      //console.log('- Trim Material:', trimMatList.length);
      //
      
      // 에러 발생 시 빈 배열로 설정
      setBodySizeList([]);
      setBodyMatList([]);
      setTrimMatList([]);
      setTrimOptionList([]);
      setBodyRatingList([]);
      setBodyBonnetList([]);
      setBodyConnectionList([]);
      setTrimTypeList([]);
      setTrimSeriesList([]);
      setTrimPortSizeList([]);
      setTrimFormList([]);
      setActTypeList([]);
      setActSeriesList([]);
      setActHWList([]);
      setAccMakerList([]);
      setAccModelList([]);
    }
  };

  // 품번 생성 함수 - 섹션별로 구분
  const generatePartNumber = useCallback(() => {
    try {
      // BODY 섹션 (6자리) - 코드 사용
      const bodySection = [
        bodySelections.bonnetTypeCode || '0',
        selectedValve?.typeId || '0', // selectedValve에서 코드를 가져옴 (typeId가 정확한 속성명)
        bodySelections.materialBodyCode || '0',
        bodySelections.sizeBodyCode || '0',
        bodySelections.ratingCode || '0',
        bodySelections.connectionCode || '0'
      ].join('');
      
      // TRIM 섹션 (6자리) - 코드 사용
      const trimSection = [
        trimSelections.trimTypeCode || '0',
        trimSelections.trimSeriesCode || '0',
        trimSelections.materialTrimCode || '0',
        bodySelections.sizeBodyCode || '0', // 4번째: Body Size Code
        trimSelections.sizePortCode || '0', // 5번째: Trim Port Size Code
        trimSelections.formCode || '0'
      ].join('');
      
      // ACT 섹션 (4자리) - 코드 사용
      const actSection = [
        actSelections.actionType || '0',
        actSelections.series || '0',
        actSelections.size || '0',
        actSelections.hw || '0'
      ].join('');
      
      // ACC 섹션 (11자리)
      const accSection = [
        accSelections.positioner.makerCode || '0',
        accSelections.positioner.modelCode || '0',
        accSelections.solenoid.makerCode || '0',
        accSelections.solenoid.modelCode || '0',
        accSelections.limiter.makerCode || '0',
        accSelections.limiter.modelCode || '0',
        accSelections.airSupply.modelCode || '0',
        accSelections.volumeBooster.modelCode || '0',
        accSelections.airOperator.modelCode || '0',
        accSelections.lockUp.modelCode || '0',
        accSelections.snapActingRelay.modelCode || '0'
      ].join('');
      
      // 섹션을 '-'로 구분하여 반환
      return `${bodySection}-${trimSection}-${actSection}-${accSection}`;
      
    } catch (error) {
      console.error('품번 생성 중 오류:', error);
      return '000000-000000-0000-00000000000';
    }
  }, [bodySelections, trimSelections, actSelections, accSelections, selectedValve]);

    // Conval 호출 함수
  const handleConvalCall = useCallback((sheetID: number) => {
    if (!sheetID || !tempEstimateNo) {
      console.error('Conval 호출 실패: sheetID 또는 tempEstimateNo가 없습니다.');
      return;
    }
    
    try {
      setIsConvalProcessing(true);
      
      // ClientApp으로 새 탭 이동 (포트 5001)
      const clientAppUrl = buildClientAppUrl({ estimateNo: tempEstimateNo, sheetId: sheetID.toString() });
      console.log('Conval 호출 - ClientApp으로 이동:', clientAppUrl);
      
      // 새 탭으로 열기
      window.open(clientAppUrl, '_blank');
      
    } catch (error) {
      console.error('Conval 호출 중 오류:', error);
    } finally {
      setIsConvalProcessing(false);
    }
  }, [tempEstimateNo]);

  // 기존 데이터 로드
  const loadExistingData = useCallback(async () => {
    if (!tempEstimateNo) return;
    
    //console.log('현재 tempEstimateNo:', tempEstimateNo); // tempEstimateNo 로그 추가
    
    try {
      // 현재 로그인한 사용자 정보 가져오기
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;

      const response = await getEstimateDetail(tempEstimateNo, currentUser?.userId || currentUser?.userID || ''); // 실제 사용자 ID 사용
      const data = response;
      setEstimateData(data); // 견적 데이터 저장 (권한 체크용)
      
      //console.log('견적 상세 데이터:', data);
      
      
      // 프로젝트명 설정
      if (data.estimateSheet && data.estimateSheet.project) {
        setProjectName(data.estimateSheet.project);
      }
      
      // 현재 상태 설정 + 견적시작 토글
      if (data.estimateSheet && data.estimateSheet.statusText) {
        console.log('🔍 현재 상태 설정:', data.estimateSheet.statusText);
        setCurrentStatus(data.estimateSheet.statusText);
      }
      // status === 3(견적처리중) 이면 버튼을 보라색 상태로 토글
      if (data.estimateSheet && typeof data.estimateSheet.status === 'number') {
        setQuoteStarted(data.estimateSheet.status === 3);
      }
      // 요약 카드 표시값 설정
      const es: any = data.estimateSheet || {};
      const tempNo: string = es.tempEstimateNo || es.TempEstimateNo || '';
      const curNo: string | null = es.curEstimateNo ?? es.CurEstimateNo ?? null;
      const customerName: string = es.customerName || es.CustomerName || '-';
      const customerUserName: string = es.customerUserName || es.CustomerUserName || customerName;
      const managerId: string = es.managerID || es.ManagerID || '-';
      const managerName: string = es.managerName || es.ManagerName || '';
      const managerPosition: string = es.managerPosition || es.ManagerPosition || '';
      const managerRoleId: number | null = es.managerRoleId ?? es.ManagerRoleId ?? null;

      const parseFromTemp = (no: string): string => {
        const m = /TEMP(\d{4})(\d{2})(\d{2})/.exec(no || '');
        return m ? `${m[1]}.${m[2]}.${m[3]}` : '-';
      };
      const parseFromCur = (no?: string | null): string => {
        if (!no) return '-';
        const m = /YA(\d{4})(\d{2})(\d{2})-(\d{3})/.exec(no);
        return m ? `${m[1]}.${m[2]}.${m[3]}` : '-';
      };

      // 담당자 표시 로직 (EstimateManagementPage와 동일)
      let managerDisplayText = '미지정';
      if (managerRoleId === 1) {
        managerDisplayText = '관리자';
      } else if (managerName) {
        managerDisplayText = managerName + (managerPosition ? ` ${managerPosition}` : '');
      }

      setSummaryEstimateNo(curNo || '-'); // CurEstimateNo만 표시, 없으면 '-'
      setSummaryCompanyName(customerName);
      setSummaryRequesterName(customerUserName); // 요청자 = User.Name
      // 요청일자는 CurEstimateNo(YA)에서 추출
      setSummaryRequestDate(parseFromCur(curNo));
      setSummaryManager(managerDisplayText);
      
      // 완료일자는 상태가 완료(4) 이상일 때만 CompleteDate를 사용
      const statusCodeForComplete = data.estimateSheet?.status;
      if (!statusCodeForComplete || statusCodeForComplete < 4) {
        setSummaryCompletedDate('-');
      } else {
      const completeDate = (es as any).completeDate || (es as any).CompleteDate;
        if (completeDate) {
          const date = new Date(completeDate);
          const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
          setSummaryCompletedDate(formattedDate);
        } else {
          setSummaryCompletedDate('-');
        }
      }
      
      // 읽기 전용 상태 설정
      // 수정 가능 조건: 담당자 AND 견적처리중(3) - 견적 완료(4) 이상일 때는 무조건 수정 불가
      const currentStatus = data.estimateSheet?.status || 0;
      const isStatusInProgress = currentStatus === 3; // 견적처리중(3)만
      const isStatusCompletedOrAbove = currentStatus >= 4; // 견적완료(4) 이상
      const isCurrentUserManager = currentUser?.userId === data.estimateSheet?.managerID || currentUser?.userID === data.estimateSheet?.managerID; // 현재 사용자가 담당자인지
      
      // 견적 완료(4) 이상일 때는 무조건 수정 불가
      // 담당자이고 견적처리중(3)일 때만 수정 가능
      const shouldBeReadOnly = isStatusCompletedOrAbove || !(isStatusInProgress && isCurrentUserManager);
      setIsReadOnly(shouldBeReadOnly);
      //console.log('EstimateDetailPage isReadOnly 설정됨:', shouldBeReadOnly);
      //console.log('  status:', data.estimateSheet?.status, '(3이면 견적처리중)');
      //console.log('  managerID:', data.estimateSheet?.managerID);
      //console.log('  currentUser.userId:', currentUser?.userId);
      
      // EstimateRequest 데이터를 기반으로 types와 valves 설정
      if (data.estimateRequests && data.estimateRequests.length > 0) {
        // 디버깅: 실제 데이터 구조 확인
        console.log('🔍 EstimateDetailPage - API 응답 데이터 구조:');
        console.log('data.estimateRequests:', data.estimateRequests);
        console.log('첫 번째 estimateRequest:', data.estimateRequests[0]);
        if (data.estimateRequests[0]?.tagNos) {
          console.log('첫 번째 tagNos:', data.estimateRequests[0].tagNos);
          console.log('첫 번째 tagNo의 필드들:', Object.keys(data.estimateRequests[0].tagNos[0] || {}));
          console.log('첫 번째 tagNo의 sheetNo:', data.estimateRequests[0].tagNos[0]?.sheetNo);
          console.log('첫 번째 tagNo의 sheetID:', data.estimateRequests[0].tagNos[0]?.sheetID);
        }
        // Type 정보 설정
        const typeMap = new Map<string, { count: number; order: number }>();
        
        data.estimateRequests.forEach((req: any) => {
          const valveType = req.valveType;
          if (typeMap.has(valveType)) {
            
            typeMap.get(valveType)!.count += req.tagNos.reduce((sum: number, tag: any) => sum + tag.qty, 0);
          } else {
            const totalQty = req.tagNos.reduce((sum: number, tag: any) => sum + tag.qty, 0);
            typeMap.set(valveType, { count: totalQty, order: typeMap.size + 1 });
          }
        });
        
        // typesData를 SheetNo 기준으로 정렬
        const typesData = Array.from(typeMap.entries()).map(([code, info]) => {
          // bodyValveList가 로드되지 않은 경우를 대비하여 기본값 설정
          const valveInfo = bodyValveList.find(v => v.valveSeriesCode === code);
          return {
            id: code,
            name: valveInfo ? valveInfo.valveSeries : `Valve Type ${code}`,
            code: code,
            count: info.count,
            order: info.order
          };
        });
        
        // 밸브 타입을 SheetNo 순서대로 정렬
        const sortedTypesData = typesData.sort((a, b) => {
          // 각 밸브 타입의 첫 번째 TagNo의 SheetNo를 기준으로 정렬
          const aFirstTag = data.estimateRequests.find(req => req.valveType === a.code)?.tagNos?.[0];
          const bFirstTag = data.estimateRequests.find(req => req.valveType === b.code)?.tagNos?.[0];
          
          // sheetNo 또는 sheetID 사용 (타입 안전성 확보)
          const aSheetNo = (aFirstTag as any)?.sheetNo || (aFirstTag as any)?.sheetID || 999;
          const bSheetNo = (bFirstTag as any)?.sheetNo || (bFirstTag as any)?.sheetID || 999;
          
          return aSheetNo - bSheetNo;
        });
        
        setTypes(sortedTypesData);
        
        // Valve 정보 설정 - TagNoDetailDto를 기반으로 변환
        const valvesData: ValveData[] = [];
        data.estimateRequests.forEach((req: any) => {
          req.tagNos.forEach((tag: any) => {
            // Body Type 이름 가져오기
            const valveInfo = bodyValveList.find(v => v.valveSeriesCode === req.valveType);
            const bodyTypeName = valveInfo ? valveInfo.valveSeries : `Valve Type ${req.valveType}`;
            
            // Rating Unit 가져오기 (bodyRatingList에서 찾기)
            const ratingInfo = bodyRatingList.find(r => r.ratingCode === tag.bodyRating);
            const ratingUnit = ratingInfo ? ratingInfo.ratingUnit : '';
            
            valvesData.push({
              id: `${tag.sheetID}`,
              tagNo: tag.tagNo,
              qty: tag.qty,
              order: tag.sheetNo ?? tag.sheetID,
              sheetID: tag.sheetID,
              typeId: req.valveType,
              fluid: {
                medium: tag.medium || '',
                fluid: tag.fluid || '',
                density: tag.density || '',
                molecular: tag.molecularWeight || '',
                t1: { max: tag.inletTemperatureQ || 0, normal: tag.inletTemperatureNorQ || 0, min: tag.inletTemperatureMinQ || 0 },
                p1: { max: tag.inletPressureMaxQ || 0, normal: tag.inletPressureNorQ || 0, min: tag.inletPressureMinQ || 0 },
                p2: { max: tag.outletPressureMaxQ || 0, normal: tag.outletPressureNorQ || 0, min: tag.outletPressureMinQ || 0 },
                dp: { max: tag.differentialPressureMaxQ || 0, normal: tag.differentialPressureNorQ || 0, min: tag.differentialPressureMinQ || 0 },
                qm: { max: tag.qmMax || 0, normal: tag.qmNor || 0, min: tag.qmMin || 0, unit: tag.qmUnit || '' },
                qn: { max: tag.qnMax || 0, normal: tag.qnNor || 0, min: tag.qnMin || 0, unit: tag.qnUnit || '' },
                pressureUnit: tag.pressureUnit || '',
                temperatureUnit: tag.temperatureUnit || ''
              },
              body: {
                type: bodyTypeName, // Body Type 이름 설정
                typeCode: req.valveType || '',
                size: tag.bodySize || '',
                sizeUnit: tag.bodySizeUnit || '',
                materialBody: tag.bodyMat || '',
                materialTrim: tag.trimMat || '',
                option: tag.trimOption || '',
                rating: tag.bodyRating || '',
                ratingUnit: ratingUnit // Rating Unit 설정
              },
              actuator: {
                type: tag.actType || '',
                hw: tag.isHW ? 'Yes' : 'No'
              },
              accessory: {
                positioner: { type: tag.positionerType || '', exists: tag.isPositioner || false },
                explosionProof: tag.explosionProof || '',
                transmitter: { type: tag.transmitterType || '', exists: !!tag.transmitterType },
                solenoidValve: tag.isSolenoid || false,
                limitSwitch: tag.isLimSwitch || false,
                airSet: tag.isAirSet || false,
                volumeBooster: tag.isVolumeBooster || false,
                airOperatedValve: tag.isAirOperated || false,
                lockupValve: tag.isLockUp || false,
                snapActingRelay: tag.isSnapActingRelay || false
              },
              isQM: tag.isQM || false,
              isP2: tag.isP2 || false,
              isN1: false, // EstimateRequestDetailDto에는 isN1이 없음
              isDensity: tag.isDensity || false,
              isHW: tag.isHW || false
            });
          });
        });
        // sheetNo 기준으로 오름차순 정렬
        valvesData.sort((a, b) => a.order - b.order);

        // 정렬된 결과로 상태 반영
        setValves(valvesData);
        

        
        // 첫 번째 valve를 기본 선택
        // if (valvesData.length > 0) {
        //   setSelectedValve(valvesData[0]);
        // }
      }
      
      // 기타 요청사항 설정
      if (data.estimateSheet && data.estimateSheet.customerRequirement) {
        setCustomerRequirement(data.estimateSheet.customerRequirement);
      }
      
      // 관리자 코멘트 설정
      if (data.estimateSheet && data.estimateSheet.staffComment) {
        setStaffComment(data.estimateSheet.staffComment);
      }
      
      // 첨부파일 설정 - 고객 요청과 관리 첨부파일 분리
      if (data.attachments && data.attachments.length > 0) {
        const customerFiles: any[] = [];
        const managerFiles: any[] = [];
        
        data.attachments.forEach((att: any) => {
          if (att.filePath && isCustomerFile(att.filePath)) {
            customerFiles.push(att);
          } else if (att.filePath && isManagerFile(att.filePath)) {
            managerFiles.push(att);
          }
        });
        
        setCustomerAttachments(customerFiles);
        setManagerAttachments(managerFiles);
        
        // 기존 호환성 유지
        const fileList = data.attachments.map((att: any) => ({
          name: att.fileName || 'Unknown',
          size: att.fileSize || 0
        } as any));
        setAttachments(fileList);
      }
      
    } catch (error) {
      console.error('기존 데이터 로드 실패:', error);
    }
  }, [tempEstimateNo, bodyValveList, bodyRatingList]);

  // 상태 변경 처리
  const handleStatusChange = async (newStatus: string) => {
    try {
      // 상태 텍스트를 숫자 코드로 변환하는 헬퍼 함수
      const getStatusCodeFromText = (statusText: string): number => {
        switch (statusText) {
          case '임시저장': return 1;
          case '견적요청': return 2;
          case '견적처리중': return 3;
          case '견적완료': return 4;
          case '주문': return 5;
          default: return -1; // 알 수 없는 상태
        }
      };

      const newStatusCode = getStatusCodeFromText(newStatus);
      
      // 현재 사용자 정보와 견적 정보 가져오기
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      // 견적 상세 정보 가져오기 (isReadOnly 계산을 위해)
      if (!tempEstimateNo) {
        throw new Error('tempEstimateNo가 없습니다.');
      }
      const estimateResponse = await getEstimateDetail(tempEstimateNo, currentUser?.userId || currentUser?.userID || '');
      const estimateData = estimateResponse;

      // 권한 체크: 담당자 또는 관리자만 상태 변경 가능
      const isManager = currentUser?.userId === estimateData.estimateSheet?.managerID;
      const isAdmin = currentUser?.roleId === 1;
      
      if (!isManager && !isAdmin) {
        alert('담당자 또는 관리자만 상태를 변경할 수 있습니다.');
        return;
      }

      // 견적요청 상태(2)에서만 견적처리중(3)으로 변경 가능
      // if (currentStatusCode === 2 && newStatusCode === 3) {
        // 상태 변경 API 호출
        const response = await fetch(`/api/estimate/sheets/${tempEstimateNo}/status`, { // API 경로 수정
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatusCode }), // 숫자 상태 코드로 전송
        });

        if (response.ok) {
          setCurrentStatus(newStatus); // UI 상태 업데이트 (문자열로 유지)
          
          // 상태 변경 후 isReadOnly 재계산
          const newStatusCode = getStatusCodeFromText(newStatus);
          const isStatusThree = newStatusCode === 3; // 상태가 3 (견적처리중)인지
          const isStatusCompletedOrAbove = newStatusCode >= 4; // 견적완료(4) 이상
          const isCurrentUserManager = currentUser?.userId === estimateData.estimateSheet?.managerID; // 현재 사용자가 담당자인지
          // 견적 완료(4) 이상일 때는 무조건 수정 불가
          // 담당자이고 견적처리중(3)일 때만 수정 가능
          const shouldBeReadOnly = isStatusCompletedOrAbove || !(isStatusThree && isCurrentUserManager);
          setIsReadOnly(shouldBeReadOnly);
          alert('상태가 성공적으로 변경되었습니다.'); // 메시지 일반화
          // 상태 변경 후 상세 정보를 다시 불러오는 로직이 필요할 수 있습니다.
          // loadEstimateDetail(); // 상세 정보를 불러오는 함수가 있다면 호출
        } else {
          // 응답 본문을 읽어서 더 자세한 오류 메시지 확인
          const errorData = await response.json();
          throw new Error(errorData.message || '상태 변경에 실패했습니다.');
        }
      // } else { // 이 else 블록도 제거합니다.
      //   alert('견적요청 상태에서만 견적처리중으로 변경할 수 있습니다.');
      // }
    } catch (error: any) {
      console.error('상태 변경 실패:', error.message);
      alert(`상태 변경에 실패했습니다: ${error.message}`);
    }
  };

  // 첨부파일 관련 함수들
  const handleDownloadFile = async (file: any, type: 'customer' | 'manager') => {
    try {
      // 모든 파일 타입 다운로드 허용 (PDF 제한 제거)
      
      // 파일 다운로드 API 호출
      let response;
      if (file.attachmentID) {
        // attachmentID가 있는 경우
        response = await fetch(buildApiUrl(`/estimate/attachments/${file.attachmentID}/download`));
      } else if (file.filePath) {
        // filePath만 있는 경우
        response = await fetch(buildApiUrl(`/estimate/attachments/download?filePath=${encodeURIComponent(file.filePath)}`));
      } else {
        alert('파일 정보가 올바르지 않습니다.');
        return;
      }
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName || file.name || 'download';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('파일 다운로드 실패:', response.status, errorText);
        alert(`파일 다운로드에 실패했습니다. (${response.status})`);
      }
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleUploadManagerFile = async (fileType: string) => {
    const file = selectedPdfFiles[fileType];
    if (!file) {
      alert('업로드할 PDF 파일을 선택해주세요.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 🔑 쿼리 파라미터로 전송하도록 수정
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const uploadUserID = currentUser?.userId || currentUser?.userID || '';
      const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/attachments?uploadUserID=${uploadUserID}&fileType=manager&managerFileType=${fileType}`), {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('PDF 파일이 성공적으로 업로드되었습니다.');
        
        // 🔑 파일 목록 새로고침 - 더 확실하게 처리
        console.log('🔄 파일 업로드 완료, 목록 새로고침 시작');
        await fetchManagerFiles();
        await fetchCustomerFiles();
        
        // 🔑 추가로 잠시 후 한 번 더 새로고침 (백엔드 처리 지연 고려)
        setTimeout(async () => {
          console.log('🔄 지연 새로고침 실행');
          await fetchManagerFiles();
          await fetchCustomerFiles();
        }, 1000);
        
        // 🔑 엑셀 파일도 함께 새로고침 (백엔드 교체 로직 문제 해결)
        setTimeout(async () => {
          console.log('🔄 엑셀 파일 새로고침 실행');
          await fetchManagerFiles();
          await fetchCustomerFiles();
        }, 2000);
        
        // 선택된 파일 초기화
        setSelectedPdfFiles(prev => ({
          ...prev,
          [fileType]: null
        }));
        
        // 파일 입력 초기화 - 해당 ID의 입력만 초기화
        const fileInput = document.getElementById(`pdf-${fileType}`) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const error = await response.json();
        alert(`PDF 업로드 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('PDF 업로드 중 오류:', error);
      alert('PDF 업로드 중 오류가 발생했습니다.');
    }
  };

  // 고객 첨부 다중 선택
  const handleCustomerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSelectedCustomerFiles(files);
    await uploadCustomerFiles(files);
    if (customerAddInputRef.current) customerAddInputRef.current.value = '';
  };

  // 고객 첨부 다중 업로드 (ResultFiles/customer에 업로드)
  const uploadCustomerFiles = async (files: File[]) => {
    if (files.length === 0) {
      alert('업로드할 파일을 선택해주세요.');
      return;
    }

    // 권한 체크: 담당자이고 견적처리중 이상일 때만 업로드 가능
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const currentStatus = estimateData?.estimateSheet?.status || 0;
    const isStatusInProgressOrAbove = currentStatus >= 3;
    const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
    
    if (!isStatusInProgressOrAbove || !isManager) {
      alert('담당자만 변경 가능합니다.');
      return;
    }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        // manager 업로드 + managerFileType=customer 로 업로드 → ResultFiles/customer에 저장되도록 백엔드 규약 사용
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        const uploadUserID = currentUser?.userId || currentUser?.userID || '';
        const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/attachments?uploadUserID=${uploadUserID}&fileType=manager&managerFileType=customer`), {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          let msg = '고객 파일 업로드 실패';
          try { const er = await response.json(); msg = er.message || msg; } catch {}
          console.error(msg);
        }
      }

      alert('고객 파일 업로드가 완료되었습니다.');
      await fetchCustomerFiles();
      setSelectedCustomerFiles([]);
    } catch (err) {
      console.error('고객 파일 업로드 중 오류:', err);
      alert('고객 파일 업로드 중 오류가 발생했습니다.');
    }
  };

  const handleUploadCustomerFiles = async () => uploadCustomerFiles(selectedCustomerFiles);

  const handleGenerateDatasheet = async () => {
    try {
      // TODO: 사용자가 나중에 제공할 Datasheet 생성 로직
      alert('Datasheet 생성 기능은 준비 중입니다.');
    } catch (error) {
      console.error('Datasheet 생성 오류:', error);
      alert('Datasheet 생성 중 오류가 발생했습니다.');
    }
  };

  // 서류 생성 후 다운로드 (프론트만으로 처리)
  const generateAndDownload = async (type: 'cvlist'|'vllist'|'datasheet'|'singlequote', endpoint: string) => {
    if (!tempEstimateNo) return;
    setDocGenerating(prev => ({ ...prev, [type]: true }));
    try {
      // 단품 견적서 버튼 클릭 시: 단품 + 다수량 견적서를 모두 생성
      if (type === 'singlequote') {
        console.log('🔍 견적서 생성 시작 - 단품 + 다수량');
        
        // 1) 단품견적서 생성
        console.log('📄 단품견적서 생성 중...');
        const singleQuoteResp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/generate-single-quote`), { method: 'POST' });
        if (!singleQuoteResp.ok) {
          const er = await singleQuoteResp.json().catch(()=>({}));
          throw new Error(`단품견적서 생성 실패: ${er.message || '알 수 없는 오류'}`);
        }
        console.log('✅ 단품견적서 생성 완료');
        
        // 2) 다수량견적서 생성
        console.log('📄 다수량견적서 생성 중...');
        const multiQuoteResp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/generate-multi-quote`), { method: 'POST' });
        if (!multiQuoteResp.ok) {
          const er = await multiQuoteResp.json().catch(()=>({}));
          throw new Error(`다수량견적서 생성 실패: ${er.message || '알 수 없는 오류'}`);
        }
        console.log('✅ 다수량견적서 생성 완료');
        
        // 생성된 두 파일 다운로드
        console.log('📥 생성된 견적서 파일 다운로드 중...');
        await downloadQuoteFiles();
        alert('견적서가 성공적으로 생성되었습니다!\n- 단품견적서\n- 다수량견적서');
        return;
      }
      
      // 기존 로직 (단일 타입 생성: cvlist, vllist, datasheet 등)
      const resp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/${endpoint}`), { method: 'POST' });
      if (!resp.ok) {
        const er = await resp.json().catch(()=>({}));
        throw new Error(er.message || '생성 실패');
      }
      const pickLatest = (list: any[]) =>
        list.filter(f => f.managerFileType === type)
            .sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];

      // 최초 시도
      let list = await fetchManagerFiles();
      let target = pickLatest(list);

      // 생성 직후 인덱싱 지연 대비 폴링(최대 5회, 600ms 간격)
      let retries = 5;
      while (!target && retries-- > 0) {
        await new Promise(r => setTimeout(r, 600));
        list = await fetchManagerFiles();
        target = pickLatest(list);
      }

      if (!target) throw new Error('생성된 파일을 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
      await downloadFile(target.filePath, target.fileName);
    } catch (e: any) {
      alert(e.message || '생성 중 오류');
    } finally {
      setDocGenerating(prev => ({ ...prev, [type]: false }));
    }
  };
  
  // 생성된 견적서 파일(단품/다수량) 다운로드
  const downloadQuoteFiles = async () => {
    try {
      const list = await fetchManagerFiles();
      
      const singleQuote = list.filter(f => f.managerFileType === 'singlequote')
        .sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];
      if (singleQuote) {
        await downloadFile(singleQuote.filePath, singleQuote.fileName);
      }
      
      const multiQuote = list.filter(f => f.managerFileType === 'multiquote')
        .sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())[0];
      if (multiQuote) {
        await downloadFile(multiQuote.filePath, multiQuote.fileName);
      }
      
      console.log('✅ 견적서 파일 다운로드 완료');
    } catch (error) {
      console.error('견적서 파일 다운로드 중 오류:', error);
      alert('일부 견적서 파일 다운로드에 실패했습니다.');
    }
  };
  
  // 견적 세부 정보 미니 카드
  const EstimateSummaryCard = () => {
    const totalQty = (valves || []).reduce((sum, v:any) => sum + (Number(v?.qty) || 0), 0);
    return (
      <div className="step-section-detail estimate-summary-card">
        <div className="step-header-detail" style={{ marginBottom: 4 }}>
          <h3>견적 세부 정보</h3>
        </div>
        <div className="summary-grid">
          <div className="summary-row"><span className="k">견적번호</span><span className="v">{summaryEstimateNo}</span><span className="k">상태</span><span className="v">{currentStatus || '-'}</span></div>
          <div className="summary-row"><span className="k">회사명</span><span className="v">{summaryCompanyName}</span><span className="k">수량</span><span className="v">{totalQty || '-'}</span></div>
          <div className="summary-row"><span className="k">요청자</span><span className="v">{summaryRequesterName}</span><span className="k">요청일자</span><span className="v">{summaryRequestDate}</span></div>
          <div className="summary-row"><span className="k">담당자</span><span className="v">{summaryManager}</span><span className="k">완료일자</span><span className="v">{summaryCompletedDate}</span></div>
        </div>
      </div>
    );
  };

  const handleStartQuote = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const currentUserId = currentUser?.userId;
      if (!tempEstimateNo || !currentUserId) {
        alert('로그인 정보 또는 견적번호가 없습니다.');
        return;
      }
      const res = await assignEstimate(tempEstimateNo, currentUserId);
      if (res && (res.message || '').includes('완료')) {
        // 상태 텍스트 갱신
        setCurrentStatus('견적처리중');
        setQuoteStarted(true);
        // 상세 정보 재조회로 화면 최신화
        await loadExistingData();
      } else {
        alert('견적 시작 처리에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('견적 시작 처리 중 오류가 발생했습니다.');
    }
  };

  const handleEndQuote = () => {
    alert('견적 마감');
  };

  // 견적완료: CurEstimateNo 생성 + 상태 변경
  const handleCompleteQuote = async () => {
    if (!tempEstimateNo) return;
    
    // 권한 체크: 담당자만 가능
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
    
    if (!isManager) {
      alert('담당자만 변경 가능합니다.');
      return;
    }
    
    try {
      // 1. 사양 저장 먼저 실행
      await handleSaveSpecification();
      
      // 2. 견적완료 처리
      const resp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/complete`), { method: 'POST' });
      if (!resp.ok) {
        const er = await resp.json().catch(()=>({message:'처리 실패'}));
        alert(er.message || '처리 실패');
        return;
      }
      const data = await resp.json();
      const curNo = data.curEstimateNo as string;
      setSummaryEstimateNo(curNo || '-');
      
      // CompleteDate를 오늘 날짜로 설정
      const today = new Date();
      const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
      setSummaryCompletedDate(formattedDate);
      
      setCurrentStatus('견적완료');
      
      // 데이터 재로드하여 최신 정보 반영
      await loadExistingData();
    } catch (e) {
      alert('처리 중 오류');
    }
  };

  // 완료 취소(진행중으로 되돌리기)
  const handleCancelComplete = async () => {
    if (!tempEstimateNo) return;
    
    // 권한 체크: 담당자만 가능
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
    
    if (!isManager) {
      alert('담당자만 변경 가능합니다.');
      return;
    }
    
    try {
      const resp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/complete/cancel`), { method: 'POST' });
      if (!resp.ok) throw new Error('완료취소 실패');
      setCurrentStatus('견적처리중');
    } catch (e) {
      alert('완료취소 중 오류');
    }
  };

  // 주문 확정
  const handleConfirmOrder = async () => {
    if (!tempEstimateNo) return;
    
    // 권한 체크: 담당자만 가능
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
    
    if (!isManager) {
      alert('담당자만 변경 가능합니다.');
      return;
    }
    
    try {
      const resp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/order/confirm`), { method: 'POST' });
      if (!resp.ok) throw new Error('주문확정 실패');
      setCurrentStatus('주문');
    } catch (e) {
      alert('주문확정 중 오류');
    }
  };

  const handleGenerateFile = async (managerFileType: string) => {
    try {
      let apiEndpoint = '';
      let fileTypeName = '';
      
      switch (managerFileType) {
        case 'cvlist':
          apiEndpoint = buildApiUrl(`/estimate/sheets/${tempEstimateNo}/generate-cv`);
          fileTypeName = 'CV 리스트';
          break;
        case 'vllist':
          apiEndpoint = buildApiUrl(`/estimate/sheets/${tempEstimateNo}/generate-vl`);
          fileTypeName = 'VL 리스트';
          break;
        case 'datasheet':
          apiEndpoint = buildApiUrl(`/estimate/sheets/${tempEstimateNo}/generate-datasheet`);
          fileTypeName = 'DataSheet';
          break;
        case 'singlequote':
          apiEndpoint = buildApiUrl(`/estimate/sheets/${tempEstimateNo}/generate-single-quote`);
          fileTypeName = '단품견적서';
          break;
        case 'multiquote':
          apiEndpoint = buildApiUrl(`/estimate/sheets/${tempEstimateNo}/generate-multi-quote`);
          fileTypeName = '다수량견적서';
          break;
        default:
          alert('지원하지 않는 파일 타입입니다.');
          return;
      }
      
      console.log(`${fileTypeName} 생성 시작:`, tempEstimateNo);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`${fileTypeName}가 성공적으로 생성되었습니다!\n\n생성된 파일:\n${result.fileName}`);
        console.log(`${fileTypeName} 생성 성공:`, result);
        
        // 🔑 파일 생성 완료 후 자동 새로고침 추가
        await fetchManagerFiles();
        await fetchCustomerFiles();
        
        // 기존 첨부파일 목록도 새로고침
        loadExistingData();
      } else {
        const error = await response.json();
        alert(`${fileTypeName} 생성 실패: ${error.message}`);
        console.error(`${fileTypeName} 생성 실패:`, error);
      }
    } catch (error) {
      console.error('파일 생성 오류:', error);
      alert('파일 생성 중 오류가 발생했습니다.');
    }
  };
  // 선택값이 바뀔 때마다 현재 태그(sheetID)로 임시 저장
useEffect(() => {
  if (!selectedValve) return;
  setTempSelections(prev => ({
    ...prev,
    [selectedValve.sheetID]: {
      body: { ...bodySelections },
      trim: { ...trimSelections },
      act:  { ...actSelections },
      acc:  { ...accSelections },
    }
  }));
}, [selectedValve?.sheetID, bodySelections, trimSelections, actSelections, accSelections]);

  useEffect(() => {
    if (!selectedValve) return;
    const dto = {
      valveId: selectedValve?.body?.typeCode || '',
      body: {
        bonnetType: bodySelections.bonnetType || '',
        materialBody: bodySelections.materialBody || '',
        rating: bodySelections.ratingCode || '',
        ratingUnit: bodySelections.ratingUnitCode || '',
        connection: bodySelections.connection || '',
        sizeUnit: bodySelections.sizeBodyUnitCode || '',
        size: bodySelections.sizeBodyCode || ''
      },
      trim: {
        type: trimSelections.trimType || '',
        series: trimSelections.trimSeries || '',
        portSize: trimSelections.sizePortCode || '',
        portSizeUnit: trimSelections.sizePortUnitCode || '',
        form: trimSelections.form || '',
        materialTrim: trimSelections.materialTrim || '',
        option: trimSelections.option || ''
      },
      actuator: {
        type: actSelections.actionType || '',
        series: actSelections.series || '',
        size: actSelections.size || '',
        hw: actSelections.hw || ''
      },
      accessories: {
        PosCode: accSelections.positioner?.modelCode || null,
        PosMakerCode: accSelections.positioner?.makerCode || null,
        SolCode: accSelections.solenoid?.modelCode || null,
        SolMakerCode: accSelections.solenoid?.makerCode || null,
        LimCode: accSelections.limiter?.modelCode || null,
        LimMakerCode: accSelections.limiter?.makerCode || null,
        ASCode: accSelections.airSupply?.modelCode || null,
        ASMakerCode: accSelections.airSupply?.makerCode || null,
        VolCode: accSelections.volumeBooster?.modelCode || null,
        VolMakerCode: accSelections.volumeBooster?.makerCode || null,
        AirOpCode: accSelections.airOperator?.modelCode || null,
        AirOpMakerCode: accSelections.airOperator?.makerCode || null,
        LockupCode: accSelections.lockUp?.modelCode || null,
        LockupMakerCode: accSelections.lockUp?.makerCode || null,
        SnapActCode: accSelections.snapActingRelay?.modelCode || null,
        SnapActMakerCode: accSelections.snapActingRelay?.makerCode || null,
      }
    };
    setSpecBySheetId(prev => ({ ...prev, [selectedValve.sheetID]: dto }));
  }, [selectedValve?.sheetID, bodySelections, trimSelections, actSelections, accSelections]);

  const handleDeleteManagerFile = async (file: any) => {
    try {
      if (window.confirm('정말로 이 파일을 삭제하시겠습니까?')) {
        const response = await fetch(`/api/estimate/attachments/${file.attachmentID}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          alert('파일이 성공적으로 삭제되었습니다.');
          loadExistingData(); // 첨부파일 목록 새로고침
        } else {
          alert('파일 삭제에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  // 사양 저장 함수
  // 태그별 서로 다른 입력을 수집하기 위한 상태
  const [specBySheetId, setSpecBySheetId] = useState<Record<number, any>>({});

  // selectedValve, bodySelections, trimSelections, actSelections, accSelections 변경 시 저장
useEffect(() => {
  if (!selectedValve) return;
  const dto = buildSaveSpecFromSelections({
    body: bodySelections,
    trim: trimSelections,
    act: actSelections,
    acc: accSelections,
    valveTypeCode: selectedValve?.body?.typeCode || ''
  });
  setSpecBySheetId(prev => ({ ...prev, [selectedValve.sheetID]: dto }));
}, [selectedValve?.sheetID, bodySelections, trimSelections, actSelections, accSelections]);

const handleSaveValveOrder = async () => {
  const sheetIDs = valves.map(v => v.sheetID);           // 현재 화면 순서대로
  const resp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/requests/order`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sheetIDs)
  });
  if (resp.ok) {
    // 로컬 보기용 sheetNo 싱크
    setValves(prev => prev.map((v, i) => ({ ...v, sheetNo: i + 1 })));
    alert('순서가 저장되었습니다.');
  } else {
    alert('순서 저장에 실패했습니다.');
  }
};

// 순서 저장: 화면의 valves 순서를 SheetNo로 반영
const saveValveOrder = async () => {
  if (!tempEstimateNo) return;
  const sheetIDs = valves.map(v => v.sheetID); // 전체 목록의 현재 순서
  await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/requests/order`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sheetIDs),
  });
};
const handleSaveSpecification = async () => {
  try {
    // 0) 순서 먼저 저장 → SheetNo DB 반영
    await saveValveOrder();

    // 1) 일괄 저장 대상 결정(전체)
    const template = buildSaveSpecFromSelections({
      body: bodySelections, trim: trimSelections, act: actSelections, acc: accSelections,
      valveTypeCode: selectedValve?.body?.typeCode || ''
    });
    const items = valves.map(v => ({
      sheetID: v.sheetID,
      specification: specBySheetId[v.sheetID]
        ?? (tempSelections[v.sheetID]
            ? buildSaveSpecFromSelections({
                body: tempSelections[v.sheetID].body,
                trim: tempSelections[v.sheetID].trim,
                act:  tempSelections[v.sheetID].act,
                acc:  tempSelections[v.sheetID].acc
              })
            : template)
    }));

    // 2) 일괄 사양 저장
    const resp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/specification/bulk`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    if (!resp.ok) {
      alert('사양 일괄 저장에 실패했습니다.');
      return;
    }

    // 3) StaffComment 저장
    if (staffComment && staffComment.trim()) {
      const commentResp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/staff-comment`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffComment })
      });

      if (!commentResp.ok) {
        console.warn('관리자 코멘트 저장에 실패했습니다.');
      }
    }

    alert('모든 태그에 사양이 일괄 저장되었습니다.');
  } catch (e) {
    console.error(e);
    alert('사양 일괄 저장 중 오류가 발생했습니다.');
  }
};

  const AccessorySelector: React.FC<AccessorySelectorProps> = ({
    accTypeKey,
    typeCode,
    currentAcc,
    accMakerList,
    accModelList,
    onAccessoryChange,
    isReadOnly,
  }) => {
    const [makerSearchTerm, setMakerSearchTerm] = useState('');
    const [modelSearchTerm, setModelSearchTerm] = useState('');
    const [specSearchTerm, setSpecSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSelected, setIsSelected] = useState(false); // 선택 여부 상태 추가
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 컴포넌트 마운트 시 디버깅 로그
    useEffect(() => {
      console.log(`🔍 AccessorySelector ${accTypeKey} 마운트:`, {
        accTypeKey,
        typeCode,
        currentAcc,
        accMakerListLength: accMakerList.length,
        accModelListLength: accModelList.length
      });
      
      // accMakerList와 accModelList의 내용 확인
      console.log(`🔍 ${accTypeKey} - accMakerList 내용:`, accMakerList);
      console.log(`🔍 ${accTypeKey} - accModelList 내용 (타입별 필터링):`, 
        accModelList.filter(item => item.accTypeCode === typeCode)
      );
    }, [accTypeKey, typeCode, currentAcc, accMakerList.length, accModelList.length, accMakerList, accModelList]);

    // 컴포넌트 마운트 시 또는 accSelections 변경 시 입력 필드 초기화 및 선택 상태 설정
    useEffect(() => {
      // currentAcc의 typeCode가 현재 typeCode와 일치하는지 확인
      const isCurrentType = !currentAcc?.typeCode || currentAcc.typeCode === typeCode;
      
      if (currentAcc?.modelCode && currentAcc?.makerCode && isCurrentType) {
        // 타입 코드가 일치하는 메이커만 찾기
        const selectedMakerName = accMakerList.find(maker => 
          maker.accMakerCode === currentAcc.makerCode && 
          maker.accTypeCode === typeCode
        )?.accMakerName || '';
        
        // 타입 코드와 메이커 코드, 모델 코드가 모두 일치하는 모델만 찾기
        const selectedModel = accModelList.find(model => 
          model.accMakerCode === currentAcc.makerCode &&
          model.accModelCode === currentAcc.modelCode && 
          model.accTypeCode === typeCode
        );
        
        const selectedModelName = selectedModel?.accModelName || '';
        const selectedSpec = selectedModel?.accSize || currentAcc.specification || '';
        
        console.log(`🔍 ${accTypeKey} - currentAcc 기반 입력 필드 설정:`, {
          currentAcc,
          typeCode,
          selectedMakerName,
          selectedModelName,
          selectedSpec,
          foundModel: selectedModel
        });
        
        setMakerSearchTerm(selectedMakerName);
        setModelSearchTerm(selectedModelName);
        setSpecSearchTerm(selectedSpec);
        setIsSelected(true); // 모델이 이미 선택되어 있으면 isSelected를 true로
      } else {
        // 타입이 일치하지 않거나 모델 코드가 없으면 초기화
        if (!isCurrentType) {
          console.log(`🔍 ${accTypeKey} - 타입 불일치로 초기화:`, {
            currentAccTypeCode: currentAcc?.typeCode,
            expectedTypeCode: typeCode
          });
        }
        setMakerSearchTerm('');
        setModelSearchTerm('');
        setSpecSearchTerm('');
        setIsSelected(false); // 모델이 없으면 isSelected를 false로
      }
    }, [currentAcc, accMakerList, accModelList, typeCode, accTypeKey]);



    // 통합 검색 필터링 로직
    const filteredModels = useMemo(() => {
      const allSearchTerms = [
        makerSearchTerm,
        modelSearchTerm,
        specSearchTerm
      ].filter(term => term);

      console.log('🔍 AccessorySelector 디버깅:');
      console.log('  - accTypeKey:', accTypeKey);
      console.log('  - typeCode:', typeCode);
      console.log('  - accModelList 길이:', accModelList.length);
      console.log('  - accMakerList 길이:', accMakerList.length);
      console.log('  - 검색어:', { makerSearchTerm, modelSearchTerm, specSearchTerm });

      if (allSearchTerms.length === 0) {
        // 검색어가 없으면 해당 타입 코드와 일치하는 전체 모델 반환
        const filtered = accModelList.filter(item => item.accTypeCode === typeCode);
        console.log('  - 필터링된 모델 수 (검색어 없음):', filtered.length);
        console.log('  - 필터링된 모델들:', filtered);
        return filtered;
      }

      // 각 필드별로 검색어를 분리하여 정확하게 매칭 (AND 조건)
      const makerSearchLower = (makerSearchTerm || '').toLowerCase().trim();
      const modelSearchLower = (modelSearchTerm || '').toLowerCase().trim();
      const specSearchLower = (specSearchTerm || '').toLowerCase().trim();

      const filtered = accModelList.filter(item => {
        // 타입 코드 필터링 (필수)
        if (!typeCode || item.accTypeCode !== typeCode) {
          return false;
        }

        // 메이커 정보 찾기 (타입 코드도 일치해야 함)
        const makerInfo = accMakerList.find(maker => 
          maker.accMakerCode === item.accMakerCode && maker.accTypeCode === item.accTypeCode
        );
        const makerName = (makerInfo?.accMakerName || '').toLowerCase();
        const modelName = (item.accModelName || '').toLowerCase();
        const specification = (item.accSize || '').toLowerCase();

        // AND 조건: 모든 검색어가 각각의 필드에 정확히 매칭되어야 함
        // 검색어가 비어있으면 해당 조건은 무시 (true)
        // 검색어가 있으면 반드시 해당 필드에 포함되어야 함
        const hasMakerSearch = makerSearchLower.length > 0;
        const hasModelSearch = modelSearchLower.length > 0;
        const hasSpecSearch = specSearchLower.length > 0;

        // 메이커 검색어가 있으면 메이커 이름에만 매칭 (이름으로 검색, 선택 시 코드 저장)
        const makerMatch = !hasMakerSearch || makerName.includes(makerSearchLower);
        
        // 모델 검색어가 있으면 모델 이름에만 매칭 (이름으로 검색, 선택 시 코드 저장)
        const modelMatch = !hasModelSearch || modelName.includes(modelSearchLower);
        
        // 규격 검색어가 있으면 규격에만 매칭 (다른 필드와 혼동 방지)
        const specMatch = !hasSpecSearch || specification.includes(specSearchLower);

        // 모든 조건이 AND로 연결됨 (무조건 AND 조건)
        const result = makerMatch && modelMatch && specMatch;
        
        if (result) {
          console.log('  ✅ 매칭된 항목:', {
            makerCode: item.accMakerCode,
            makerName: makerInfo?.accMakerName,
            modelCode: item.accModelCode,
            modelName: item.accModelName,
            spec: item.accSize,
            '메이커 매칭': makerMatch,
            '모델 매칭': modelMatch,
            '규격 매칭': specMatch
          });
        } else {
          // 매칭 실패 시 이유 로깅
          if (makerSearchLower && !makerMatch) {
            console.log('  ❌ 메이커 매칭 실패:', {
              검색어: makerSearchLower,
              실제메이커이름: makerName,
              makerCode: item.accMakerCode
            });
          }
          if (modelSearchLower && !modelMatch) {
            console.log('  ❌ 모델 매칭 실패:', {
              검색어: modelSearchLower,
              실제모델이름: modelName,
              modelCode: item.accModelCode
            });
          }
        }
        
        return result;
      });

      console.log('  - 필터링된 모델 수 (검색어 있음):', filtered.length);
      console.log('  - 필터링된 모델들:', filtered.map(item => ({
        makerCode: item.accMakerCode,
        makerName: accMakerList.find(m => m.accMakerCode === item.accMakerCode)?.accMakerName,
        modelCode: item.accModelCode,
        modelName: item.accModelName
      })));
      return filtered;
    }, [makerSearchTerm, modelSearchTerm, specSearchTerm, accModelList, accMakerList, typeCode]);

    // 악세사리 선택 핸들러
    const handleSelectAccessory = (selectedModel: any) => {
      console.log('🔍 handleSelectAccessory 호출:', {
        accTypeKey,
        typeCode,
        selectedModel,
        makerCode: selectedModel.accMakerCode,
        modelCode: selectedModel.accModelCode,
        modelName: selectedModel.accModelName
      });
      
      // 메이커 이름 찾기
      const selectedMakerName = accMakerList.find(maker => 
        maker.accMakerCode === selectedModel.accMakerCode && maker.accTypeCode === selectedModel.accTypeCode
      )?.accMakerName || '';
      
      console.log('🔍 선택된 메이커 이름:', selectedMakerName);
      console.log('🔍 선택된 모델 정보:', {
        makerCode: selectedModel.accMakerCode,
        modelCode: selectedModel.accModelCode,
        modelName: selectedModel.accModelName,
        specification: selectedModel.accSize
      });
      
      // onAccessoryChange에 필요한 필드만 명확하게 전달
      const accessoryData = {
        typeCode: selectedModel.accTypeCode || typeCode,
        makerCode: selectedModel.accMakerCode,
        modelCode: selectedModel.accModelCode,
        specification: selectedModel.accSize || '',
        // 디버깅용 (실제 저장에는 사용되지 않음)
        makerName: selectedMakerName,
        modelName: selectedModel.accModelName || '',
        // 원본 데이터 참조용 (필요시)
        accTypeCode: selectedModel.accTypeCode,
        accMakerCode: selectedModel.accMakerCode,
        accModelCode: selectedModel.accModelCode,
        accSize: selectedModel.accSize,
        accModelName: selectedModel.accModelName,
      };
      
      console.log('🔍 onAccessoryChange에 전달할 데이터:', accessoryData);
      console.log('🔍 선택된 항목 검증:', {
        '선택한 메이커 코드': selectedModel.accMakerCode,
        '선택한 모델 코드': selectedModel.accModelCode,
        '선택한 모델 이름': selectedModel.accModelName,
        '메이커 이름': selectedMakerName,
        '타입 코드': selectedModel.accTypeCode,
        '예상 타입 코드': typeCode,
        '전체 selectedModel': selectedModel
      });
      onAccessoryChange(accessoryData);
      
      // 선택 시 세 입력 필드를 선택된 값으로 채우기
      setMakerSearchTerm(selectedMakerName);
      setModelSearchTerm(selectedModel.accModelName || '');
      setSpecSearchTerm(selectedModel.accSize || '');
      setIsDropdownOpen(false);
      setIsSelected(true); // 선택 완료 시 isSelected를 true로
    };

    // 선택 해제 핸들러
    const handleReset = () => {
      onAccessoryChange({
        ...currentAcc,
        typeCode: typeCode || '', // 기존 typeCode 유지
        makerCode: '',
        modelCode: '',
        specification: '',
      });
      setMakerSearchTerm('');
      setModelSearchTerm('');
      setSpecSearchTerm('');
      setIsSelected(false); // 선택 해제 시 isSelected를 false로
      setIsDropdownOpen(false); // 드롭다운 닫기
    };

    // 외부 클릭 감지 (드롭다운 닫기)
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);


    return (
      <div className="accessory-selector" ref={dropdownRef}>
        <div className="input-group-detail">
          <input
            type="text"
            placeholder="메이커"
            value={makerSearchTerm}
            onChange={(e) => {
              if (!isSelected && !isReadOnly) {
                setMakerSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }
            }}
            onFocus={() => {
              if (!isSelected && !isReadOnly) setIsDropdownOpen(true);
            }}
            readOnly={isSelected || isReadOnly} // isReadOnly 상태에 따라 읽기 전용
          />
          <input
            type="text"
            placeholder="모델명"
            value={modelSearchTerm}
            onChange={(e) => {
              if (!isSelected && !isReadOnly) {
                setModelSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }
            }}
            onFocus={() => {
              if (!isSelected && !isReadOnly) setIsDropdownOpen(true);
            }}
            readOnly={isSelected || isReadOnly}
          />
          <input
            type="text"
            placeholder="규격"
            value={specSearchTerm}
            onChange={(e) => {
              if (!isSelected && !isReadOnly) {
                setSpecSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }
            }}
            onFocus={() => {
              if (!isSelected && !isReadOnly) setIsDropdownOpen(true);
            }}
            readOnly={isSelected || isReadOnly}
          />
          {isSelected && (
            <button type="button" onClick={handleReset} className="reset-button" disabled={isReadOnly}>초기화</button>
          )}
        </div>
        {!isReadOnly && isDropdownOpen && (
          <ul className="dropdown-list">
            {filteredModels.length > 0 ? (
              filteredModels.map((item: any, index: number) => {
                const makerName = accMakerList.find(maker => maker.accMakerCode === item.accMakerCode && maker.accTypeCode === item.accTypeCode)?.accMakerName || '';
                // 클릭 시 전달할 항목을 명확하게 구성
                const itemToPass = {
                  ...item,
                  accTypeCode: item.accTypeCode || typeCode, // 타입 코드 명확히 설정
                };
                return (
                  <li
                    key={`${item.accTypeCode}-${item.accMakerCode}-${item.accModelCode}-${index}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isReadOnly) {
                        console.log('🔍 드롭다운 항목 클릭:', {
                          index,
                          item,
                          itemToPass,
                          makerCode: item.accMakerCode,
                          modelCode: item.accModelCode,
                          modelName: item.accModelName,
                          makerName,
                          accTypeCode: item.accTypeCode,
                          typeCode,
                          '전달할 항목': itemToPass
                        });
                        // 명확하게 타입 코드가 설정된 item 전달
                        handleSelectAccessory(itemToPass);
                      }
                    }}
                    style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
                  >
                    <span className="dropdown-maker">{makerName}</span>
                    <span className="dropdown-model">{item.accModelName}</span>
                    <span className="dropdown-spec">{item.accSize || ''}</span>
                  </li>
                );
              })
            ) : ( 
              <li>검색 결과가 없습니다.</li>
            )}
          </ul>
        )}
      </div>
    );
  };
  // 초기화
  useEffect(() => {
    console.log('EstimateDetailPage 초기화 시작');
    fetchBodyValveList();
    fetchMasterData();
  }, []); // 의존성 배열 비움 - 초기 로드만 필요

  // bodyValveList와 bodyRatingList가 로드된 후 기존 데이터 로드
  useEffect(() => {
    console.log('useEffect 실행:', { 
      bodyValveListLength: bodyValveList.length, 
      bodyRatingListLength: bodyRatingList.length, 
      tempEstimateNo 
    });
    if (bodyValveList.length > 0 && bodyRatingList.length > 0 && tempEstimateNo) {
      console.log('loadExistingData 호출 시작');
      loadExistingData();
    }
  }, [bodyValveList.length, bodyRatingList.length, tempEstimateNo]); // loadExistingData 의존성 제거

  // bodyValveList가 로드된 후 타입 이름을 코드→시리즈명으로 동기화
  useEffect(() => {
    if (bodyValveList.length > 0) {
      setTypes(prevTypes => {
        let changed = false;
        const next = prevTypes.map(type => {
          const key = (type as any).code ?? (type as any).id;
          const valveInfo = bodyValveList.find((v: any) => v.valveSeriesCode === key);
          const newName = valveInfo ? valveInfo.valveSeries : type.name;
          if (newName !== type.name) {
            changed = true;
            return { ...type, name: newName } as any;
          }
          return type;
        });
        return changed ? next : prevTypes;
      });
    }
  }, [bodyValveList]);

  // selectedValve가 변경될 때마다 기존 사양 데이터 로드
  useEffect(() => {
    if (selectedValve) {
      // 초기 로드만 필요하므로 여기서는 아무것도 하지 않음
      // handleValveSelection에서 처리됨
    }
  }, [selectedValve]);

  // selectedType이 변경되면 selectedValve를 초기화하여 Step 3를 숨김
  useEffect(() => {
      setSelectedValve(null);
  }, [selectedType]);

  // 초기 사양 데이터 로드 (DB에서 불러오기)
  const loadInitialSpecification = async (sheetID: number) => {
    console.log('🔍 loadInitialSpecification 호출됨 - sheetID:', sheetID);
    
    // 이미 임시 저장된 값이 있으면 서버값으로 덮어쓰지 않음
  if (tempSelections[sheetID]) {
    console.log('⚠️ tempSelections에 저장된 값이 있어서 서버에서 로드하지 않음');
    const saved = tempSelections[sheetID];
    setBodySelections(saved.body || {});
    setTrimSelections(saved.trim || {});
    setActSelections(saved.act || {});
    setAccSelections(saved.acc || {});
    return;
  }
    
    try {
      if (!tempEstimateNo) {
        console.error("tempEstimateNo가 없습니다.");
        return;
      }
      console.log('🔍 API 호출 시작 - tempEstimateNo:', tempEstimateNo, 'sheetID:', sheetID);
      const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/specification/${sheetID}`));
      console.log('🔍 API 응답 상태:', response.status, response.ok);
      
      if (response.ok) {
        const specificationData = await response.json();
        console.log('🔍 specificationData 전체:', specificationData);
        console.log('🔍 specificationData.accessories 존재 여부:', !!specificationData.accessories);
        // console.log('--- 실제 Accessories 데이터 구조 ---', specificationData.accessories);
        
        // if (specificationData.accessories) {
        //   console.log('개별 악세사리 데이터 (Positioner):', specificationData.accessories.positioner);
        //   console.log('개별 악세사리 데이터 (Solenoid):', specificationData.accessories.solenoid);
        //   console.log('개별 악세사리 데이터 (AirOperator):', specificationData.accessories.airOperator);
        //   console.log('개별 악세사리 데이터 (LockUp):', specificationData.accessories.lockUp);
        // }
        
        // Body 사양 데이터 설정 (초기값만) - null 처리 개선
        if (specificationData.body) {
          // console.log('Body 데이터:', specificationData.body); // Body 데이터 로그 추가
          setBodySelections(prev => ({
            ...prev,
            bonnetType: specificationData.body.bonnetTypeCode || '',
            bonnetTypeCode: specificationData.body.bonnetTypeCode || '',
            materialBody: specificationData.body.materialBodyCode || '',
            materialBodyCode: specificationData.body.materialBodyCode || '',
            sizeBodyUnit: specificationData.body.sizeUnit || '',
            sizeBody: specificationData.body.sizeCode || '',
            sizeBodyUnitCode: specificationData.body.sizeUnit || '', // Code 값 추가
            sizeBodyCode: specificationData.body.sizeCode || '', // Code 값 추가
            ratingUnit: (() => {
              if (specificationData.body.ratingUnit && bodyRatingList.length > 0) {
                const ratingItem = bodyRatingList.find(item => item.ratingUnitCode === specificationData.body.ratingUnit);
                return ratingItem ? ratingItem.ratingUnit : '';
              }
              return '';
            })(), // ratingUnitCode에 해당하는 ratingUnit 이름 찾기
            rating: specificationData.body.ratingCode || '',
            ratingUnitCode: (() => {
              if (specificationData.body.ratingUnit && bodyRatingList.length > 0) {
                const ratingItem = bodyRatingList.find(item => item.ratingUnitCode === specificationData.body.ratingUnit);
                return ratingItem ? ratingItem.ratingUnitCode : '';
              }
              return '';
            })(), // ratingUnitCode에 해당하는 ratingUnitCode 찾기
            ratingCode: specificationData.body.ratingCode || '', // Code 값 추가
            connection: specificationData.body.connectionCode || '',
            connectionCode: specificationData.body.connectionCode || ''
          }));
        }
        
        // Trim 사양 데이터 설정 (초기값만) - null 처리 개선
        if (specificationData.trim) {
          // console.log('Trim 데이터:', specificationData.trim); // Trim 데이터 로그 추가
          setTrimSelections(prev => ({
            ...prev,
            trimType: specificationData.trim.typeCode || '',
            trimTypeCode: specificationData.trim.typeCode || '',
            trimSeries: specificationData.trim.seriesCode || '',
            trimSeriesCode: specificationData.trim.seriesCode || '',
            materialTrim: specificationData.body?.materialTrimCode || '',
            materialTrimCode: specificationData.body?.materialTrimCode || '',
            sizePortUnit: specificationData.trim.portSizeUnit || '',
            sizePort: specificationData.trim.portSizeCode || '',
            sizePortUnitCode: specificationData.trim.portSizeUnit || '', // Code 값 추가
            sizePortCode: specificationData.trim.portSizeCode || '', // Code 값 추가
            form: specificationData.trim.formCode || '',
            formCode: specificationData.trim.formCode || '',
            option: specificationData.body?.optionCode || '' // Body에서 Option 값을 가져옴
          }));
        }
        
        // Actuator 사양 데이터 설정 (초기값만) - null 처리 개선
        if (specificationData.actuator) {
          // console.log('Actuator 데이터:', specificationData.actuator); // Actuator 데이터 로그 추가
          const seriesCode = specificationData.actuator.seriesCode || '';
          setActSelections(prev => ({
            ...prev,
            actionType: specificationData.actuator.typeCode || '',
            actionTypeCode: specificationData.actuator.typeCode || '',
            series: seriesCode,
            seriesCode: seriesCode,
            size: specificationData.actuator.sizeCode || '',
            sizeCode: specificationData.actuator.sizeCode || '',
            hw: specificationData.actuator.hwCode || '',
            hwCode: specificationData.actuator.hwCode || ''
          }));

          // Series 코드가 있으면 해당 Size 목록을 가져옴
          if (seriesCode) {
            fetchActSizeList(seriesCode);
          }
        }
        
        // Accessory 사양 데이터 설정 - 기존 데이터가 있으면 로드, 없으면 fetchMasterData에서 초기화됨
        if (specificationData.accessories) {
          console.log('🔍 전체 Accessories 객체:', specificationData.accessories);
          console.log('🔍 Accessories 키 목록:', Object.keys(specificationData.accessories));
          
          const newAccSelections = {
            positioner: { typeCode: 'Positioner', makerCode: '', modelCode: '', specification: '' },
            solenoid: { typeCode: 'Solenoid', makerCode: '', modelCode: '', specification: '' },
            limiter: { typeCode: 'Limit', makerCode: '', modelCode: '', specification: '' },
            airSupply: { typeCode: 'Airset', makerCode: '', modelCode: '', specification: '' },
            volumeBooster: { typeCode: 'Volume', makerCode: '', modelCode: '', specification: '' },
            airOperator: { typeCode: 'Airoperate', makerCode: '', modelCode: '', specification: '' },
            lockUp: { typeCode: 'Lockup', makerCode: '', modelCode: '', specification: '' },
            snapActingRelay: { typeCode: 'Snapacting', makerCode: '', modelCode: '', specification: '' },
          };

          // 백엔드 키 매핑 (PascalCase와 camelCase 모두 시도)
          // 백엔드 TypeCode → 프론트엔드 typeCode 매핑
          const backendToFrontendTypeCodeMap: Record<string, string> = {
            'Positioner': 'Positioner',
            'Solenoid': 'Solenoid',
            'Limiter': 'Limit',        // 백엔드는 "Limiter", 프론트엔드는 "Limit"
            'AirSupply': 'Airset',     // 백엔드는 "AirSupply", 프론트엔드는 "Airset"
            'VolumeBooster': 'Volume', // 백엔드는 "VolumeBooster", 프론트엔드는 "Volume"
            'AirOperator': 'Airoperate', // 백엔드는 "AirOperator", 프론트엔드는 "Airoperate"
            'LockUp': 'Lockup',        // 백엔드는 "LockUp", 프론트엔드는 "Lockup"
            'SnapActingRelay': 'Snapacting' // 백엔드는 "SnapActingRelay", 프론트엔드는 "Snapacting"
          };
          
          const keyMappings = [
            { backend: 'Positioner', frontend: 'positioner', frontendTypeCode: 'Positioner' },
            { backend: 'Solenoid', frontend: 'solenoid', frontendTypeCode: 'Solenoid' },
            { backend: 'Limiter', frontend: 'limiter', frontendTypeCode: 'Limit' },
            { backend: 'AirSupply', frontend: 'airSupply', frontendTypeCode: 'Airset' },
            { backend: 'VolumeBooster', frontend: 'volumeBooster', frontendTypeCode: 'Volume' },
            { backend: 'AirOperator', frontend: 'airOperator', frontendTypeCode: 'Airoperate' },
            { backend: 'LockUp', frontend: 'lockUp', frontendTypeCode: 'Lockup' },
            { backend: 'SnapActingRelay', frontend: 'snapActingRelay', frontendTypeCode: 'Snapacting' },
          ];

          keyMappings.forEach(({ backend, frontend, frontendTypeCode }) => {
            // 백엔드 키 접근: PascalCase와 camelCase 모두 시도
            const accObj = (specificationData.accessories as any)[backend] || 
                          (specificationData.accessories as any)[frontend];
            
            console.log(`🔍 악세사리 데이터 확인 (${backend}/${frontend}):`, accObj);
            
            // PascalCase와 camelCase 모두 시도 (원래 Positioner, Solenoid가 작동했던 방식)
            const makerCode = accObj?.makerCode || accObj?.MakerCode || '';
            const modelCode = accObj?.modelCode || accObj?.ModelCode || '';
            const backendTypeCode = accObj?.typeCode || accObj?.TypeCode || '';
            const specification = accObj?.specification || accObj?.Specification || '';
            
            // 백엔드 TypeCode를 프론트엔드 typeCode로 변환
            const frontendTypeCodeFinal = backendToFrontendTypeCodeMap[backendTypeCode] || frontendTypeCode;
            
            if (accObj && makerCode && modelCode) {
              // 실제 데이터가 있는 경우에만 설정 (프론트엔드 typeCode 사용)
              newAccSelections[frontend as keyof typeof newAccSelections] = {
                typeCode: frontendTypeCodeFinal, // 프론트엔드에서 사용하는 typeCode로 변환
                makerCode: makerCode,
                modelCode: modelCode,
                specification: specification,
              };
              console.log(`✅ AccSelections (${frontend}) 데이터 설정됨:`, {
                typeCode: frontendTypeCodeFinal,
                backendTypeCode,
                makerCode,
                modelCode,
                specification
              });
            } else {
              console.log(`⚠️ 악세사리 데이터 없음 (${backend}/${frontend}):`, {
                accObj,
                makerCode,
                modelCode,
                backendTypeCode,
                hasData: !!(accObj && makerCode && modelCode)
              });
            }
          });
          // console.log('최종 업데이트될 AccSelections:', newAccSelections);
          setAccSelections(newAccSelections);
        } else {
          console.log('⚠️ specificationData.accessories가 없습니다.');
        }
        // 액세서리 데이터가 없는 경우 fetchMasterData에서 초기화됨
      } else {
        console.log('❌ API 응답 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ 초기 사양 데이터 로드 실패:', error);
    }
  };
  const saveOrder = async () => {
  const sheetIDs = valves.map(v => v.sheetID);
  const resp = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/requests/order`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sheetIDs)
  });
  if (resp.ok) {
    alert('순서가 저장되었습니다.');
  } else {
    alert('순서 저장에 실패했습니다.');
  }
};

const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
  e.dataTransfer.setData('text/plain', String(index));
};
const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
  e.preventDefault();
  const dragIndex = Number(e.dataTransfer.getData('text/plain'));
  if (Number.isNaN(dragIndex)) return;
  setValves(prev => {
    const arr = [...prev];
    const [moved] = arr.splice(dragIndex, 1);
    arr.splice(dropIndex, 0, moved);
    return arr.map((it, i) => ({ ...it, sheetNo: i + 1 }));
  });
};

  // TagNo 변경 시 임시 저장된 선택값 복원
  const restoreTempSelections = (sheetID: number) => {
    const tempData = tempSelections[sheetID];
    if (tempData) {
      console.log(`${sheetID}의 임시 저장된 선택값들을 복원합니다:`, tempData);
      
      // Body 선택값 복원
      if (tempData.body) {
        setBodySelections(prev => ({
          ...prev,
          ...tempData.body
        }));
      }
      
      // Trim 선택값 복원
      if (tempData.trim) {
        setTrimSelections(prev => ({
          ...prev,
          ...tempData.trim
        }));
      }
      
      // Actuator 선택값 복원
      if (tempData.act) {
        setActSelections(prev => ({
          ...prev,
          ...tempData.act
        }));
      }
      
      // Accessory 선택값 복원
      if (tempData.acc) {
        setAccSelections(prev => ({
          ...prev,
          ...tempData.acc
        }));
      }
    } else {
      console.log(`${sheetID}의 임시 저장된 선택값이 없습니다.`);
    }
  };

  // Step 1, 2, 3 통합 섹션
  const StepsSection = () => (
    <div className="step-section-detail">
      <div className="steps-horizontal-container">
        <div className="step-col-detail">
          {/* Step 1: Type 선정 */}
          <div className="step-subsection-detail">
            <div className="step-header-container">
              <div className="step-title-section">
                <h4>Step 1</h4>
                <span className="step-description">Type 선정</span>
              </div>
              <div className="step-icon">
                <div className="circle-arrow-icon">
                  <MdArrowForward />
                </div>
              </div>
            </div>
            <div className="step-content-container">
              <div className="type-list-detail">
              {types.map((type) => (
                <div
                  key={type.id}
                  className={`type-item-detail ${selectedType === type.id ? 'selected' : ''}`}
                  onClick={() => handleTypeSelection(type)}
                >
                  <span>{(bodyValveList.find((v: any) => v.valveSeriesCode === type.id)?.valveSeries) || type.name} ({type.count})</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        <div className="step-col-detail">
          {/* Step 2: TagNo 선택 */}
          <div className="step-subsection-detail">
            <div className="step-header-container">
              <div className="step-title-section">
                <h4>Step 2</h4>
                <span className="step-description">TagNo 선택</span>
              </div>
              <div className="step-icon">
                <div className="circle-arrow-icon">
                  <MdArrowForward />
                </div>
              </div>
            </div>
            <div className="step-content-container">
            {selectedType ? (
              <div className="valve-list-detail">
              {valves
                .filter((valve) => valve.typeId === selectedType)
                .map((valve) => {
                  const originalIndex = valves.findIndex(v => (v.sheetID ?? v.id) === (valve.sheetID ?? valve.id));
                  return (
                    <div
                      key={valve.sheetID ?? valve.id}
                      className={`valve-item-detail ${selectedValve?.id === valve.id ? 'selected' : ''}`}
                      onClick={() => handleValveSelection(valve)}
                    >
                      <span>{valve.tagNo} ({valve.qty})</span>
                      <button 
                        className="btn btn-primary btn-sm ms-2"
                        onClick={(e) => {
                          e.stopPropagation(); // 부모 클릭 이벤트 방지
                          handleConvalCall(valve.sheetID ?? valve.id);
                        }}
                        disabled={isConvalProcessing}
                        title="Conval 호출"
                      >
                        {isConvalProcessing ? '처리중...' : 'Conval'}
                      </button>
                    </div>
                  );
                })}
            </div>
            ) : (
              <div className="no-type-selected">Step 1에서 Type을 선택하세요.</div>
            )}
            </div>
          </div>
        </div>
        
        {selectedValve && <div className="step-col-detail">
          {/* Step 3: 상세사양 입력 */}
          <div className="step-subsection-detail">
            <div className="step-header-container">
              <div className="step-title-section">
                <h4>Step 3</h4>
                <span className="step-description">상세사양 입력</span>
              </div>
            </div>
            <div className="step-content-container">
              <div className="step3-content-wrapper">
              <div className="specification-grid-detail">
              {/* BODY 섹션 */}
              <div className="spec-section-detail">
                <h4>BODY</h4>
                <table className="body-properties-table">
                  <tbody>
                    <tr>
                      <td>Bonnet Type</td>
                      <td>
                        <select value={bodySelections.bonnetType} onChange={(e) => handleBodyChange('bonnetType', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {bodyBonnetList && bodyBonnetList.length > 0 && bodyBonnetList.map((item: any) => (
                            <option key={item.bonnetCode} value={item.bonnetCode}>
                              {item.bonnet}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Material Body</td>
                      <td>
                        <select value={bodySelections.materialBody} onChange={(e) => handleBodyChange('materialBody', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {bodyMatList && bodyMatList.length > 0 && bodyMatList.map((item: any) => (
                            <option key={item.bodyMatCode} value={item.bodyMatCode}>
                              {item.bodyMat}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Size Body</td>
                      <td>
                        <div className="size-selection-group">
                          <select value={bodySelections.sizeBodyUnitCode} onChange={(e) => {
                            handleBodyChange('sizeBodyUnit', e.target.value);
                            handleBodyChange('sizeBodyUnitCode', e.target.value);
                          }} disabled={isReadOnly}>
                            <option value="">Unit 선택</option>
                            {bodySizeUnits && bodySizeUnits.length > 0 && 
                              bodySizeUnits.map((unit: any) => (
                                <option key={unit.unitCode} value={unit.unitCode}>
                                  {unit.unitName}
                                </option>
                              ))
                            }
                          </select>
                          <select value={bodySelections.sizeBodyCode} onChange={(e) => {
                            const selectedItem = bodySizeList.find(item => item.bodySizeCode === e.target.value);
                            if (selectedItem) {
                              handleBodyChange('sizeBody', selectedItem.bodySize);
                              handleBodyChange('sizeBodyCode', selectedItem.bodySizeCode);
                            }
                          }} disabled={!bodySelections.sizeBodyUnit || isReadOnly}>
                            <option value="">값 선택</option>
                            {bodySelections.sizeBodyUnit && bodySizeList && bodySizeList.length > 0 && 
                              bodySizeList
                                .filter(item => item.sizeUnitCode === bodySelections.sizeBodyUnit)
                                .map((item: any) => (
                                  <option key={item.bodySizeCode} value={item.bodySizeCode}>
                                    {item.bodySize} ({item.sizeUnit})
                                  </option>
                                ))
                            }
                          </select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Rating</td>
                      <td>
                        <div className="rating-selection-group">
                          <select value={bodySelections.ratingUnit} onChange={(e) => {
                            const selectedUnit = bodyRatingList.find(item => item.ratingUnit === e.target.value);
                            if (selectedUnit) {
                              handleBodyChange('ratingUnit', selectedUnit.ratingUnit);
                              handleBodyChange('ratingUnitCode', selectedUnit.ratingUnitCode);
                            }
                          }} disabled={isReadOnly}>
                            <option value="">Unit 선택</option>
                            {bodyRatingList && bodyRatingList.length > 0 && 
                              bodyRatingList
                                .map(item => item.ratingUnit)
                                .filter((unit, index, arr) => arr.indexOf(unit) === index)
                                .map((unit: string) => (
                                  <option key={unit} value={unit}>
                                    {unit}
                                  </option>
                                ))
                            }
                          </select>
                          <select value={bodySelections.ratingCode} onChange={(e) => {
                            const selectedItem = bodyRatingList.find(item => item.ratingCode === e.target.value);
                            if (selectedItem) {
                              handleBodyChange('rating', selectedItem.ratingName);
                              handleBodyChange('ratingCode', selectedItem.ratingCode);
                            }
                          }} disabled={!bodySelections.ratingUnitCode || isReadOnly}>
                            <option value="">값 선택</option>
                            {bodySelections.ratingUnit && bodyRatingList && bodyRatingList.length > 0 && 
                              bodyRatingList
                                .filter(item => item.ratingUnit === bodySelections.ratingUnit)
                                .map((item: any) => (
                                  <option key={item.ratingCode} value={item.ratingCode}>
                                    {item.ratingName}
                                  </option>
                                ))
                            }
                          </select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Connection</td>
                      <td>
                        <select value={bodySelections.connection} onChange={(e) => handleBodyChange('connection', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {bodyConnectionList && bodyConnectionList.length > 0 && bodyConnectionList.map((item: any) => (
                            <option key={item.connectionCode} value={item.connectionCode}>
                              {item.connection}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <h4>ACT</h4>
                <table className="act-properties-table">
                  <tbody>
                    <tr>
                      <td>Action Type</td>
                      <td>
                        <select value={actSelections.actionType} onChange={(e) => handleActChange('actionType', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {actTypeList && actTypeList.length > 0 && actTypeList.map((item: any) => (
                            <option key={item.actTypeCode} value={item.actTypeCode}>
                              {item.actType}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Series</td>
                      <td>
                        <select value={actSelections.series} onChange={(e) => handleActChange('series', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {actSeriesList && actSeriesList.length > 0 && actSeriesList.map((item: any) => (
                            <option key={item.actSeriesCode} value={item.actSeriesCode}>
                              {item.actSeries}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Size</td>
                      <td>
                        <select value={actSelections.size} onChange={(e) => handleActChange('size', e.target.value)} disabled={!actSelections.series || isReadOnly}>
                          <option value="">선택하세요</option>
                          {actSizeList && actSizeList.length > 0 && 
                            actSizeList.map((item: any) => (
                              <option key={item.actSizeCode} value={item.actSizeCode}>
                                {item.actSize}
                              </option>
                            ))
                          }
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>H.W</td>
                      <td>
                        <select value={actSelections.hw} onChange={(e) => handleActChange('hw', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {actHWList && actHWList.length > 0 && actHWList.map((item: any) => (
                            <option key={item.hwCode} value={item.hwCode}>
                              {item.hw}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Trim 섹션 */}
              <div className="spec-section-detail">
                <h4>Trim</h4>
                <table className="trim-properties-table">
                  <tbody>
                    <tr>
                      <td>Trim Type</td>
                      <td>
                        <select value={trimSelections.trimType} onChange={(e) => handleTrimChange('trimType', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {trimTypeList && trimTypeList.length > 0 && trimTypeList.map((item: any) => (
                            <option key={item.trimTypeCode} value={item.trimTypeCode}>
                              {item.trimType}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Trim Series</td>
                      <td>
                        <select value={trimSelections.trimSeries} onChange={(e) => handleTrimChange('trimSeries', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {trimSeriesList && trimSeriesList.length > 0 && trimSeriesList.map((item: any) => (
                            <option key={item.trimSeriesCode} value={item.trimSeriesCode}>
                              {item.trimSeries}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Material Trim</td>
                      <td>
                        <select value={trimSelections.materialTrim} onChange={(e) => handleTrimChange('materialTrim', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {trimMatList && trimMatList.length > 0 && trimMatList.map((item: any) => (
                            <option key={item.trimMatCode} value={item.trimMatCode}>
                              {item.trimMat}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Option</td>
                      <td>
                        <select value={trimSelections.option} onChange={(e) => handleTrimChange('option', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {trimOptionList && trimOptionList.length > 0 && trimOptionList.map((item: any) => (
                            <option key={item.trimOptionCode} value={item.trimOptionCode}>
                              {item.trimOption}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Size Port</td>
                      <td>
                        <div className="size-selection-group">
                          <select value={trimSelections.sizePortUnitCode} onChange={(e) => {
                            handleTrimChange('sizePortUnit', e.target.value);
                            handleTrimChange('sizePortUnitCode', e.target.value);
                          }} disabled={isReadOnly}>
                            <option value="">Unit 선택</option>
                            {trimPortSizeList && trimPortSizeList.length > 0 && 
                              trimPortSizeList
                                .map(item => ({ unitCode: item.unitCode, unitName: item.unitName }))
                                .filter((item, index, arr) => arr.findIndex(x => x.unitCode === item.unitCode) === index)
                                .map((item: any) => (
                                  <option key={item.unitCode} value={item.unitCode}>
                                    {item.unitName}
                                  </option>
                                ))
                            }
                          </select>
                          <select value={trimSelections.sizePortCode} onChange={(e) => {
                            const selectedItem = trimPortSizeList.find(item => item.portSizeCode === e.target.value);
                            if (selectedItem) {
                              handleTrimChange('sizePort', selectedItem.portSize);
                              handleTrimChange('sizePortCode', selectedItem.portSizeCode);
                            }
                          }} disabled={!trimSelections.sizePortUnit || isReadOnly}>
                            <option value="">값 선택</option>
                            {trimSelections.sizePortUnit && trimPortSizeList && trimPortSizeList.length > 0 && 
                              trimPortSizeList
                                .filter(item => item.unitCode === trimSelections.sizePortUnit)
                                .map((item: any) => (
                                  <option key={item.portSizeCode} value={item.portSizeCode}>
                                    {item.portSize} ({item.unitName})
                                  </option>
                                ))
                            }
                          </select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Form</td>
                      <td>
                        <select value={trimSelections.form} onChange={(e) => handleTrimChange('form', e.target.value)} disabled={isReadOnly}>
                          <option value="">선택하세요</option>
                          {trimFormList && trimFormList.length > 0 && trimFormList.map((item: any) => (
                            <option key={item.trimFormCode} value={item.trimFormCode}>
                              {item.trimForm}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              </div>

              {/* ACC 섹션 - BODY, Trim, ACT 표 아래로 이동 */}
              <div className="acc-section-container">
                <div className="spec-section-detail acc-section-detail">
                    <h4>ACC</h4>
                    <table className="acc-properties-table">
                      <tbody>
                        <tr>
                          <td>Positioner</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="positioner"
                              typeCode="Positioner"
                              currentAcc={accSelections.positioner}
                              accMakerList={accMakerListByType.Positioner || []}
                              accModelList={accModelListByType.Positioner || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('positioner', accessory)}
                              // EstimateRequest.IsPositioner(= tag.isPositioner)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !(selectedValve?.accessory.positioner?.exists)}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Solenoid Valve</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="solenoid"
                              typeCode="Solenoid"
                              currentAcc={accSelections.solenoid}
                              accMakerList={accMakerListByType.Solenoid || []}
                              accModelList={accModelListByType.Solenoid || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('solenoid', accessory)}
                              // EstimateRequest.IsSolenoid(= tag.isSolenoid)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !selectedValve?.accessory.solenoidValve}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Limit Switch</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="limiter"
                              typeCode="Limit"
                              currentAcc={accSelections.limiter}
                              accMakerList={accMakerListByType.Limit || []}
                              accModelList={accModelListByType.Limit || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('limiter', accessory)}
                              // EstimateRequest.IsLimSwitch(= tag.isLimSwitch)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !selectedValve?.accessory.limitSwitch}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Air Set</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="airSupply"
                              typeCode="Airset"
                              currentAcc={accSelections.airSupply}
                              accMakerList={accMakerListByType.Airset || []}
                              accModelList={accModelListByType.Airset || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('airSupply', accessory)}
                              // EstimateRequest.IsAirSet(= tag.isAirSet)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !selectedValve?.accessory.airSet}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Volume Booster</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="volumeBooster"
                              typeCode="Volume"
                              currentAcc={accSelections.volumeBooster}
                              accMakerList={accMakerListByType.Volume || []}
                              accModelList={accModelListByType.Volume || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('volumeBooster', accessory)}
                              // EstimateRequest.IsVolumeBooster(= tag.isVolumeBooster)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !selectedValve?.accessory.volumeBooster}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Air Operated Valve</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="airOperator"
                              typeCode="Airoperate"
                              currentAcc={accSelections.airOperator}
                              accMakerList={accMakerListByType.Airoperate || []}
                              accModelList={accModelListByType.Airoperate || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('airOperator', accessory)}
                              // EstimateRequest.IsAirOperated(= tag.isAirOperated)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !selectedValve?.accessory.airOperatedValve}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Lock-Up Valve</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="lockUp"
                              typeCode="Lockup"
                              currentAcc={accSelections.lockUp}
                              accMakerList={accMakerListByType.Lockup || []}
                              accModelList={accModelListByType.Lockup || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('lockUp', accessory)}
                              // EstimateRequest.IsLockUp(= tag.isLockUp)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !selectedValve?.accessory.lockupValve}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Snap Acting Relay</td>
                          <td>
                            <AccessorySelector
                              accTypeKey="snapActingRelay"
                              typeCode="Snapacting"
                              currentAcc={accSelections.snapActingRelay}
                              accMakerList={accMakerListByType.Snapacting || []}
                              accModelList={accModelListByType.Snapacting || []}
                              onAccessoryChange={(accessory) => handleAccessoryChange('snapActingRelay', accessory)}
                              // EstimateRequest.IsSnapActingRelay(= tag.isSnapActingRelay)가 false이면 선택 비활성
                              isReadOnly={isReadOnly || !selectedValve?.accessory.snapActingRelay}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    {/* 악세사리 재로딩 버튼 */}
                    <div className="acc-reload-section">
                      <button 
                        type="button" 
                        className="btn btn-primary acc-reload-btn"
                        onClick={handleAccReload}
                        disabled={isReadOnly}
                      >
                        <span className="refresh-icon">🔄</span>
                        악세사리
                      </button>
                    </div>
                  </div>
              </div>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );

  // 고객 요청사항 섹션 (항상 readonly)
  const CustomerRequirementSection = () => (
    <div className="step-section-detail">
      <div className="step-header-detail">
        <h3>고객 요청사항</h3>
      </div>
      <div className="customer-requirement-content-detail">
        <textarea
          value={customerRequirement}
          onChange={() => {}} // 변경 불가
          readOnly={true} // 항상 readonly
          placeholder="고객 요청사항이 없습니다."
          className="customer-requirement-textarea-detail"
        />
      </div>
    </div>
  );


  // 고객 요청 첨부파일 섹션 (다운로드만 가능)
  const CustomerAttachmentsSection = () => (
    <div className="step-section-detail">
      <div className="step-header-detail">
        <h3>첨부파일</h3>
      </div>
      <div className="attachments-content">
        {customerAttachments.length > 0 ? (
          <div className="attachment-list-detail">
            {customerAttachments.map((file, index) => {
              const name = file.fileName || '';
              const lower = name.toLowerCase();
              const Icon = lower.endsWith('.pdf') ? FaFilePdf
                : (lower.endsWith('.xls') || lower.endsWith('.xlsx')) ? FaFileExcel
                : (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.hwp')) ? FaFileWord
                : (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.bmp') || lower.endsWith('.webp') || lower.endsWith('.tiff')) ? FaFileImage
                : FaFileAlt;
              return (
                <div
                  key={index}
                  className="attachment-item-detail"
                  title={name}
                  onClick={() => handleDownloadFile(file, 'customer')}
                >
                  <Icon className="file-icon" />
                  <span className="file-name-detail">{name}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-attachments">
            고객 요청 첨부파일이 없습니다.
          </div>
        )}
      </div>
    </div>
  );

  // 관리 첨부파일 섹션 (업로드, 다운로드, 생성 가능)
  const ManagerAttachmentsSection = () => (
    <div className="step-section-detail">
      <div className="step-header-detail">
        <h3>견적 서류 발급</h3>
      </div>
      <div className="doc-issue-list">
        <div className="doc-item">
          <span className="doc-label">CV LIST</span>
          <button
            className={`icon-download ${docGenerating['cvlist'] ? 'loading' : ''}`}
            title="생성 후 다운로드"
            onClick={() => generateAndDownload('cvlist', 'generate-cv')}
            disabled={!!docGenerating['cvlist']}
          >{docGenerating['cvlist'] ? '⏳' : <FaDownload />}</button>
        </div>
        <div className="doc-item">
          <span className="doc-label">VALVE LIST</span>
          <button
            className={`icon-download ${docGenerating['vllist'] ? 'loading' : ''}`}
            title="생성 후 다운로드"
            onClick={() => generateAndDownload('vllist', 'generate-vl')}
            disabled={!!docGenerating['vllist']}
          >{docGenerating['vllist'] ? '⏳' : <FaDownload />}</button>
        </div>
        <div className="doc-item">
          <span className="doc-label">DATA SHEET</span>
          <button
            className={`icon-download ${docGenerating['datasheet'] ? 'loading' : ''}`}
            title="생성 후 다운로드"
            onClick={() => generateAndDownload('datasheet', 'generate-datasheet')}
            disabled={!!docGenerating['datasheet']}
          >{docGenerating['datasheet'] ? '⏳' : <FaDownload />}</button>
        </div>
        <div className="doc-item">
          <span className="doc-label">견적서</span>
          <button
            className={`icon-download ${docGenerating['singlequote'] ? 'loading' : ''}`}
            title="생성 후 다운로드"
            onClick={() => generateAndDownload('singlequote', 'generate-single-quote')}
            disabled={!!docGenerating['singlequote']}
          >{docGenerating['singlequote'] ? '⏳' : <FaDownload />}</button>
        </div>
      </div>
    </div>
  );
  useEffect(() => {
    if (tempEstimateNo) {
      loadExistingData();
      // 🔑 파일 목록 조회 추가
      fetchManagerFiles();
      fetchCustomerFiles();
    }
  }, [tempEstimateNo, loadExistingData]); // loadExistingData 추가

  useEffect(() => {
    // types와 accModelList가 모두 로드된 후에만 loadInitialSpecification을 호출
    // 단, 이미 로드된 sheetID이거나 tempSelections에 저장된 값이 있으면 다시 로드하지 않음
    console.log('🔍 useEffect 체크:', {
      tempEstimateNo: !!tempEstimateNo,
      typesLength: types.length,
      accModelListLength: accModelList.length,
      selectedValve: !!selectedValve,
      sheetID: selectedValve?.sheetID,
      loadedSheetIDs: Array.from(loadedSheetIDs),
      hasTempSelection: selectedValve ? !!tempSelections[selectedValve.sheetID] : false
    });
    
    if (tempEstimateNo && types.length > 0 && accModelList.length > 0) {
      if (selectedValve && selectedValve.sheetID > 0) {
        const sheetID = selectedValve.sheetID;
        // 이미 로드되었거나 tempSelections에 저장된 값이 있으면 다시 로드하지 않음
        if (!loadedSheetIDs.has(sheetID) && !tempSelections[sheetID]) {
          console.log('🔍 useEffect - loadInitialSpecification 호출');
          loadInitialSpecification(sheetID);
          setLoadedSheetIDs(prev => new Set(prev).add(sheetID));
        } else {
          console.log('⚠️ useEffect - loadInitialSpecification 호출 안함:', {
            alreadyLoaded: loadedSheetIDs.has(sheetID),
            hasTempSelection: !!tempSelections[sheetID]
          });
        }
      } else {
        console.log('⚠️ useEffect - selectedValve가 없거나 sheetID가 0');
      }
    } else {
      console.log('⚠️ useEffect - 조건 불충족:', {
        tempEstimateNo: !!tempEstimateNo,
        typesLength: types.length,
        accModelListLength: accModelList.length
      });
    }
  }, [selectedValve?.sheetID, tempEstimateNo, types.length, accModelList.length]); // types와 accModelList의 length만 의존성으로 사용

  // 시작 취소 핸들러
  const handleCancelStart = async () => {
    if (!tempEstimateNo) return;
    
    // 권한 체크: 담당자만 가능
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
    
    if (!isManager) {
      alert('담당자만 변경 가능합니다.');
      return;
    }
    
    if (window.confirm('견적 시작을 취소하시겠습니까? 담당자 배정이 해제되고 "견적요청" 상태로 돌아갑니다.')) {
      try {
        const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/cancel-start`), {
          method: 'POST',
        });

        if (response.ok) {
          alert('견적 시작이 취소되었습니다.');
          setCurrentStatus('견적요청');
          loadExistingData(); // 데이터 새로고침
        } else {
          const errorText = await response.text();
          alert(`시작 취소에 실패했습니다: ${errorText}`);
        }
      } catch (error) {
        console.error('시작 취소 중 오류 발생:', error);
        alert('시작 취소 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 주문 취소 핸들러
  const handleCancelOrder = async () => {
    if (!tempEstimateNo) return;
    if (window.confirm('정말로 주문을 취소하시겠습니까? "견적완료" 상태로 돌아갑니다.')) {
      try {
        const response = await fetch(buildApiUrl(`/estimate/sheets/${tempEstimateNo}/order/cancel`), {
          method: 'POST',
        });

        if (response.ok) {
          alert('주문이 취소되었습니다.');
          setCurrentStatus('견적완료');
          loadExistingData(); // 데이터 새로고침
        } else {
          const errorText = await response.text();
          alert(`주문 취소에 실패했습니다: ${errorText}`);
        }
      } catch (error) {
        console.error('주문 취소 중 오류 발생:', error);
        alert('주문 취소 처리 중 오류가 발생했습니다.');
      }
    }
  };

  // 악세사리 변경 핸들러
  const handleAccessoryChange = (accTypeKey: string, accessory: any) => {
    console.log('🔍 handleAccessoryChange 호출:', {
      accTypeKey,
      accessory,
      makerCode: accessory?.makerCode,
      modelCode: accessory?.modelCode,
      modelName: accessory?.modelName,
      makerName: accessory?.makerName,
      accTypeCode: accessory?.accTypeCode,
      typeCode: accessory?.typeCode
    });
    
    // 필요한 필드만 추출하여 저장 (불필요한 데이터 제거)
    const cleanAccessory = {
      typeCode: accessory?.typeCode || accessory?.accTypeCode || '',
      makerCode: accessory?.makerCode || accessory?.accMakerCode || '',
      modelCode: accessory?.modelCode || accessory?.accModelCode || '',
      specification: accessory?.specification || accessory?.accSize || '',
    };
    
    console.log('🔍 정리된 악세사리 데이터:', cleanAccessory);
    
    setAccSelections(prev => {
      // 기존 악세사리 값들을 모두 유지하면서 특정 타입만 업데이트
      const newSelections = { ...prev, [accTypeKey]: cleanAccessory };
      
      console.log('🔍 업데이트된 accSelections:', newSelections);
      
      // 맵에 반영
      const sid = selectedValve?.sheetID;
      if (sid) {
        setAccSelectionsBySheet((prevMap: any) => ({
          ...prevMap,
          [sid]: newSelections
        }));
      }
      return newSelections;
    });
  };

  // 액추에이터 변경 핸들러

  // bodySizeList가 로드된 후 bodySizeUnits 설정
  useEffect(() => {
    if (bodySizeList && bodySizeList.length > 0) {
      // bodySizeList에서 고유한 단위 코드와 이름을 추출
      const units = bodySizeList
        .map(item => ({ unitCode: item.sizeUnitCode, unitName: item.sizeUnit }))
        .filter((item, index, arr) => arr.findIndex(x => x.unitCode === item.unitCode) === index)
        .sort((a, b) => {
          // 정렬 순서: None -> A -> I -> SPECIAL
          if (a.unitCode === 'N') return -1;
          if (b.unitCode === 'N') return 1;
          if (a.unitCode === 'A') return -1;
          if (b.unitCode === 'A') return 1;
          if (a.unitCode === 'I') return -1;
          if (b.unitCode === 'I') return 1;
          return 0;
        });
      
      setBodySizeUnits(units);
      console.log('🔍 bodySizeUnits 설정 완료:', units);
    }
  }, [bodySizeList]);

  if (isLoadingFiles) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="estimate-detail-page dashboard-page">
      {/* 헤더 */}
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">
          {(() => {
            const st = (location.state || {}) as any;
            if (st.from === 'management') return '견적요청 관리';
            if (st.from === 'inquiry') return '견적요청 조회';
            return '견적요청';
          })()}
        </h1>
      </div>

      {/* 상단 우측 미니 패널: 견적 서류 발급 + 고객 제출 문서 업로드 */}
      <div className="mini-tools-panel">
        <EstimateSummaryCard />
        <ManagerAttachmentsSection />
        <div className="step-section-detail customer-uploader">
          <div className="uploader-header">
            <h3>고객 제출 문서 업로드</h3>
            <div className="header-actions-detail">
              {(() => {
                // 권한 체크: 담당자이고 견적처리중 이상일 때만 업로드 가능
                const userStr = localStorage.getItem('user');
                const currentUser = userStr ? JSON.parse(userStr) : null;
                const currentStatus = estimateData?.estimateSheet?.status || 0;
                const isStatusInProgressOrAbove = currentStatus >= 3;
                const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
                const canUpload = isStatusInProgressOrAbove && isManager;
                
                return (
                  <>
                    <input
                      ref={customerAddInputRef}
                      type="file"
                      multiple
                      onChange={handleCustomerFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.hwp,.txt,.zip,.rar,.7z,.csv,.json,.jpg,.jpeg,.png,.gif,.bmp,.webp,.tiff"
                      style={{ display: 'none' }}
                    />
                    <button 
                      className="btn btn-light btn-xs" 
                      onClick={() => {
                        if (canUpload) {
                          customerAddInputRef.current?.click();
                        } else {
                          alert('담당자만 변경 가능합니다.');
                        }
                      }}
                    >
                      추가
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="uploader-list">
            {isLoadingFiles ? (
              <div className="loading" style={{ padding: 8 }}>로딩 중…</div>
            ) : customerFiles.length === 0 ? (
              <div className="no-files" style={{ padding: 8, color: '#6c757d' }}>업로드된 파일이 없습니다.</div>
            ) : (
              customerFiles.map(file => {
                const name = file.fileName || '';
                const lower = name.toLowerCase();
                const Icon = lower.endsWith('.pdf') ? FaFilePdf
                  : (lower.endsWith('.xls') || lower.endsWith('.xlsx')) ? FaFileExcel
                  : (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.endsWith('.hwp')) ? FaFileWord
                  : (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.bmp') || lower.endsWith('.webp') || lower.endsWith('.tiff')) ? FaFileImage
                  : FaFileAlt;
                return (
                  <div key={file.attachmentID} className="uploader-item">
                    <Icon className="file-icon" />
                    <span className="file-name-detail" title={name}>{name}</span>
                    <button className="remove-btn" onClick={() => deleteAttachmentById(file.attachmentID)}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* 견적 시작/마감 버튼 컬럼 */}
        <div className="quote-actions">
          {(() => {
            // 명확한 상태 기반 분기 처리
            console.log('🔍 현재 currentStatus:', currentStatus);
            // 임시로 항상 견적시작 버튼 표시 (디버깅용)
            if (currentStatus === '견적요청' || currentStatus === '' || !currentStatus) {
              console.log('✅ 견적시작 버튼 렌더링');
              return (
                <button className="btn btn-success" onClick={handleStartQuote}>견적시작</button>
              );
            }
            if (currentStatus === '견적처리중') {
              // 권한 체크: 담당자만 상태 변경 가능 (관리자 제외)
              const userStr = localStorage.getItem('user');
              const currentUser = userStr ? JSON.parse(userStr) : null;
              const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
              
              return (
                <div className="button-column">
                  <button className="btn btn-primary" onClick={handleCompleteQuote}>견적완료</button>
                  <button className="btn btn-danger" onClick={handleCancelStart}>시작취소</button>
                </div>
              );
            }
            if (currentStatus === '견적완료') {
              // 권한 체크: 담당자만 상태 변경 가능 (관리자 제외)
              const userStr = localStorage.getItem('user');
              const currentUser = userStr ? JSON.parse(userStr) : null;
              const isManager = currentUser?.userId === estimateData?.estimateSheet?.managerID || currentUser?.userID === estimateData?.estimateSheet?.managerID;
              
              return (
                <div className="button-column">
                  <button className="btn btn-success" onClick={handleConfirmOrder}>주문확정</button>
                  <button className="btn btn-danger" onClick={handleCancelComplete}>완료취소</button>
                </div>
              );
            }
            if (currentStatus === '주문') {
              return (
                <button className="btn btn-danger" onClick={handleCancelOrder}>주문취소</button>
              );
            }
            // 그 외의 경우 (로딩 중 등)는 버튼을 표시하지 않음
            return null;
          })()}
        </div>
      </div>

      {/* 상태 및 프로젝트 정보 */}
      <div className="status-section-detail">
        {/*
        <div className="status-group">
          <label>진행상태:</label>
          <select 
            value={currentStatus} 
            onChange={(e) => {
              const newStatus = e.target.value;
              if (newStatus !== currentStatus) {
                handleStatusChange(newStatus);
              }
            }}
            className="status-select-detail"
          >
            <option value="견적요청">견적요청</option>
            <option value="견적처리중">견적처리중</option>
            <option value="견적완료">견적완료</option>
            <option value="주문">주문</option>
          </select>
        </div>
        */}
        <div className="project-group-detail" style={{ width: '100%' }}>
          <div className="request-card" style={{ marginTop: 0 }}>
            <div className="request-header">
              <div className="info-table">
                <div className="row">
                  <div className="cell label">프로젝트명</div>
                  <div className="cell value">
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e)=>setProjectName(e.target.value)}
                      className="project-input-lg"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 저장 버튼 */}
        <div className="save-section">
              <button 
                className="btn btn-primary save-specification-btn"
                onClick={handleSaveSpecification}
                disabled={isReadOnly} // isReadOnly 상태에 따라 비활성화
              >
                사양 저장
              </button>
            </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content-detail">
        <div className="steps-container-detail">
          <StepsSection />
          
          {/* 고객 요청 사항과 첨부파일을 하나의 블록으로 묶음 */}
          <div className="customer-request-block-detail">
            <CustomerRequirementSection />
            <CustomerAttachmentsSection />
          </div>

          <StaffCommentSection 
            value={staffComment}
            onChange={handleStaffCommentChange}
            isReadOnly={isReadOnly}
          />
        </div>
        
        {/* 품번 표시 섹션 - 한 줄 모눈종이 */}
        <div className="part-number-section">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">생성된 품번</h3>
          <div className="part-number-single-line">
            {generatePartNumber().split('').map((char: string, index: number) => (
              <div 
                key={index}
                className={`char-box ${char === '0' ? 'empty-char' : 'filled-char'}`}
                title={`위치 ${index}: ${char}`}
              >
                {char}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  };
  
  export default EstimateDetailPage;
