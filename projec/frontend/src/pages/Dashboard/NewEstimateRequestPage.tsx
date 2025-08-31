import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './DashboardPages.css';
import './NewEstimateRequest.css';

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

// CustomerRequest 파일인지 확인하는 크로스플랫폼 함수
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

// ResultFiles/customer 파일인지 확인 (고객에게 제공되는 결과 문서)
const isResultCustomerFile = (filePath: string): boolean => {
  if (!filePath) return false;
  const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
  // 트레일링 슬래시 유무와 대소문자 차이 허용
  return normalizedPath.includes('/resultfiles/customer');
};

// 단위/사이즈 마스터 데이터 타입
interface BodySizeUnit {
  unitCode: string;
  unitName: string;
}

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

interface ValveData {
  id: string;  // 드래그앤드롭용 고유 ID
  tagNo: string;
  qty: number;
  order: number;  // 순서 정보
  sheetID: number;  // DB의 SheetID와 연결
  typeId: string;  // 연결된 Type의 ID
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
    typeCode: string; // ValveSeriesCode
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
    positioner: { exists: boolean; type: string; maker: string; model: string; };
    explosionProof: string;
    transmitter: { exists: boolean; type: string; };
    solenoidValve: { exists: boolean; type: string; maker: string; model: string; };
    limitSwitch: { exists: boolean; type: string; maker: string; model: string; };
    airSet: { exists: boolean; type: string; maker: string; model: string; };
    volumeBooster: { exists: boolean; type: string; maker: string; model: string; };
    airOperatedValve: { exists: boolean; type: string; maker: string; model: string; };
    lockupValve: { exists: boolean; type: string; maker: string; model: string; };
    snapActingRelay: { exists: boolean; type: string; maker: string; model: string; };
  };
  // 라디오 버튼 상태들
  isQM: boolean;
  isP2: boolean;
  isN1: boolean;
  isDensity: boolean;
  isHW: boolean;

}

interface TypeData {
  id: string;
  name: string;
  code: string; // ValveSeriesCode 추가
  count: number;
  order: number;
  typeId: string; // 추가
}

interface BodyValveData {
  valveSeries: string;
  valveSeriesCode: string;
}

// 드래그 가능한 아이템 컴포넌트
const SortableItem = ({ children, id }: { children: React.ReactNode; id: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners}>
        {children}
      </div>
    </div>
  );
};

// 기타 요청사항 컴포넌트 (완전히 독립적)
const CustomerRequirementComponent = React.memo(({ 
  value, 
  onChange,
  isReadOnly = false
}: { 
  value: string; 
  onChange: (value: string) => void; 
  isReadOnly?: boolean;
}) => {
  const [localValue, setLocalValue] = useState(value);
  
  // 외부 값이 변경되면 동기화
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  return (
    <div className="requirement-section">
      <h4>기타요청사항</h4>
      <textarea 
        id="customer-requirement"
        name="customerRequirement"
        value={localValue}
        onChange={handleChange}
        placeholder="기타 요청사항을 입력해주세요."
        disabled={isReadOnly}
      />
    </div>
  );
});

const NewEstimateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tempEstimateNo, setTempEstimateNo] = useState<string>('');
  const isDataLoaded = useRef<boolean>(false); // 데이터 로딩 상태 추적
  const [projectName, setProjectName] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [types, setTypes] = useState<TypeData[]>([]);
  const [valves, setValves] = useState<ValveData[]>([]);
  const [currentValve, setCurrentValve] = useState<ValveData | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [customerRequirement, setCustomerRequirement] = useState('');
  const [otherRequests, setOtherRequests] = useState<any[]>([]);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false); // READONLY 모드 상태
  const [backendStatusText, setBackendStatusText] = useState<string>(''); // 백엔드 상태 텍스트
  const [backendStatus, setBackendStatus] = useState<number | null>(null);   // 백엔드 상태 코드 (1~5)
  const [staffComment, setStaffComment] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // 현재 선택된 Type과 Valve의 ID를 저장하는 상태
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedValveId, setSelectedValveId] = useState<string | null>(null);

  // 요약 카드 표시용 파생 값들
  const totalQty = useMemo(() => valves.reduce((sum, v) => sum + (Number(v.qty) || 0), 0), [valves]);
  const statusText = useMemo(() => (isReadOnly ? '조회' : (valves.length > 0 ? '작성중' : '신규')), [isReadOnly, valves.length]);
  const uiStatusText = useMemo(() => backendStatusText || statusText, [backendStatusText, statusText]);
  
  // 🔑 관리 첨부파일 상태 추가
  const [managerAttachments, setManagerAttachments] = useState<any[]>([]);

  const [bodyValveList, setBodyValveList] = useState<any[]>([]);
  const [showValveDropdown, setShowValveDropdown] = useState(false);
  const specSectionRef = useRef<HTMLDivElement>(null);
  const tagNoRef = useRef<HTMLInputElement>(null);

  // 현재 사용자 정보 가져오기
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const [bodyMatList, setBodyMatList] = useState<any[]>([]);
  const [trimMatList, setTrimMatList] = useState<any[]>([]);
  const [trimOptionList, setTrimOptionList] = useState<any[]>([]);
  const [actSizeList, setActSizeList] = useState<any[]>([]);
  const [actHWList, setActHWList] = useState<any[]>([]);
  const [bodyRatingList, setBodyRatingList] = useState<any[]>([]);

  const nameToCodeCache = useRef(new Map());
  const codeToNameCache = useRef(new Map());

  const [trimPortSizeList, setTrimPortSizeList] = useState<TrimPortSizeListDto[]>([]);

  // EstimateDetailPage와 동일한 정렬 및 Unit 목록 생성 로직 추가
  const customSort = (a: string, b: string) => {
    const isNumberA = !isNaN(parseFloat(a));
    const isNumberB = !isNaN(parseFloat(b));

    if (isNumberA && !isNumberB) return -1;
    if (!isNumberA && isNumberB) return 1;

    if (a.toUpperCase() === 'SPECIAL' && b.toUpperCase() !== 'SPECIAL') return 1;
    if (a.toUpperCase() !== 'SPECIAL' && b.toUpperCase() === 'SPECIAL') return -1;

    return a.localeCompare(b, undefined, { numeric: true });
  };

  const uniqueRatingUnits = useMemo(() => {
    if (!bodyRatingList || bodyRatingList.length === 0) {
      return [];
    }
    const unitMap = new Map<string, string>();
    bodyRatingList.forEach(item => {
      if (item.ratingUnitCode && !unitMap.has(item.ratingUnitCode)) {
        unitMap.set(item.ratingUnitCode, item.ratingUnit);
      }
    });
    // { code, name } 형태의 객체 배열로 변환
    const units = Array.from(unitMap, ([code, name]) => ({ code, name }));
    return units.sort((a, b) => customSort(a.name, b.name));
  }, [bodyRatingList]);

  const filteredRatingList = useMemo(() => {
    if (!currentValve || !currentValve.body.ratingUnit) { // ratingUnit은 이제 코드입니다.
      return [];
    }
    return bodyRatingList.filter(item => item.ratingUnitCode === currentValve.body.ratingUnit);
  }, [currentValve, bodyRatingList]);



  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    
    // 선택된 고객 정보 가져오기
    const customerStr = localStorage.getItem('selectedCustomer');
    if (customerStr) {
      setSelectedCustomer(JSON.parse(customerStr));
    }

    // readonly 쿼리 파라미터 확인
    const readonlyParam = searchParams.get('readonly');
    console.log('NewEstimateRequestPage - readonlyParam:', readonlyParam);
    console.log('NewEstimateRequestPage - searchParams:', Object.fromEntries(searchParams.entries()));
    
    if (readonlyParam === 'true') {
      setIsReadOnly(true);
      console.log('NewEstimateRequestPage - isReadOnly set to true');
    } else {
      setIsReadOnly(false);
      console.log('NewEstimateRequestPage - isReadOnly set to false');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchBodyValveList(); // 컴포넌트 마운트 시 밸브 목록 로드
    fetchBodyRatingList();
  }, []); // 빈 배열: 한 번만 실행

  // 매니저 또는 작성자인지 확인
  const isManager = currentUser?.roleId === 2;
  const isWriter = currentUser?.roleId === 3;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 드래그해야 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // BodyValveList 가져오기 (함수 정의는 그대로 유지)
  const fetchBodyValveList = async () => {
    try {
      const response = await axios.get('/api/estimate/body-valve-list');
      setBodyValveList(response.data);
    } catch (error) {
      console.error('Error fetching body valve list:', error);
    }
  };

  // BodyRatingList 가져오기
  const fetchBodyRatingList = async () => {
    try {
      const response = await axios.get('/api/estimate/body-rating-list');
      setBodyRatingList(response.data);
    } catch (error) {
      console.error('Error fetching body rating list:', error);
    }
  };

  // 기존 데이터 불러오기 useEffect (의존성 수정)
  useEffect(() => {
    if (bodyRatingList.length > 0) { // bodyValveList -> bodyRatingList
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
      
      const customerStr = localStorage.getItem('selectedCustomer');
      if (customerStr) {
        setSelectedCustomer(JSON.parse(customerStr));
      }

      const loadParam = searchParams.get('load');
      if (loadParam && !isDataLoaded.current) {
        loadExistingData(loadParam); // 두 번째 인자 제거
        isDataLoaded.current = true;
      }
    }
  }, [searchParams, bodyRatingList]); // 의존성 배열을 bodyRatingList로 변경

  // Type 드래그앤드롭 핸들러
  const handleTypeDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTypes((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // order 업데이트
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1
        }));
      });
      
      // Type 순서가 바뀌면 전체 Valve의 SheetNo 재계산
      setTimeout(() => {
        updateAllSheetNumbers();
      }, 0);
    }
  }, []);

  // Type 추가/삭제 기능
  const handleAddType = useCallback(() => {
    setShowValveDropdown(true);
  }, []);

  // Type 삭제 기능
  const handleRemoveType = useCallback((index: number) => {
    setTypes(prevTypes => {
      const newTypes = prevTypes.filter((_, i) => i !== index);
      // order 재정렬
      return newTypes.map((type, i) => ({
        ...type,
        order: i + 1
      }));
    });
  }, []);

  // Type 변경 핸들러
  const handleTypeChange = useCallback((index: number, field: keyof TypeData, value: any) => {
    setTypes(prevTypes => {
      const newTypes = [...prevTypes];
      newTypes[index] = {
        ...newTypes[index],
        [field]: value
      };
      return newTypes;
    });
  }, []);

  const handleValveSelect = useCallback((valve: BodyValveData) => {
    // 중복 체크
    const isDuplicate = types.some(type => type.name === valve.valveSeries);
    if (isDuplicate) {
      alert('이미 추가된 Type입니다.');
      return;
    }

    const timestamp = Date.now();
    const newType: TypeData = {
      id: `type-${timestamp}`,
      name: valve.valveSeries,
      code: valve.valveSeriesCode, // ValveSeriesCode 저장
      count: 0,
      order: types.length + 1,
      typeId: `type-${timestamp}` // 추가
    };
    console.log('--- Debugging handleValveSelect ---');
    console.log('Selected Valve (BodyValveData):', valve);
    console.log('New Type (TypeData):', newType);
    console.log('-----------------------------------');

    console.log('새로운 타입 추가:', newType); // 디버깅용
    setTypes(prev => {
      const newTypes = [...prev, newType];
      console.log('업데이트된 types:', newTypes); // 디버깅용
      return newTypes;
    });
    
    // 새로 추가된 타입을 자동으로 선택
    setSelectedType(newType.id);
    console.log('selectedType 설정:', newType.id); // 디버깅용
    
    setShowValveDropdown(false);
  }, [types]);

  // Valve 드래그앤드롭 핸들러
  const handleValveDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const activeValve = valves.find(v => v.id === active.id);
      if (!activeValve) return;
      
      // 같은 Type 내에서만 드래그 허용
      setValves((items) => {
        const sameTypeItems = items.filter(item => item.typeId === activeValve.typeId);
        const otherTypeItems = items.filter(item => item.typeId !== activeValve.typeId);
        
        const oldIndex = sameTypeItems.findIndex((item) => item.id === active.id);
        const newIndex = sameTypeItems.findIndex((item) => item.id === over?.id);

        const reorderedSameType = arrayMove(sameTypeItems, oldIndex, newIndex);
        
        // 같은 Type 내에서 order 재정렬 (1부터 시작)
        const updatedSameType = reorderedSameType.map((item, index) => ({
          ...item,
          order: index + 1
        }));
        
        // 전체 배열 재구성
        return [...otherTypeItems, ...updatedSameType].sort((a, b) => {
          // Type 순서대로, 그 다음 order 순서대로 정렬
          const typeOrderA = types.find(t => t.id === a.typeId)?.order || 0;
          const typeOrderB = types.find(t => t.id === b.typeId)?.order || 0;
          
          if (typeOrderA !== typeOrderB) {
            return typeOrderA - typeOrderB;
          }
          return a.order - b.order;
        });
      });
    }
  }, [valves, types]);

  // 전체 SheetNo 재계산 함수
  const updateAllSheetNumbers = useCallback(() => {
    setValves((currentValves) => {
      let globalSheetNo = 1;
      
      return currentValves
        .sort((a, b) => {
          // Type 순서대로, 그 다음 order 순서대로 정렬
          const typeOrderA = types.find(t => t.id === a.typeId)?.order || 0;
          const typeOrderB = types.find(t => t.id === b.typeId)?.order || 0;
          
          if (typeOrderA !== typeOrderB) {
            return typeOrderA - typeOrderB;
          }
          return a.order - b.order;
        })
        .map((valve) => ({
          ...valve,
          // 전역 SheetNo 할당 (Type 순서 → TagNo 순서)
        }));
    });
  }, [types]);

  // Valve 추가/삭제 기능
  const handleAddValve = useCallback(() => {
    if (!selectedType) {
      alert('먼저 Step 1에서 Type을 선택해주세요.');
      return;
    }

    const selectedTypeData = types.find(t => t.id === selectedType);
    if (!selectedTypeData) return;

    // 같은 Type의 TagNo 개수 확인
    const sameTypeValves = valves.filter(v => v.typeId === selectedType);
    const nextOrder = sameTypeValves.length + 1; // 1부터 시작
    
    // 새로운 고유 SheetID 생성 (한 번 할당되면 변하지 않음)
    const newSheetID = Math.max(...valves.map(v => v.sheetID), 0) + 1;
    
    const newValve: ValveData = {
      id: `valve-${Date.now()}`,
      tagNo: `Tag-${String(getNextTagNo()).padStart(4, '0')}`, // 기본값이지만 사용자가 수정 가능
      qty: 0,
      order: nextOrder,
      sheetID: newSheetID, // 고유 ID, 절대 변하지 않음
      typeId: selectedType,
      fluid: {
      medium: '',
        fluid: '',
        density: '',
        molecular: '',
        t1: { max: 0, normal: 0, min: 0 },
        p1: { max: 0, normal: 0, min: 0 },
        p2: { max: 0, normal: 0, min: 0 },
        dp: { max: 0, normal: 0, min: 0 },
        qm: { max: 0, normal: 0, min: 0, unit: 'm³/h' },
        qn: { max: 0, normal: 0, min: 0, unit: 'm³/h' },
        pressureUnit: 'Mpa(g)',
        temperatureUnit: '°C'
      },
      body: {
        type: selectedTypeData.name,
        typeCode: selectedTypeData.code, // Step 1에서 저장한 ValveSeriesCode 사용
        size: '',
        sizeUnit: '',
        materialBody: '',
        materialTrim: '',
        option: '',
        rating: '',
        ratingUnit: ''
      },
      actuator: {
        type: '',
        hw: ''
      },
      accessory: {
        positioner: { exists: false, type: '', maker: '', model: '' },
        explosionProof: '',
        transmitter: { exists: false, type: '' },
        solenoidValve: { exists: false, type: '', maker: '', model: '' },
        limitSwitch: { exists: false, type: '', maker: '', model: '' },
        airSet: { exists: false, type: '', maker: '', model: '' },
        volumeBooster: { exists: false, type: '', maker: '', model: '' },
        airOperatedValve: { exists: false, type: '', maker: '', model: '' },
        lockupValve: { exists: false, type: '', maker: '', model: '' },
        snapActingRelay: { exists: false, type: '', maker: '', model: '' }
      },
      // 라디오 버튼 상태들
      isQM: false,
      isP2: false,
      isN1: false,
      isDensity: false,
      isHW: false
    };

    setValves(prev => [...prev, newValve]);
  }, [selectedType, types, valves.length]);

  // TagNo 생성을 위한 유틸리티 함수
  const getNextTagNo = useCallback(() => {
    return valves.length + 1;
  }, [valves]);

  // 프론트엔드에서 정의할 드롭다운 배열들
  const fluidOptions = ['Liquid', 'Vaporous', 'Gaseous'];
  const actuatorTypeOptions = ['Pneumatic', 'Electric', 'Hydraulic', 'No'];
  const positionerTypeOptions = ['P.P', 'E.P', 'Smart'];
  const explosionProofOptions = ['내압방폭', '본질안전방폭', '수소방폭'];
  const transmitterTypeOptions = ['Pressure', 'Temperature', 'Flow', 'No'];
  const hwOptions = ['Yes', 'No'];

  // 라디오 버튼 옵션들
  const flowTypeOptions = ['Qm', 'Qn'];
  const pressureOptions = ['P1', 'P2'];
  const temperatureOptions = ['T1', 'N1'];
  const densityOptions = ['Density', 'Molecular'];

  // DB에서 가져올 마스터 데이터 상태
  const [bodySizeList, setBodySizeList] = useState<BodySizeListDto[]>([]);
 



  // Size 값으로부터 Unit을 유추하는 함수
  const getSizeUnitFromSize = (size: string): string => {
    if (!size) return '';
    
    // inch 단위 (1/2", 1", 2" 등)
    if (size.includes('"') || size.includes('″')) {
      return 'I';
    }
    
    // DN 단위 (15A, 20A, 25A 등) - 하지만 현재는 F, G, H 등으로 저장됨
    if (size === 'F') return 'A';  // F는 20A에 해당
    if (size === 'G') return 'A';  // G는 25A에 해당
    if (size === 'H') return 'A';  // H는 32A에 해당
    if (size === 'I') return 'A';  // I는 40A에 해당
    if (size === 'J') return 'A';  // J는 50A에 해당
    if (size === 'K') return 'A';  // K는 65A에 해당
    if (size === 'L') return 'A';  // L는 80A에 해당
    if (size === 'M') return 'A';  // M는 100A에 해당
    if (size === 'N') return 'A';  // N는 125A에 해당
    if (size === 'O') return 'A';  // O는 150A에 해당
    if (size === 'P') return 'A';  // P는 200A에 해당
    if (size === 'Q') return 'A';  // Q는 250A에 해당
    if (size === 'R') return 'A';  // R는 300A에 해당
    if (size === 'S') return 'A';  // S는 350A에 해당
    if (size === 'T') return 'A';  // T는 400A에 해당
    if (size === 'U') return 'A';  // U는 450A에 해당
    if (size === 'V') return 'A';  // V는 500A에 해당
    if (size === 'W') return 'A';  // W는 550A에 해당
    if (size === 'X') return 'A';  // X는 600A에 해당
    if (size === 'Y') return 'A';  // Y는 900A에 해당
    
    // None
    if (size === 'None') {
      return 'N';
    }
    
    // SPECIAL
    if (size === 'SPECIAL') {
      return 'Z';
    }
    
    return '';
  };

  // 이름을 코드로 변환하는 함수들
  const getNameToCode = (list: any[], name: string, nameField: string, codeField: string): string => {
    const item = list.find(item => item[nameField] === name);
    return item ? item[codeField] : '';
  };

  const getBodySizeCode = (size: string, unit: string): string => {
    // UI에서 이미 코드를 선택하므로 그대로 반환
    return size;
  };

  const getBodyMatCode = (name: string): string => {
    // UI에서 이미 코드를 선택하므로 그대로 반환
    return name;
  };

  const getTrimMatCode = (name: string): string => {
    // UI에서 이미 코드를 선택하므로 그대로 반환
    return name;
  };

  const getTrimOptionCode = (name: string): string => {
    // UI에서 이미 코드를 선택하므로 그대로 반환
    return name;
  };

  const getBodyRatingCode = (name: string): string => {
    const item = bodyRatingList.find(item => item.ratingName === name);
    return item ? item.ratingCode : '';
  };

  const getBodyRatingName = (code: string): string => {
    const item = bodyRatingList.find(item => item.ratingCode === code);
    return item ? item.ratingName : '';
  };
  const getBodyRatingUnitNameByCode = (unitCode: string): string => {
    const item = bodyRatingList.find(item => item.ratingUnitCode === unitCode);
    return item ? item.ratingUnit : ''; // unitCode가 아닌 unit(이름)을 반환
  };

  const getBodyRatingUnit = (code: string): string => {
    // ratingCode가 아닌 ratingUnitCode로 찾아야 합니다.
    const item = bodyRatingList.find(item => item.ratingUnitCode === code);
    // ratingUnitCode가 아닌 ratingUnit(이름)을 반환해야 합니다.
    return item ? item.ratingUnit : '';
  };

  const getBodyRatingUnitCode = (ratingCode: string): string => {
    const item = bodyRatingList.find(item => item.ratingCode === ratingCode);
    return item ? item.ratingUnitCode : '';
  };

  const getBodySizeName = (code: string, unitCode: string): string => {
    const item = bodySizeList.find(item => item.bodySizeCode === code && item.sizeUnitCode === unitCode);
    return item ? item.bodySize : '';
  };
  
  
  
  const getBodyRatingUnitByCode = (unitCode: string): string => {
    // bodyRatingList에서 unitCode에 해당하는 unit 이름을 찾습니다.
    const item = bodyRatingList.find(item => item.ratingUnitCode === unitCode);
    return item ? item.ratingUnit : ''; 
  };

  // 첨부파일 관련 상태
  const [fileAttachments, setFileAttachments] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // 임시 저장할 파일들
  
  // 첨부파일을 attachments 상태와 동기화 (임시 선택 파일도 표시)
  useEffect(() => {
    console.log('🔄 fileAttachments 변경됨:', fileAttachments);
    
    const attachmentFiles = fileAttachments.map(att => ({
        name: att.name,
        size: att.size,
      path: att.filePath || att.path || '',
      id: att.attachmentId || att.id || att.uniqueId,
      isPending: !!att.isPending,
      }));
    
    console.log('💾 attachments로 변환됨:', attachmentFiles);
    
    setAttachments(prev => {
      const prevString = JSON.stringify(prev);
      const newString = JSON.stringify(attachmentFiles);
      if (prevString === newString) {
        console.log('🔄 attachments 상태 동일, 업데이트 생략');
        return prev;
      }
      console.log('🔄 attachments 상태 변경됨 - fileAttachments에서 동기화');
      return attachmentFiles;
    });
  }, [fileAttachments]);

  // attachments 상태 변경 시 로깅 (무한 루프 방지)
  useEffect(() => {
    console.log('📋 attachments 상태 변경됨:', attachments);
  }, [attachments]);

  // attachments 상태 변경 시 로깅
  useEffect(() => {
    console.log('📋 attachments 상태 변경됨:', attachments);
  }, [attachments]);

  // pendingFiles 상태 변화 추적
  useEffect(() => {
    console.log('🔄 pendingFiles 상태 변경됨:', pendingFiles);
    console.log('🔄 pendingFiles 개수:', pendingFiles.length);
    console.log('🔄 pendingFiles 파일명들:', pendingFiles.map(f => f.name));
  }, [pendingFiles]);

  const handleDeleteValve = useCallback((valveId: string) => {
    setValves(prev => prev.filter(valve => valve.id !== valveId));
    if (currentValve?.id === valveId) {
      setCurrentValve(null);
    }
  }, [currentValve]);

    // 첨부파일 업로드 함수 (즉시 백엔드 업로드)
  const handleFileUpload = useCallback(async (files: FileList) => {
    console.log('🚀 handleFileUpload 호출됨!');
    console.log('📁 업로드할 파일들:', files);
    console.log('🔑 현재 tempEstimateNo:', tempEstimateNo);
    
    setUploadingFiles(true);
    const newFiles: File[] = [];

    try {
      console.log('파일 업로드 시작:', files.length, '개 파일');
      
      // 현재 사용자 ID 가져오기 (함수 시작 시점에)
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const uploadUserID = currentUser?.userId || 'admin';
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('파일 정보:', file.name, '크기:', file.size, '타입:', file.type);
        newFiles.push(file);
      }

      // 새로 선택된 파일들을 pendingFiles에 저장 (견적요청 시점에 업로드)
      for (const file of newFiles) {
        try {
          console.log('새 파일을 pendingFiles에 저장:', file.name);
          
          // 🔑 중복 체크: 이미 fileAttachments에 있는 파일인지 확인
          const isDuplicate = fileAttachments.some(att => att.name === file.name);
          if (isDuplicate) {
            console.log('⚠️ 중복 파일 감지, pendingFiles에 추가하지 않음:', file.name);
            continue;
          }
          
          // 🔑 추가 중복 체크: pendingFiles에도 이미 있는지 확인
          const isPendingDuplicate = pendingFiles.some(pendingFile => pendingFile.name === file.name);
          if (isPendingDuplicate) {
            console.log('⚠️ pendingFiles 중복 감지, 추가하지 않음:', file.name);
            continue;
          }
          
          // 🔑 파일 크기와 이름으로 더 정확한 중복 체크
          const isExactDuplicate = pendingFiles.some(pendingFile => 
            pendingFile.name === file.name && pendingFile.size === file.size
          );
          if (isExactDuplicate) {
            console.log('⚠️ 정확한 중복 파일 감지, 추가하지 않음:', file.name, file.size);
            continue;
          }
          
          const newAttachment = {
            name: file.name,
            size: file.size,
            uniqueId: Date.now() + Math.random(),
            isPending: true
          };
          
          setFileAttachments(prev => [...prev, newAttachment]);
          setPendingFiles(prev => [...prev, file]); // 🔑 새 파일만 pendingFiles에 추가
          console.log('✅ 새 파일이 pendingFiles에 추가됨:', file.name);
          continue;
          
          // uploadUserID는 이미 위에서 선언됨
          
          console.log('파일 업로드 시도:', {
            fileName: file.name,
            tempEstimateNo,
            uploadUserID,
            fileType: 'customer'
          });
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('tempEstimateNo', tempEstimateNo);
          formData.append('fileType', 'customer');
          
          const response = await fetch(`/api/estimate/sheets/${tempEstimateNo}/attachments?uploadUserID=${uploadUserID}&fileType=customer`, {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const uploadedFile = await response.json();
            console.log('✅ 파일 업로드 성공:', uploadedFile);
            
            // 업로드된 파일 정보를 fileAttachments에 추가
            const newAttachment = {
              name: file.name,
              size: file.size,
              uniqueId: Date.now() + Math.random(),
              isPending: false,
              attachmentId: uploadedFile.attachmentID,
              filePath: uploadedFile.filePath
            };
            
            console.log('📎 새로운 첨부파일 객체 생성:', newAttachment);
            setFileAttachments(prev => {
              const updated = [...prev, newAttachment];
              console.log('🔄 fileAttachments 상태 업데이트:', updated);
              console.log('🔍 isPending=false인 파일들:', updated.filter(att => !att.isPending));
              return updated;
            });
            
            // 즉시 attachments 상태에도 추가
            setAttachments(prev => {
              const newAttachmentForAttachments = {
                name: file.name,
                size: file.size,
                path: uploadedFile.filePath,
                id: uploadedFile.attachmentID
              };
              const updated = [...prev, newAttachmentForAttachments];
              console.log('📎 attachments 상태 즉시 업데이트:', updated);
              return updated;
            });
          } else {
            console.error('❌ 파일 업로드 실패:', response.status);
            const errorText = await response.text();
            console.error('❌ 오류 내용:', errorText);
            
            // 실패한 파일은 임시로만 표시
            const newAttachment = {
              name: file.name,
              size: file.size,
              uniqueId: Date.now() + Math.random(),
              isPending: true
            };
            setFileAttachments(prev => [...prev, newAttachment]);
          }
        } catch (error) {
          console.error('파일 업로드 중 오류:', error);
          // 오류 발생 시 임시로만 표시
          const newAttachment = {
            name: file.name,
            size: file.size,
            uniqueId: Date.now() + Math.random(),
            isPending: true
          };
          setFileAttachments(prev => [...prev, newAttachment]);
        }
      }
    } catch (error: any) {
      console.error('파일 임시 저장 실패:', error);
      alert('파일 임시 저장에 실패했습니다.');
    } finally {
      setUploadingFiles(false);
    }
  }, []);

  // 첨부파일 삭제 함수 (즉시 백엔드 API 호출)
  const handleDeleteAttachment = useCallback(async (fileId: string | number, filePath?: string) => {
    try {
      console.log('🗑️ 삭제 시도 - fileId:', fileId, 'filePath:', filePath);
      console.log('🔍 현재 fileAttachments:', fileAttachments);
      
      // 첨부파일 찾기 (id, uniqueId, attachmentId 모두 확인)
      const attachment = fileAttachments.find(att => 
        att.id === fileId || att.uniqueId === fileId || att.attachmentId === fileId
      );
      
      if (!attachment) {
        console.error('❌ 삭제할 첨부파일을 찾을 수 없습니다:', fileId);
        console.log('🔍 fileAttachments에서 찾을 수 있는 ID들:', fileAttachments.map(att => ({ id: att.id, uniqueId: att.uniqueId, attachmentId: att.attachmentId })));
        return;
      }
      
      console.log('✅ 찾은 첨부파일:', attachment);
      
      if (attachment.isPending) {
        // 임시 파일인 경우 pendingFiles에서만 제거 (백엔드 호출 불필요)
        setPendingFiles(prev => prev.filter(file => file.name !== attachment.name));
        console.log('✅ 임시 파일 삭제됨:', attachment.name);
      } else if (attachment.attachmentId) {
        // 업로드된 파일인 경우 즉시 백엔드에서 삭제
        try {
          console.log('🗑️ 백엔드 삭제 API 즉시 호출:', attachment.attachmentId, attachment.name);
          console.log('🌐 삭제 API URL:', `/api/estimate/attachments/${attachment.attachmentId}`);
          
          const response = await axios.delete(`/api/estimate/attachments/${attachment.attachmentId}`);
          console.log('✅ 백엔드에서 파일 삭제 성공:', attachment.name, '응답:', response);
          
          // 백엔드 삭제 성공 시에만 로컬 상태에서 제거
          setFileAttachments(prev => {
            const filtered = prev.filter(att => 
              att.id !== fileId && att.uniqueId !== fileId && att.attachmentId !== fileId
            );
            console.log('🗑️ fileAttachments 상태에서 삭제됨:', attachment.name, '남은 파일:', filtered.length);
            return filtered;
          });
          
          setAttachments(prev => {
            const filtered = prev.filter(att => 
              att.id !== fileId && att.uniqueId !== fileId && att.attachmentId !== fileId
            );
            console.log('🗑️ attachments 상태에서 삭제됨:', attachment.name, '남은 파일:', filtered.length);
            return filtered;
          });
          
          console.log('✅ 첨부파일 삭제 완료 (백엔드 + 프론트엔드):', attachment.name);
          
        } catch (serverError: any) {
          console.error('❌ 백엔드 삭제 실패:', serverError);
          console.error('❌ 서버 오류 상세:', serverError.response?.data);
          console.error('❌ 서버 상태 코드:', serverError.response?.status);
          
          // 백엔드 삭제 실패 시 사용자에게 알림
          alert(`파일 삭제에 실패했습니다: ${attachment.name}`);
          return; // 로컬 상태 변경하지 않음
        }
      } else {
        console.log('⚠️ attachmentId가 없어서 백엔드 삭제 불가:', attachment);
        alert('파일 정보가 올바르지 않아 삭제할 수 없습니다.');
        return;
      }
      
    } catch (error) {
      console.error('파일 삭제 중 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  }, [fileAttachments]);

  // 🔑 관리 첨부파일 로드 함수
  const loadManagerAttachments = useCallback(async () => {
    if (!tempEstimateNo) return;
    try {
      console.log('🔄 loadManagerAttachments 시작 - tempEstimateNo:', tempEstimateNo);
      const response = await fetch(`http://192.168.0.59:5135/api/estimate/sheets/${tempEstimateNo}/attachments`);
      console.log('📡 API 응답 상태:', response.status, response.ok);
      
      if (response.ok) {
        const attachments = await response.json();
        // ResultFiles/customer만 남김 (경로/managerFileType 모두 고려)
        const customerResultFiles = (attachments || []).filter((att: any) => {
          const p = att.path || att.filePath;
          const type = (att.managerFileType || att.ManagerFileType || '').toString().toLowerCase();
          return isResultCustomerFile(p) || type === 'customer';
        });
        setManagerAttachments(customerResultFiles);
        console.log('✅ 관리 첨부파일(고객용) 로드 완료:', customerResultFiles.length, '개');
      } else {
        console.error('❌ API 응답 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('관리 첨부파일 로드 오류:', error);
    }
  }, [tempEstimateNo]);

  // 첨부파일 다운로드 함수
  const handleDownloadAttachment = useCallback(async (attachmentId: number, fileName: string) => {
    try {
      const response = await axios.get(`/api/estimate/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  }, []);

  // 🔑 관리 첨부파일 다운로드 함수 (고객용 - PDF만)
  const handleDownloadManagerFile = useCallback(async (file: any) => {
    try {
      if (!file.fileName.toLowerCase().endsWith('.pdf')) {
        alert('PDF 파일만 다운로드할 수 있습니다.');
        return;
      }
      const response = await fetch(`http://192.168.0.59:5135/api/estimate/attachments/${file.attachmentID}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('파일 다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  }, []);

  // ValveSeriesCode로 실제 이름 찾기
  const getValveSeriesName = (code: string): string => {
    // bodyValveList에서 찾기 (로드된 경우)
    if (bodyValveList.length > 0) {
      const valve = bodyValveList.find(v => v.valveSeriesCode === code);
      if (valve) {
        return valve.valveSeries;
      }
    }
    
    // 임시 하드코딩 매핑 (bodyValveList가 아직 로드되지 않은 경우)
    const hardcodedMapping: { [key: string]: string } = {
      'G': '2-Way Ball',
      'A': '2-way Globe',
      'B': '3-way Globe', 
      'C': 'Angle',
      'N': '3-Way Ball'
    };
    
    return hardcodedMapping[code] || code;
  };

  // 기존 데이터 불러오기 함수
  const loadExistingData = async (loadTempEstimateNo: string) => {
    try {
      const ratingList = bodyRatingList; // state 직접 사용
      
      // loadExistingData 내부에서 사용할 로컬 함수들 정의
      const getBodyRatingNameLocal = (code: string): string => {
        const item = ratingList.find(item => item.ratingCode === code);
        return item ? item.ratingName : '';
      };
      
      const getBodyRatingUnitLocal = (code: string): string => {
        const item = ratingList.find(item => item.ratingUnitCode === code);
        return item ? item.ratingUnit : '';
      };
      
      // 기존 견적 데이터 조회
      const response = await axios.get(`http://192.168.0.59:5135/api/estimate/sheets/${loadTempEstimateNo}`);
      const existingData = response.data;
      
      // 기본 정보 설정
      setTempEstimateNo(loadTempEstimateNo);
      setProjectName(existingData.project || '');
      // 상태 텍스트/코드 저장 (최상위 또는 estimateSheet 내부 모두 대응)
      const statusTextServer = existingData?.statusText ?? existingData?.estimateSheet?.statusText ?? '';
      const statusCodeServer = existingData?.status ?? existingData?.estimateSheet?.status;
      if (statusTextServer) setBackendStatusText(statusTextServer);
      if (typeof statusCodeServer === 'number') {
        setBackendStatus(statusCodeServer);
      } else if (statusTextServer) {
        const map: Record<string, number> = {
          '임시저장': 1,
          '견적요청': 2,
          '견적처리중': 3,
          '견적완료': 4,
          '주문': 5,
        };
        const code = map[statusTextServer.trim()];
        if (code) setBackendStatus(code);
      }
      setCustomerRequirement(existingData.customerRequirement || '');
      
              // EstimateRequest 데이터가 있으면 복원
        console.log('🔍 loadExistingData - existingData 확인:', existingData);
        console.log('🔍 estimateRequests 존재 여부:', !!existingData.estimateRequests);
        console.log('🔍 estimateRequests 길이:', existingData.estimateRequests?.length);
        
        if (existingData.estimateRequests && existingData.estimateRequests.length > 0) {
        
        // EstimateRequest 데이터를 types와 valves로 변환
        const loadedTypes: TypeData[] = [];
        const loadedValves: ValveData[] = [];
        
        // 백엔드 응답 구조 확인 (새로운 구조 vs 이전 구조)
        const isNewStructure = existingData.estimateRequests.length > 0 && existingData.estimateRequests[0].tagNos;
        
        // 디버깅 로그 추가
        console.log('🔍 구조 확인:');
        console.log('estimateRequests[0]:', existingData.estimateRequests[0]);
        console.log('estimateRequests[0].tagNos:', existingData.estimateRequests[0]?.tagNos);
        console.log('isNewStructure:', isNewStructure);
        
        if (isNewStructure) {
          // 새로운 구조: { valveType, tagNos[] }
          // 밸브 타입별로 SheetNo 순서 계산 (수정된 버전)
          const valveTypeOrder = new Map<string, number>();
          
          existingData.estimateRequests.forEach((req: any) => {
            if (req.tagNos && req.tagNos.length > 0) {
              // 각 밸브 타입의 모든 TagNo의 SheetNo를 확인하여 가장 작은 값 사용
              const sheetNos = req.tagNos.map((tagNo: any) => tagNo.sheetNo).filter(Boolean);
              if (sheetNos.length > 0) {
                const minSheetNo = Math.min(...sheetNos);
                valveTypeOrder.set(req.valveType, minSheetNo);
              }
            }
          });
          
          // 밸브 타입을 SheetNo 순서대로 정렬
          const sortedValveTypes = Array.from(valveTypeOrder.entries())
            .sort(([, a], [, b]) => a - b);
          
          // 디버깅 로그 추가
          console.log('🔍 밸브 타입 정렬 정보:');
          console.log('valveTypeOrder:', valveTypeOrder);
          console.log('sortedValveTypes:', sortedValveTypes);
          
          // 정렬된 순서대로 Type 데이터 생성
          sortedValveTypes.forEach(([valveType, sheetNo], index) => {
            const valveSeriesName = getValveSeriesName(valveType);
            const typeData: TypeData = {
              id: `type-${index}`,
              name: valveSeriesName,
              code: valveType,
              count: existingData.estimateRequests.filter((req: any) => req.valveType === valveType).length,
              order: sheetNo,  // SheetNo 기준 순서
              typeId: `type-${index}`
            };
            loadedTypes.push(typeData);
          });
          
          // TagNo 데이터를 Valve 데이터로 변환
          existingData.estimateRequests.forEach((req: any) => {
            if (req.tagNos && req.tagNos.length > 0) {
              req.tagNos.forEach((tagNo: any, tagIndex: number) => {
                const valveData: ValveData = {
                  id: `valve-${req.valveType}-${tagIndex}`,
                  tagNo: tagNo.tagNo || '',
                  qty: tagNo.qty || 1,
                  order: tagNo.sheetNo || tagIndex + 1, // SheetNo 사용, 없으면 tagIndex + 1
                  sheetID: tagNo.sheetID || 0,
                fluid: {
                  medium: tagNo.medium || '',
                  fluid: tagNo.fluid || '',
                  density: tagNo.density?.toString() || '',
                  molecular: tagNo.molecularWeight?.toString() || '',
                  t1: { 
                    max: tagNo.inletTemperatureQ || 0, 
                    normal: tagNo.inletTemperatureNorQ || 0, 
                    min: tagNo.inletTemperatureMinQ || 0
                  },
                  p1: { 
                    max: tagNo.inletPressureMaxQ || 0, 
                    normal: tagNo.inletPressureNorQ || 0, 
                    min: tagNo.inletPressureMinQ || 0
                  },
                  p2: { 
                    max: tagNo.outletPressureMaxQ || 0, 
                    normal: tagNo.outletPressureNorQ || 0, 
                    min: tagNo.outletPressureMinQ || 0
                  },
                  dp: { 
                    max: tagNo.differentialPressureMaxQ || 0, 
                    normal: tagNo.differentialPressureNorQ || 0, 
                    min: tagNo.differentialPressureMinQ || 0
                  },
                  qm: { 
                    max: tagNo.qmMax || 0, 
                    normal: tagNo.qmNor || 0, 
                    min: tagNo.qmMin || 0, 
                    unit: tagNo.qmUnit || 'm³/h' 
                  },
                  qn: { 
                    max: tagNo.qnMax || 0, 
                    normal: tagNo.qnNor || 0, 
                    min: tagNo.qnMin || 0, 
                    unit: tagNo.qnUnit || 'm³/h' 
                  },
                  pressureUnit: tagNo.pressureUnit || 'Mpa(g)',
                  temperatureUnit: tagNo.temperatureUnit || '℃'
                },
                body: {
                  type: getValveSeriesName(req.valveType || ''),
                  typeCode: req.valveType || '',
                  size: tagNo.bodySize,
                  sizeUnit: tagNo.bodySizeUnit,
                  materialBody: tagNo.bodyMat,
                  materialTrim: tagNo.trimMat,
                  option: tagNo.trimOption,
                  rating: tagNo.bodyRating,
                  ratingUnit: tagNo.bodyRatingUnit
                },
                actuator: {
                  type: tagNo.actType || 'None',
                  hw: tagNo.isHW ? 'Yes' : 'No'
                },
                accessory: {
                  positioner: { exists: tagNo.isPositioner || false, type: tagNo.positionerType || '', maker: '', model: '' },
                  explosionProof: tagNo.explosionProof || '',
                  transmitter: { exists: tagNo.transmitterType ? true : false, type: tagNo.transmitterType || '' },
                  solenoidValve: { exists: tagNo.isSolenoid || false, type: '', maker: '', model: '' },
                  limitSwitch: { exists: tagNo.isLimSwitch || false, type: '', maker: '', model: '' },
                  airSet: { exists: tagNo.isAirSet || false, type: '', maker: '', model: '' },
                  volumeBooster: { exists: tagNo.isVolumeBooster || false, type: '', maker: '', model: '' },
                  airOperatedValve: { exists: tagNo.isAirOperated || false, type: '', maker: '', model: '' },
                  lockupValve: { exists: tagNo.isLockUp || false, type: '', maker: '', model: '' },
                  snapActingRelay: { exists: tagNo.isSnapActingRelay || false, type: '', maker: '', model: '' }
                },
                isQM: tagNo.isQM || false,
                isP2: tagNo.isP2 || false,
                isN1: false,
                isDensity: tagNo.isDensity ?? false,
                isHW: tagNo.isHW || false,
                typeId: `type-${req.valveType}`
              };
                loadedValves.push(valveData);
              });
            }
          });
        } else {
          // 이전 구조: 개별 EstimateRequest 배열 (현재 API 응답)
          // ValveType별로 실제 그룹핑
          const groupedByValveType = existingData.estimateRequests.reduce((acc: any, req: any) => {
            const valveType = req.valveType || 'Unknown';
            if (!acc[valveType]) {
              acc[valveType] = [];
            }
            acc[valveType].push(req);
            return acc;
          }, {});
          
          console.log('그룹핑된 ValveType:', groupedByValveType);
          
          // 밸브 타입별로 SheetNo 순서 계산 (이전 구조용)
          const valveTypeOrder = new Map<string, number>();
          
          Object.entries(groupedByValveType).forEach(([valveType, requests]: [string, any]) => {
            // 각 밸브 타입의 모든 request의 SheetNo를 확인하여 가장 작은 값 사용
            const sheetNos = requests.map((req: any) => req.sheetNo).filter(Boolean);
            if (sheetNos.length > 0) {
              const minSheetNo = Math.min(...sheetNos);
              valveTypeOrder.set(valveType, minSheetNo);
            }
          });
          
          // 밸브 타입을 SheetNo 순서대로 정렬
          const sortedValveTypes = Array.from(valveTypeOrder.entries())
            .sort(([, a], [, b]) => a - b);
          
          // 디버깅 로그 추가
          console.log('🔍 이전 구조 - 밸브 타입 정렬 정보:');
          console.log('valveTypeOrder:', valveTypeOrder);
          console.log('sortedValveTypes:', sortedValveTypes);
          
          // 정렬된 순서대로 Type 데이터 생성
          sortedValveTypes.forEach(([valveType, sheetNo], index) => {
            const valveSeriesName = getValveSeriesName(valveType);
            const requests = groupedByValveType[valveType];
            
            // Type 데이터 생성
            const typeData: TypeData = {
              id: `type-${index}`,
              name: valveSeriesName,
              code: valveType,
              count: requests.length,
              order: sheetNo,  // SheetNo 기준 순서
              typeId: `type-${index}` // 추가
            };
            loadedTypes.push(typeData);
            
            // 각 request를 Valve 데이터로 변환
            requests.forEach((req: any, tagIndex: number) => {
              // 백엔드 응답 구조 디버깅
              console.log('🔍 백엔드 응답 구조 확인:');
              console.log('req.bodySizeUnit:', req.bodySizeUnit);
              console.log('req.bodySize:', req.bodySize);
              console.log('req 전체 구조:', req);
              
              // Size 데이터 복원 확인
              console.log('🔍 Size 데이터 복원:');
              console.log('복원된 sizeUnit:', req.bodySizeUnit || getSizeUnitFromSize(req.bodySize) || '');
              console.log('복원된 size:', req.bodySize || '');
              
              // loadExistingData 함수 내부에서
              const valveData: ValveData = {
                id: `valve-${valveType}-${tagIndex}`,
                tagNo: req.tagno || '',
                qty: req.qty || 1,
                order: req.sheetNo || tagIndex + 1, // SheetNo 사용, 없으면 tagIndex + 1
                sheetID: req.sheetID || 0,
                fluid: {
                  medium: req.medium || '',
                  fluid: req.fluid || '',
                  density: req.density?.toString() || '',
                  molecular: req.molecularWeight?.toString() || '',
                  t1: { 
                    max: req.inletTemperatureQ || 0, 
                    normal: req.inletTemperatureNorQ || 0, 
                    min: req.inletTemperatureMinQ || 0
                  },
                  p1: { 
                    max: req.inletPressureMaxQ || 0, 
                    normal: req.inletPressureNorQ || 0, 
                    min: req.inletPressureMinQ || 0
                  },
                  p2: { 
                    max: req.outletPressureMaxQ || 0, 
                    normal: req.outletPressureNorQ || 0, 
                    min: req.outletPressureMinQ || 0
                  },
                  dp: { 
                    max: req.differentialPressureMaxQ || 0, 
                    normal: req.differentialPressureNorQ || 0, 
                    min: req.differentialPressureMinQ || 0
                  },
                  qm: { 
                    max: req.qmMax || 0, 
                    normal: req.qmNor || 0, 
                    min: req.qmMin || 0, 
                    unit: req.qmUnit || 'm³/h' 
                  },
                  qn: { 
                    max: req.qnMax || 0, 
                    normal: req.qnNor || 0, 
                    min: req.qnMin || 0, 
                    unit: req.qnUnit || 'm³/h' 
                  },
                  pressureUnit: req.pressureUnit || 'Mpa(g)',
                  temperatureUnit: req.temperatureUnit || '℃'
                },
                body: {
                  type: valveSeriesName,
                  typeCode: valveType,
                  size: req.bodySize || '',  // 기존 저장된 Size 값 복원
                  sizeUnit: req.bodySizeUnit || getSizeUnitFromSize(req.bodySize) || '',  // 기존 저장된 Size Unit 복원 또는 Size 값으로부터 유추
                  materialBody: req.bodyMat || '',
                  materialTrim: req.trimMat || '',
                  option: req.trimOption || '',
                  rating: req.bodyRating || '',
                  ratingUnit: req.bodyRatingUnit || ''
                },
                actuator: {
                  type: req.actType || 'None',
                  hw: req.isHW ? 'Yes' : 'No'
                },
                accessory: {
                  positioner: { exists: req.isPositioner || false, type: req.positionerType || '', maker: '', model: '' },
                  explosionProof: req.explosionProof || '',
                  transmitter: { exists: req.transmitterType ? true : false, type: req.transmitterType || '' },
                  solenoidValve: { exists: req.isSolenoid || false, type: '', maker: '', model: '' },
                  limitSwitch: { exists: req.isLimSwitch || false, type: '', maker: '', model: '' },
                  airSet: { exists: req.isAirSet || false, type: '', maker: '', model: '' },
                  volumeBooster: { exists: req.isVolumeBooster || false, type: '', maker: '', model: '' },
                  airOperatedValve: { exists: req.isAirOperated || false, type: '', maker: '', model: '' },
                  lockupValve: { exists: req.isLockUp || false, type: '', maker: '', model: '' },
                  snapActingRelay: { exists: req.isSnapActingRelay || false, type: '', maker: '', model: '' }
                },
                isQM: req.isQM || false,
                isP2: req.isP2 || false,
                isN1: false,
                isDensity: req.isDensity ?? false,
                isHW: req.isHW || false,
                typeId: typeData.id
              };
              loadedValves.push(valveData);
            });
          });
        }
        // loadExistingData 함수 내부에서
        // loadedValves를 SheetNo 순서대로 정렬
        loadedValves.sort((a, b) => a.order - b.order);
        
        // 상태 업데이트
        setTypes(loadedTypes);

        console.log('setValves를 호출하기 직전입니다. loadedValves 데이터:', loadedValves);
        setValves(loadedValves);
        console.log('setValves가 호출되었습니다.');
        
        console.log('복원된 Types:', loadedTypes);
        console.log('복원된 Valves:', loadedValves);
        
        
        // 디버깅을 위한 상세 로그
                    loadedValves.forEach((valve, index) => {
              console.log(`Valve ${index} 상세 정보:`, {
                tagNo: valve.tagNo,
                actuator: valve.actuator,
                body: valve.body,
                isHW: valve.isHW
              });
            });
            

      }
      
      // 첨부파일 데이터 복원
      console.log('전체 응답 데이터:', existingData);
      console.log('attachments 필드:', existingData.attachments);
      console.log('attachments 타입:', typeof existingData.attachments);
      console.log('attachments 길이:', existingData.attachments?.length);
      
      if (existingData.attachments && existingData.attachments.length > 0) {
        console.log('첨부파일 데이터:', existingData.attachments);
        // CustomerRequest 폴더의 항목만 하단 첨부파일에 표시
        const loadedAttachments = existingData.attachments
          .filter((att: any) => isCustomerFile(att.filePath || att.path))
          .map((att: any) => ({
          id: att.attachmentID,           // 백엔드 API 응답: attachmentID
          name: att.fileName,             // 백엔드 API 응답: fileName
          size: att.fileSize || 0,        // 백엔드 API 응답: fileSize
          isPending: false,
          attachmentId: att.attachmentID, // 백엔드 API 응답: attachmentID
          filePath: att.filePath          // 백엔드 API 응답: filePath
        }));
        console.log('매핑된 첨부파일:', loadedAttachments);
        console.log('🔍 setFileAttachments 호출 전 fileAttachments 상태:', fileAttachments);
        setFileAttachments(loadedAttachments);
        console.log('🔍 setFileAttachments 호출 완료');
        
        // 🔑 기존 파일 로드 후 pendingFiles 완전 초기화 (중복 업로드 방지)
        setPendingFiles([]);
        console.log('✅ pendingFiles 완전 초기화됨 (기존 파일 중복 업로드 방지)');
      } else {
        console.log('첨부파일이 없습니다.');
        // 🔑 첨부파일이 없어도 pendingFiles 완전 초기화
        setPendingFiles([]);
        console.log('✅ pendingFiles 완전 초기화됨 (첨부파일 없음)');
      }
      
      // 🔑 추가 안전장치: fileAttachments도 완전 초기화
      console.log('🔍 loadExistingData 완료 후 pendingFiles 상태:', pendingFiles);
      
      // 🔑 관리 첨부파일 로드
      await loadManagerAttachments();
      
      alert('임시저장된 데이터를 불러왔습니다.');
      
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      alert('데이터를 불러오는데 실패했습니다.');
      // 실패 시 새로운 TempEstimateNo 생성
      generateTempEstimateNo();
    }
  };

  // 페이지 진입 시 데이터 가져오기
  useEffect(() => {
    const initializeData = async () => {
      // 마스터 데이터들을 먼저 모두 가져옵니다.
      await Promise.all([
        fetchMasterData(),
        fetchBodyValveList()
      ]);
      // isInitialized 상태를 true로 설정하여 마스터 데이터 로딩이 완료되었음을 표시합니다.
      setIsInitialized(true);
    };
    
    initializeData();
  }, []); // 이 useEffect는 컴포넌트 마운트 시 한 번만 실행됩니다.

  // 마스터 데이터 로딩이 완료된 후, 견적 데이터를 불러오는 useEffect
  useEffect(() => {
    // isInitialized가 false이면 (마스터 데이터 로딩 전이면) 아무것도 하지 않습니다.
    if (!isInitialized) {
      return;
    }

    const loadParam = searchParams.get('load');
    console.log('🔍 useEffect - loadParam 확인:', loadParam);
    console.log('🔍 useEffect - isDataLoaded.current:', isDataLoaded.current);
    
    if (loadParam) {
      console.log('🔍 loadExistingData 호출 시작:', loadParam);
      console.log('🔍 isDataLoaded.current 상태:', isDataLoaded.current);
      
      // isDataLoaded를 강제로 false로 설정하여 항상 로드되도록 함
      isDataLoaded.current = false;
      console.log('🔍 isDataLoaded.current를 false로 강제 설정');
      
      loadExistingData(loadParam);
      isDataLoaded.current = true;
    }
  }, [isInitialized, searchParams]); // isInitialized가 true로 바뀌면 이 useEffect가 실행됩니다.

  // 마스터 데이터 가져오기
  const fetchMasterData = async () => {
    try {
      // Rating 방식과 동일하게, size-unit-list API 호출을 제거합니다.
      const [sizeRes, matRes, trimMatRes, optionRes, ratingRes, portSizeRes] = await Promise.all([
        axios.get('/api/estimate/body-size-list'),
        axios.get('/api/estimate/body-mat-list'),
        axios.get('/api/estimate/trim-mat-list'),
        axios.get('/api/estimate/trim-option-list'),
        axios.get('/api/estimate/body-rating-list'),
        axios.get('/api/estimate/trim-port-size-list')
      ]);
      
      console.log('🔍 Size API 응답:', sizeRes.data);
      setBodySizeList(sizeRes.data);
      setBodyMatList(matRes.data);
      setTrimMatList(trimMatRes.data);
      setTrimOptionList(optionRes.data);
      setBodyRatingList(ratingRes.data);
      setTrimPortSizeList(portSizeRes.data);
      
      // bodyRatingList 데이터를 반환
      return ratingRes.data;
    } catch (error) {
      console.error('마스터 데이터 가져오기 실패:', error);
      return [];
    }
  };

  // TempEstimateNo 생성
  const generateTempEstimateNo = async () => {
    try {
      const response = await axios.post('http://192.168.0.59:5135/api/estimate/generate-temp-no', null, { params: { currentUserId: currentUser?.userId || 'admin' } });
      setTempEstimateNo(response.data.tempEstimateNo);
    } catch (error) {
      console.error('TempEstimateNo 생성 실패:', error);
    }
  };

  // [After] 아래 함수 전체를 복사해서 기존 함수와 교체해주세요.

  const createSavePayload = useCallback(() => {
      // 전역 SheetNo 계산
      let globalSheetNo = 1;
      const sortedValves = valves.sort((a, b) => {
        const typeOrderA = types.find(t => t.id === a.typeId)?.order || 0;
        const typeOrderB = types.find(t => t.id === b.typeId)?.order || 0;
        
        if (typeOrderA !== typeOrderB) {
          return typeOrderA - typeOrderB;
        }
        return a.order - b.order;
      });
      
    const allTagNos = sortedValves.map(valve => {
      const tagNoData: any = {
        SheetID: valve.sheetID > 0 ? valve.sheetID : undefined,
        SheetNo: globalSheetNo++,
                Tagno: valve.tagNo,
        ValveSeriesCode: valve.body.typeCode, // [수정] valveSeriesCode -> ValveSeriesCode (백엔드 모델 이름과 일치)
                Qty: valve.qty,
                Medium: valve.fluid.medium,
                Fluid: valve.fluid.fluid,
                IsQM: valve.isQM, 
                QMUnit: valve.fluid.qm.unit,
        QMMax: parseFloat(valve.fluid.qm.max.toString()) || 0,
        QMNor: parseFloat(valve.fluid.qm.normal.toString()) || 0,
        QMMin: parseFloat(valve.fluid.qm.min.toString()) || 0,
                QNUnit: valve.fluid.qn.unit,
        QNMax: parseFloat(valve.fluid.qn.max.toString()) || 0,
        QNNor: parseFloat(valve.fluid.qn.normal.toString()) || 0,
        QNMin: parseFloat(valve.fluid.qn.min.toString()) || 0,
                IsP2: valve.isP2,
                IsDensity: valve.isDensity,
                PressureUnit: valve.fluid.pressureUnit,
        InletPressureMaxQ: parseFloat(valve.fluid.p1.max.toString()) || 0,
        InletPressureNorQ: parseFloat(valve.fluid.p1.normal.toString()) || 0,
        InletPressureMinQ: parseFloat(valve.fluid.p1.min.toString()) || 0,
        OutletPressureMaxQ: parseFloat(valve.fluid.p2.max.toString()) || 0,
        OutletPressureNorQ: parseFloat(valve.fluid.p2.normal.toString()) || 0,
        OutletPressureMinQ: parseFloat(valve.fluid.p2.min.toString()) || 0,
        DifferentialPressureMaxQ: parseFloat(valve.fluid.dp.max.toString()) || 0,
        DifferentialPressureNorQ: parseFloat(valve.fluid.dp.normal.toString()) || 0,
        DifferentialPressureMinQ: parseFloat(valve.fluid.dp.min.toString()) || 0,
                TemperatureUnit: valve.fluid.temperatureUnit,
        InletTemperatureQ: parseFloat(valve.fluid.t1.max.toString()) || 0,
        InletTemperatureNorQ: parseFloat(valve.fluid.t1.normal.toString()) || 0,
        InletTemperatureMinQ: parseFloat(valve.fluid.t1.min.toString()) || 0,
                DensityUnit: 'kg/m³',
                Density: parseFloat(valve.fluid.density) || 0,
                MolecularWeightUnit: 'g/mol',
                MolecularWeight: parseFloat(valve.fluid.molecular) || 0,
                BodySizeUnit: valve.body.sizeUnit || null,
                BodySize: getBodySizeCode(valve.body.size, valve.body.sizeUnit),
                BodyMat: getBodyMatCode(valve.body.materialBody),
                TrimMat: getTrimMatCode(valve.body.materialTrim),
                TrimOption: getTrimOptionCode(valve.body.option),
        // [수정] bodyRating -> BodyRating (b를 대문자 B로)
        BodyRating: valve.body.rating,
        // [수정] bodyRatingUnit -> BodyRatingUnit (b, u를 대문자 B, U로)
        BodyRatingUnit: valve.body.ratingUnit,
                ActType: valve.actuator.type,
                IsHW: valve.actuator.hw === 'Yes',
      };

      // IsPositioner 로직 수정: Type에 값이 있을 때만 true
      if (valve.accessory.positioner.type) {
        tagNoData.IsPositioner = true;
        tagNoData.PositionerType = valve.accessory.positioner.type;
      } else {
        tagNoData.IsPositioner = false;
        tagNoData.PositionerType = null;
      }

      tagNoData.ExplosionProof = valve.accessory.explosionProof || null;
      tagNoData.TransmitterType = valve.accessory.transmitter.type || null;
      
      tagNoData.IsSolenoid = valve.accessory.solenoidValve.exists;
      tagNoData.IsLimSwitch = valve.accessory.limitSwitch.exists;
      tagNoData.IsAirSet = valve.accessory.airSet.exists;
      tagNoData.IsVolumeBooster = valve.accessory.volumeBooster.exists;
      tagNoData.IsAirOperated = valve.accessory.airOperatedValve.exists;
      tagNoData.IsLockUp = valve.accessory.lockupValve.exists;
      tagNoData.IsSnapActingRelay = valve.accessory.snapActingRelay.exists;

      return tagNoData;
    });

    const typeSelections = types.map(type => {
      const typeValves = allTagNos
        .filter(valve => valve.ValveSeriesCode === type.code) // [수정] valveSeriesCode -> ValveSeriesCode
        .map(valve => {
          // ValveSeriesCode는 백엔드 전송 시 필요 없으므로 제거
          const { ValveSeriesCode, ...rest } = valve; // [수정] valveSeriesCode -> ValveSeriesCode
            return {
            ValveName: valve.Tagno, // [수정] tagno -> Tagno
            ValveSeriesCode: valve.ValveSeriesCode, // [수정] valveSeriesCode -> ValveSeriesCode
            TagNos: [rest]
            };
          });
          
      return {
        Type: type.name,
        Valves: typeValves
      };
    });

    return {
      TypeSelections: typeSelections,
      Project: projectName,
      CustomerRequirement: customerRequirement,
      CustomerID: selectedCustomer?.userID || currentUser?.userId || 'admin',
      WriterID: currentUser?.userId || 'admin',
      Attachments: []
    };
  }, [types, valves, projectName, customerRequirement, selectedCustomer, currentUser, bodySizeList, bodyMatList, trimMatList, trimOptionList, bodyRatingList]);

  // 임시저장 기능
  const handleSaveDraft = async () => {
    // TempEstimateNo가 없으면 먼저 생성
    let currentTempEstimateNo = tempEstimateNo;
    if (!currentTempEstimateNo) {
      try {
        const response = await axios.post('http://192.168.0.59:5135/api/estimate/generate-temp-no', null, { params: { currentUserId: currentUser?.userId || 'admin' } });
        currentTempEstimateNo = response.data.tempEstimateNo;
        setTempEstimateNo(currentTempEstimateNo);
      } catch (error) {
        console.error('TempEstimateNo 생성 실패:', error);
        alert('TempEstimateNo 생성에 실패했습니다.');
        return;
      }
    }

    // 실제 입력된 데이터가 있는지 확인
    if (types.length === 0) {
      alert('최소 하나의 Type을 추가해주세요.');
      return;
    }

    if (valves.length === 0) {
      alert('최소 하나의 TagNo를 추가해주세요.');
      return;
    }
    
    try {
      const submitData = createSavePayload();
      console.log('Submit Data - CustomerRequirement:', submitData.CustomerRequirement);
      console.log('Submit Data 전체:', JSON.stringify(submitData, null, 2));

      await axios.post(`http://192.168.0.59:5135/api/estimate/sheets/${currentTempEstimateNo}/save-draft`, submitData);
      
      // 성공 시 임시저장 플래그 제거
      localStorage.removeItem(`saved_${currentTempEstimateNo}`);
      
      alert('임시저장이 완료되었습니다.');
      navigate('/dashboard/estimate-requests');
    } catch (error) {
      console.error('견적요청 실패:', error);
      alert('견적요청에 실패했습니다.');
    }
  };

  // 견적요청 기능
  const handleSubmitEstimate = async () => {
    // TempEstimateNo가 없으면 먼저 생성
    let currentTempEstimateNo = tempEstimateNo;
    if (!currentTempEstimateNo) {
      try {
        const response = await axios.post('http://192.168.0.59:5135/api/estimate/generate-temp-no', {});
        currentTempEstimateNo = response.data.tempEstimateNo;
        setTempEstimateNo(currentTempEstimateNo);
      } catch (error) {
        console.error('TempEstimateNo 생성 실패:', error);
        alert('TempEstimateNo 생성에 실패했습니다.');
        return;
      }
    }

    // 실제 입력된 데이터가 있는지 확인
    if (types.length === 0) {
      alert('최소 하나의 Type을 추가해주세요.');
      return;
    }

    if (valves.length === 0) {
      alert('최소 하나의 TagNo를 추가해주세요.');
      return;
    }
    
    try {
      const submitData = createSavePayload();
      
      // StaffComment 추가
      const finalSubmitData = {
        ...submitData,
        StaffComment: staffComment, // createSavePayload 밖에서 staffComment 사용
      };
      
      console.log('Submit Data - CustomerRequirement:', finalSubmitData.CustomerRequirement);
      console.log('Submit Data 전체:', JSON.stringify(finalSubmitData, null, 2));

      await axios.post(`http://192.168.0.59:5135/api/estimate/sheets/${currentTempEstimateNo}/submit`, finalSubmitData);
      
      // 성공 시 임시저장 플래그 제거
      localStorage.removeItem(`saved_${currentTempEstimateNo}`);
      
      alert('견적요청이 완료되었습니다.');
      navigate('/dashboard/estimate-requests');
    } catch (error) {
      console.error('견적요청 실패:', error);
      alert('견적요청에 실패했습니다.');
    }
  };

  const handleValveClick = (valve: ValveData) => {
    setCurrentValve(valve);
    // Step 3로 스크롤 이동
   // setTimeout(() => {
      //if (specSectionRef.current) {
        //specSectionRef.current.scrollIntoView({ 
          //behavior: 'smooth', 
          //block: 'start' 
        //});
      //}
    //}, 100);
  };

  // 입력 필드 값 업데이트 함수
  const updateValveData = useCallback((valveId: string, path: string, value: any) => {
    setValves(prevValves => {
      const updatedValve = prevValves.find(v => v.id === valveId);
      if (!updatedValve) return prevValves;

      // 중첩된 경로 처리 (예: body.sizeUnit, accessory.positioner.type)
      const pathParts = path.split('.');
      let newValve = { ...updatedValve };
      
      if (pathParts.length === 2) {
        const [parent, child] = pathParts;
        const parentObj = updatedValve[parent as keyof ValveData] as any;
        newValve = {
          ...updatedValve,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      } else if (pathParts.length === 3) {
        const [parent, child, grandchild] = pathParts;
        const parentObj = updatedValve[parent as keyof ValveData] as any;
        const childObj = parentObj[child] as any;
        newValve = {
          ...updatedValve,
          [parent]: {
            ...parentObj,
            [child]: {
              ...childObj,
              [grandchild]: value
            }
          }
        };

        // Positioner 특별 처리
        if (path === 'accessory.positioner.type') {
          const newType = value;
          const newExists = newType !== '';
          newValve.accessory.positioner.exists = newExists;
        }

      } else {
        newValve = {
          ...updatedValve,
          [path]: value
        };
      }
      
      const updatedValves = prevValves.map(v => v.id === valveId ? newValve : v);
      
      // currentValve도 함께 업데이트
      if (currentValve && currentValve.id === valveId) {
        setCurrentValve(newValve);
      }
      
      return updatedValves;
    });
  }, [currentValve]);

  // 입력 필드 값 업데이트 함수
  const handleBodyChange = useCallback((field: string, value: string) => {
    if (!currentValve) return;
    updateValveData(currentValve.id, `body.${field}`, value);
  }, [currentValve, updateValveData]);

  // 입력 필드 값 업데이트 함수
  const handleActuatorChange = useCallback((field: string, value: string) => {
    if (!currentValve) return;
    updateValveData(currentValve.id, `actuator.${field}`, value);
  }, [currentValve, updateValveData]);

  // 입력 필드 값 업데이트 함수
  const handleAccessoryChange = useCallback((field: string, value: any) => {
    if (!currentValve) return;
    updateValveData(currentValve.id, `accessory.${field}`, value);
  }, [currentValve, updateValveData]);

  // 라디오 버튼 핸들러들
  const handleRadioChange = useCallback((field: string, value: boolean) => {
    if (!currentValve) return;
    setValves(prevValves => {
      const updatedValves = prevValves.map(valve => 
        valve.id === currentValve.id 
          ? { ...valve, [field]: value }
          : valve
      );
      
      // currentValve도 함께 업데이트
      const updatedCurrentValve = updatedValves.find(valve => valve.id === currentValve.id);
      if (updatedCurrentValve) {
        setCurrentValve(updatedCurrentValve);
      }
      
      return updatedValves;
    });
  }, [currentValve]);

  // molecular/density 중 하나만 입력되도록 하는 핸들러
  const handleFluidFieldChange = useCallback((field: string, value: string) => {
    if (!currentValve) return;
    
    setValves(prevValves => {
      const updatedValves = prevValves.map(valve => 
        valve.id === currentValve.id 
          ? {
              ...valve,
              fluid: { 
                ...valve.fluid, 
                [field]: value,
                // molecular과 density 중 하나만 입력되도록
                ...(field === 'molecular' && value !== '' ? { density: '' } : {}),
                ...(field === 'density' && value !== '' ? { molecular: '' } : {})
              }
            }
          : valve
      );
      
      // currentValve 업데이트는 한 번만 수행
      const updatedCurrentValve = updatedValves.find(valve => valve.id === currentValve.id);
      if (updatedCurrentValve) {
        setCurrentValve(updatedCurrentValve);
      }
      
      return updatedValves;
    });
  }, [currentValve]);

  // Fluid 조건 필드 업데이트 함수
  const handleFluidConditionChange = useCallback((condition: string, field: string, value: number | string) => {
    if (!currentValve) return;
    setValves(prevValves => {
      const updatedValves = prevValves.map(valve => 
        valve.id === currentValve.id 
          ? {
              ...valve,
              fluid: {
                ...valve.fluid,
                [condition]: { ...(valve.fluid as any)[condition], [field]: value }
              }
            }
          : valve
      );
      
      // currentValve도 함께 업데이트
      const updatedCurrentValve = updatedValves.find(valve => valve.id === currentValve.id);
      if (updatedCurrentValve) {
        setCurrentValve(updatedCurrentValve);
      }
      
      return updatedValves;
    });
  }, [currentValve]);

  // 통합된 단위 필드 업데이트 함수
  const handleUnitChange = useCallback((field: string, value: string) => {
    if (!currentValve) return;
    setValves(prevValves => {
      const updatedValves = prevValves.map(valve => 
        valve.id === currentValve.id 
          ? {
              ...valve,
              fluid: {
                ...valve.fluid,
                [field]: value
              }
            }
          : valve
      );
      
      // currentValve도 함께 업데이트
      const updatedCurrentValve = updatedValves.find(valve => valve.id === currentValve.id);
      if (updatedCurrentValve) {
        setCurrentValve(updatedCurrentValve);
      }
      
      return updatedValves;
    });
  }, [currentValve]);

  const TypeSection = () => (
    <div className="type-section">
      <div className="type-header">
        <h3>Step 1: Type 선정</h3>
        <p className="step-description-req">견적에 필요한 밸브 타입을 선택하고 관리합니다.</p>
        <div className="type-actions">
          <button onClick={handleAddType}>추가</button>
          <button onClick={() => selectedType && handleRemoveType(types.findIndex(type => type.id === selectedType))}>삭제</button>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleTypeDragEnd}
      >
        <SortableContext
          items={types.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {types.map((item, index) => (
            <SortableItem key={item.id} id={item.id}>
              <div 
                className={`type-item ${selectedType === item.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedType(item.id);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                style={{ 
                  cursor: 'pointer', 
                  userSelect: 'none',
                  pointerEvents: 'auto'
                }}
              >
                <span>{item.name} ({valves.filter(valve => valve.body.type === item.name).reduce((sum, valve) => sum + valve.qty, 0)})</span>
              </div>
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      
      {/* 드롭다운을 TypeSection 안에 렌더링 */}
      {showValveDropdown && (
        <div className="valve-dropdown" style={{ 
          position: 'relative',
          backgroundColor: 'white', 
          border: '2px solid #007bff',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          maxHeight: '150px',
          overflowY: 'auto',
          marginTop: '5px'
        }}>
          {bodyValveList.map((valve) => (
            <div
              key={valve.valveSeriesCode}
              onClick={() => handleValveSelect(valve)}
              style={{ 
                padding: '8px 12px', 
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              {valve.valveSeries}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Valve 추가 섹션
  const ValveSection = () => {
    // 선택된 Type에 해당하는 TagNo만 필터링
    const filteredValves = selectedType 
      ? valves.filter(valve => {
          const selectedTypeData = types.find(t => t.id === selectedType);
          return selectedTypeData && valve.body.type === selectedTypeData.name;
        })
      : [];

  return (
      <div className="valve-section">
        <div className="valve-header">
          <div className="valve-actions">
            <button 
              onClick={handleAddValve} 
              disabled={!selectedType || isReadOnly}
            >
              추가
          </button>
            <button 
              onClick={() => currentValve && handleDeleteValve(currentValve.id)}
              disabled={!currentValve || isReadOnly}
            >
              삭제
            </button>
        </div>
      </div>

        {!selectedType ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            margin: '10px 0'
          }}>
            Step 1에서 Type을 선택하면 해당 Type의 TagNo를 추가할 수 있습니다.
        </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleValveDragEnd}
          >
            <SortableContext
              items={filteredValves.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredValves.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  <div 
                    className={`valve-item ${currentValve?.id === item.id ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleValveClick(item);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    style={{ 
                      cursor: 'pointer',
                      pointerEvents: 'auto'
                    }}
                  >
                    <span>TagNo: {item.tagNo} (Qty: {item.qty})</span>
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        )}
        
        {/* Step 3 영역에 ref 추가 */}
        <div ref={specSectionRef} style={{ height: '1px', marginTop: '20px' }}></div>
      </div>
    );
  };

  // 상세 사양 입력 섹션
  const SpecificationSection = () => {
    const handleTagNoClick = () => {
      //if (tagNoRef.current) {
        //tagNoRef.current.scrollIntoView({ behavior: 'smooth' });
      //}
    };

    return (
      <div className="spec-section">
        <h3>Step 3: 상세사양 입력</h3>
        <p className="step-description-req">선택된 TagNo의 상세 사양을 입력합니다.</p>
        {currentValve ? (
          <div className="spec-content">
            <div className="spec-header">
              <div className="tag-info">
                <label htmlFor="tag-no">Tag No</label>
                  <input
                  id="tag-no"
                  name="tagNo"
                    type="text"
                  value={currentValve.tagNo} 
                  onChange={(e) => {
                    if (!currentValve) return;
                    const newTagNo = e.target.value;
                    setValves(prevValves => 
                      prevValves.map(valve => 
                        valve.id === currentValve.id 
                          ? { ...valve, tagNo: newTagNo }
                          : valve
                      )
                    );
                    // currentValve도 함께 업데이트
                    setCurrentValve(prev => prev ? { ...prev, tagNo: newTagNo } : null);
                  }}
                  ref={tagNoRef} 
                  onClick={handleTagNoClick} 
                  />
                </div>
              <div className="quantity-info">
                <label htmlFor="quantity">Q'ty</label>
                <input 
                  id="quantity"
                  name="quantity"
                  type="number" 
                  value={currentValve.qty === 0 ? '' : currentValve.qty} 
                  min="1"
                  onChange={(e) => {
                    if (!currentValve) return;
                    const value = parseInt(e.target.value);
                    const newQty = isNaN(value) ? 0 : Math.max(1, value);
                    
                    setValves(prevValves => 
                      prevValves.map(valve => 
                        valve.id === currentValve.id 
                          ? { ...valve, qty: newQty }
                          : valve
                      )
                    );
                    
                    // currentValve도 함께 업데이트
                    setCurrentValve(prev => prev ? { ...prev, qty: newQty } : null);
                  }}
                  />
                </div>
              </div>
              
            <div className="spec-grid">
              <div className="fluid-section">
                  <div className="fluid-row">
                  <h4>Fluid</h4>
                    <label>Medium:</label>
                    <input
                      id="fluid-medium" 
                      name="fluidMedium" 
                      type="text"
                      value={currentValve.fluid.medium}
                      onChange={(e) => handleFluidFieldChange('medium', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                  
                  <div className="fluid-row">
                    <label>Fluid:</label>
                    <select 
                      id="fluid-type" 
                      name="fluidType"
                      value={currentValve.fluid.fluid}
                      onChange={(e) => handleFluidFieldChange('fluid', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="">선택하세요</option>
                      {fluidOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="fluid-row">
                    <div className="radio-group">
                      <div className="radio-label">
                        <label><input type="radio" name="densityType" value="Density" checked={currentValve.isDensity} onChange={(e) => handleRadioChange('isDensity', e.target.checked)} disabled={isReadOnly} /></label>
                </div>
                      <label>Density:</label>
                      <input 
                        id="fluid-density" 
                        name="fluidDensity" 
                        type="text" 
                        value={currentValve.fluid.density}
                        onChange={(e) => handleFluidFieldChange('density', e.target.value)}
                        placeholder={!currentValve.isDensity ? 'Molecular 선택 시 사용 불가' : ''}
                        disabled={!currentValve.isDensity || isReadOnly}
                        className={!currentValve.isDensity ? 'disabled-input' : ''}
                      />
              </div>
            </div>

                  <div className="fluid-row">
                    <div className="radio-group">
                      <div className="radio-label">
                        <label><input type="radio" name="densityType" value="Molecular" checked={!currentValve.isDensity} onChange={(e) => handleRadioChange('isDensity', !e.target.checked)} disabled={isReadOnly} /></label>
              </div>
                      <label>Molecular:</label>
                                <input
                        id="fluid-molecular" 
                        name="fluidMolecular" 
                                  type="text"
                        value={currentValve.fluid.molecular}
                        onChange={(e) => handleFluidFieldChange('molecular', e.target.value)}
                        placeholder={currentValve.isDensity ? 'Density 선택 시 사용 불가' : ''}
                        disabled={currentValve.isDensity || isReadOnly}
                        className={currentValve.isDensity ? 'disabled-input' : ''}
                                />
                              </div>
                  </div>
                  
                  <h4>Fluid Conditions</h4>
                  <table className="fluid-conditions-table">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Max</th>
                        <th>Normal</th>
                        <th>Min</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>t1</td>
                        <td><input id="t1-max" name="t1Max" type="number" value={currentValve.fluid.t1.max === 0 ? '' : currentValve.fluid.t1.max} onChange={(e) => handleFluidConditionChange('t1', 'max', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></td>
                        <td><input id="t1-normal" name="t1Normal" type="number" value={currentValve.fluid.t1.normal === 0 ? '' : currentValve.fluid.t1.normal} onChange={(e) => handleFluidConditionChange('t1', 'normal', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></td>
                        <td><input id="t1-min" name="t1Min" type="number" value={currentValve.fluid.t1.min === 0 ? '' : currentValve.fluid.t1.min} onChange={(e) => handleFluidConditionChange('t1', 'min', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></td>
                        <td>
                          <select 
                            id="t1-unit" 
                            name="t1Unit"
                            value={currentValve.fluid.temperatureUnit}
                            onChange={(e) => handleUnitChange('temperatureUnit', e.target.value)}
                            disabled={isReadOnly}
                          >
                            <option value="°C">°C</option>
                            <option value="K">K</option>
                            <option value="°F">°F</option>
                            <option value="°Reaumur">°Reaumur</option>
                            <option value="°Rankine">°Rankine</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td>p1</td>
                        <td><input id="p1-max" name="p1Max" type="number" value={currentValve.fluid.p1.max === 0 ? '' : currentValve.fluid.p1.max} onChange={(e) => handleFluidConditionChange('p1', 'max', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></td>
                        <td><input id="p1-normal" name="p1Normal" type="number" value={currentValve.fluid.p1.normal === 0 ? '' : currentValve.fluid.p1.normal} onChange={(e) => handleFluidConditionChange('p1', 'normal', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></td>
                        <td><input id="p1-min" name="p1Min" type="number" value={currentValve.fluid.p1.min === 0 ? '' : currentValve.fluid.p1.min} onChange={(e) => handleFluidConditionChange('p1', 'min', parseFloat(e.target.value) || 0)} disabled={isReadOnly} /></td>
                        <td>
                          <select 
                            id="p1-unit" 
                            name="p1Unit"
                            value={currentValve.fluid.pressureUnit}
                            onChange={(e) => handleUnitChange('pressureUnit', e.target.value)}
                            disabled={isReadOnly}
                          >
                            <option value="bar(a)">bar(a)</option>
                            <option value="mbar(a)">mbar(a)</option>
                            <option value="Pa(a)">Pa(a)</option>
                            <option value="kPa(a)">kPa(a)</option>
                            <option value="MPa(a)">MPa(a)</option>
                            <option value="at(a)">at(a)</option>
                            <option value="atm(a)">atm(a)</option>
                            <option value="kp/cm²(a)">kp/cm²(a)</option>
                            <option value="N/m²(a)">N/m²(a)</option>
                            <option value="N/mm²(a)">N/mm²(a)</option>
                            <option value="Torr(a)">Torr(a)</option>
                            <option value="mmHg(a)">mmHg(a)</option>
                            <option value="mmH2O(a)">mmH2O(a)</option>
                            <option value="psi(a)">psi(a)</option>
                            <option value="ftH2O(a)">ftH2O(a)</option>
                            <option value="inHg(a)">inHg(a)</option>
                            <option value="inH2O(a)">inH2O(a)</option>
                            <option value="lbf/ft²(a)">lbf/ft²(a)</option>
                            <option value="bar(g)">bar(g)</option>
                            <option value="mbar(g)">mbar(g)</option>
                            <option value="Pa(g)">Pa(g)</option>
                            <option value="kPa(g)">kPa(g)</option>
                            <option value="MPa(g)">MPa(g)</option>
                            <option value="at(g)">at(g)</option>
                            <option value="atm(g)">atm(g)</option>
                            <option value="kp/cm²(g)">kp/cm²(g)</option>
                            <option value="N/m²(g)">N/m²(g)</option>
                            <option value="N/mm²(g)">N/mm²(g)</option>
                            <option value="Torr(g)">Torr(g)</option>
                            <option value="mmHg(g)">mmHg(g)</option>
                            <option value="mmH2O(g)">mmH2O(g)</option>
                            <option value="psi(g)">psi(g)</option>
                            <option value="ftH2O(g)">ftH2O(g)</option>
                            <option value="inHg(g)">inHg(g)</option>
                            <option value="inH2O(g)">inH2O(g)</option>
                            <option value="lbf/ft²(g)">lbf/ft²(g)</option>
                            <option value="kgf/cm²(a)">kgf/cm²(a)</option>
                            <option value="kgf/cm²(g)">kgf/cm²(g)</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ fontSize: '10px' }}>
                              <label><input type="radio" name="p2Type" value="P2" checked={currentValve.isP2} onChange={(e) => handleRadioChange('isP2', e.target.checked)} disabled={isReadOnly} /></label>
                            </div>
                            p2
                    </div>
                        </td>
                        <td><input id="p2-max" name="p2Max" type="number" value={currentValve.fluid.p2.max === 0 ? '' : currentValve.fluid.p2.max} onChange={(e) => handleFluidConditionChange('p2', 'max', parseFloat(e.target.value) || 0)} disabled={!currentValve.isP2 || isReadOnly} className={!currentValve.isP2 ? 'disabled-input' : ''} /></td>
                        <td><input id="p2-normal" name="p2Normal" type="number" value={currentValve.fluid.p2.normal === 0 ? '' : currentValve.fluid.p2.normal} onChange={(e) => handleFluidConditionChange('p2', 'normal', parseFloat(e.target.value) || 0)} disabled={!currentValve.isP2 || isReadOnly} className={!currentValve.isP2 ? 'disabled-input' : ''} /></td>
                        <td><input id="p2-min" name="p2Min" type="number" value={currentValve.fluid.p2.min === 0 ? '' : currentValve.fluid.p2.min} onChange={(e) => handleFluidConditionChange('p2', 'min', parseFloat(e.target.value) || 0)} disabled={!currentValve.isP2 || isReadOnly} className={!currentValve.isP2 ? 'disabled-input' : ''} /></td>
                        <td>
                          <select 
                            id="p2-unit" 
                            name="p2Unit"
                            value={currentValve.fluid.pressureUnit}
                            onChange={(e) => handleUnitChange('pressureUnit', e.target.value)}
                            disabled={!currentValve.isP2 || isReadOnly}
                            className={!currentValve.isP2 ? 'disabled-input' : ''}
                          >
                            <option value="bar(a)">bar(a)</option>
                            <option value="mbar(a)">mbar(a)</option>
                            <option value="Pa(a)">Pa(a)</option>
                            <option value="kPa(a)">kPa(a)</option>
                            <option value="MPa(a)">MPa(a)</option>
                            <option value="at(a)">at(a)</option>
                            <option value="atm(a)">atm(a)</option>
                            <option value="kp/cm²(a)">kp/cm²(a)</option>
                            <option value="N/m²(a)">N/m²(a)</option>
                            <option value="N/mm²(a)">N/mm²(a)</option>
                            <option value="Torr(a)">Torr(a)</option>
                            <option value="mmHg(a)">mmHg(a)</option>
                            <option value="mmH2O(a)">mmH2O(a)</option>
                            <option value="psi(a)">psi(a)</option>
                            <option value="ftH2O(a)">ftH2O(a)</option>
                            <option value="inHg(a)">inHg(a)</option>
                            <option value="inH2O(a)">inH2O(a)</option>
                            <option value="lbf/ft²(a)">lbf/ft²(a)</option>
                            <option value="bar(g)">bar(g)</option>
                            <option value="mbar(g)">mbar(g)</option>
                            <option value="Pa(g)">Pa(g)</option>
                            <option value="kPa(g)">kPa(g)</option>
                            <option value="MPa(g)">MPa(g)</option>
                            <option value="at(g)">at(g)</option>
                            <option value="atm(g)">atm(g)</option>
                            <option value="kp/cm²(g)">kp/cm²(g)</option>
                            <option value="N/m²(g)">N/m²(g)</option>
                            <option value="N/mm²(g)">N/mm²(g)</option>
                            <option value="Torr(g)">Torr(g)</option>
                            <option value="mmHg(g)">mmHg(g)</option>
                            <option value="mmH2O(g)">mmH2O(g)</option>
                            <option value="psi(g)">psi(g)</option>
                            <option value="ftH2O(g)">ftH2O(g)</option>
                            <option value="inHg(g)">inHg(g)</option>
                            <option value="inH2O(g)">inH2O(g)</option>
                            <option value="lbf/ft²(g)">lbf/ft²(g)</option>
                            <option value="kgf/cm²(a)">kgf/cm²(a)</option>
                            <option value="kgf/cm²(g)">kgf/cm²(g)</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="radio-group">
                            <div className="radio-label">
                              <label><input type="radio" name="dpType" value="DP" checked={!currentValve.isP2} onChange={(e) => handleRadioChange('isP2', !e.target.checked)} disabled={isReadOnly} /></label>
                            </div>
                            Δp
          </div>
                        </td>
                        <td><input id="dp-max" name="dpMax" type="number" value={currentValve.fluid.dp.max === 0 ? '' : currentValve.fluid.dp.max} onChange={(e) => handleFluidConditionChange('dp', 'max', parseFloat(e.target.value) || 0)} disabled={currentValve.isP2 || isReadOnly} className={currentValve.isP2 ? 'disabled-input' : ''} /></td>
                        <td><input id="dp-normal" name="dpNormal" type="number" value={currentValve.fluid.dp.normal === 0 ? '' : currentValve.fluid.dp.normal} onChange={(e) => handleFluidConditionChange('dp', 'normal', parseFloat(e.target.value) || 0)} disabled={currentValve.isP2 || isReadOnly} className={currentValve.isP2 ? 'disabled-input' : ''} /></td>
                        <td><input id="dp-min" name="dpMin" type="number" value={currentValve.fluid.dp.min === 0 ? '' : currentValve.fluid.dp.min} onChange={(e) => handleFluidConditionChange('dp', 'min', parseFloat(e.target.value) || 0)} disabled={currentValve.isP2 || isReadOnly} className={currentValve.isP2 ? 'disabled-input' : ''} /></td>
                        <td>
                          <select 
                            id="dp-unit" 
                            name="dpUnit"
                            value={currentValve.fluid.pressureUnit}
                            onChange={(e) => handleUnitChange('pressureUnit', e.target.value)}
                            disabled={currentValve.isP2 || isReadOnly}
                            className={currentValve.isP2 ? 'disabled-input' : ''}
                          >
                            <option value="bar(a)">bar(a)</option>
                            <option value="mbar(a)">mbar(a)</option>
                            <option value="Pa(a)">Pa(a)</option>
                            <option value="kPa(a)">kPa(a)</option>
                            <option value="MPa(a)">MPa(a)</option>
                            <option value="at(a)">at(a)</option>
                            <option value="atm(a)">atm(a)</option>
                            <option value="kp/cm²(a)">kp/cm²(a)</option>
                            <option value="N/m²(a)">N/m²(a)</option>
                            <option value="N/mm²(a)">N/mm²(a)</option>
                            <option value="Torr(a)">Torr(a)</option>
                            <option value="mmHg(a)">mmHg(a)</option>
                            <option value="mmH2O(a)">mmH2O(a)</option>
                            <option value="psi(a)">psi(a)</option>
                            <option value="ftH2O(a)">ftH2O(a)</option>
                            <option value="inHg(a)">inHg(a)</option>
                            <option value="inH2O(a)">inH2O(a)</option>
                            <option value="lbf/ft²(a)">lbf/ft²(a)</option>
                            <option value="bar(g)">bar(g)</option>
                            <option value="mbar(g)">mbar(g)</option>
                            <option value="Pa(g)">Pa(g)</option>
                            <option value="kPa(g)">kPa(g)</option>
                            <option value="MPa(g)">MPa(g)</option>
                            <option value="at(g)">at(g)</option>
                            <option value="atm(g)">atm(g)</option>
                            <option value="kp/cm²(g)">kp/cm²(g)</option>
                            <option value="N/m²(g)">N/m²(g)</option>
                            <option value="N/mm²(g)">N/mm²(g)</option>
                            <option value="Torr(g)">Torr(g)</option>
                            <option value="mmHg(g)">mmHg(g)</option>
                            <option value="mmH2O(g)">mmH2O(g)</option>
                            <option value="psi(g)">psi(g)</option>
                            <option value="ftH2O(g)">ftH2O(g)</option>
                            <option value="inHg(g)">inHg(g)</option>
                            <option value="inH2O(g)">inH2O(g)</option>
                            <option value="lbf/ft²(g)">lbf/ft²(g)</option>
                            <option value="kgf/cm²(a)">kgf/cm²(a)</option>
                            <option value="kgf/cm²(g)">kgf/cm²(g)</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ fontSize: '10px' }}>
                              <label><input type="radio" name="qmType" value="Qm" checked={currentValve.isQM} onChange={(e) => handleRadioChange('isQM', e.target.checked)} disabled={isReadOnly} /></label>
                            </div>
                            qm
                          </div>
                        </td>
                        <td><input id="qm-max" name="qmMax" type="number" value={currentValve.fluid.qm.max === 0 ? '' : currentValve.fluid.qm.max} onChange={(e) => handleFluidConditionChange('qm', 'max', parseFloat(e.target.value) || 0)} disabled={!currentValve.isQM || isReadOnly} className={!currentValve.isQM ? 'disabled-input' : ''} /></td>
                        <td><input id="qm-normal" name="qmNormal" type="number" value={currentValve.fluid.qm.normal === 0 ? '' : currentValve.fluid.qm.normal} onChange={(e) => handleFluidConditionChange('qm', 'normal', parseFloat(e.target.value) || 0)} disabled={!currentValve.isQM || isReadOnly} className={!currentValve.isQM ? 'disabled-input' : ''} /></td>
                        <td><input id="qm-min" name="qmMin" type="number" value={currentValve.fluid.qm.min === 0 ? '' : currentValve.fluid.qm.min} onChange={(e) => handleFluidConditionChange('qm', 'min', parseFloat(e.target.value) || 0)} disabled={!currentValve.isQM || isReadOnly} className={!currentValve.isQM ? 'disabled-input' : ''} /></td>
                        <td>
                          <select 
                            id="qm-unit" 
                            name="qmUnit"
                            value={currentValve.fluid.qm.unit}
                            onChange={(e) => handleFluidConditionChange('qm', 'unit', e.target.value)}
                            disabled={!currentValve.isQM || isReadOnly}
                            className={!currentValve.isQM ? 'disabled-input' : ''}
                          >
                            <option value="m³/h">m³/h</option>
                            <option value="m³/s">m³/s</option>
                            <option value="m³/d">m³/d</option>
                            <option value="l/h">l/h</option>
                            <option value="l/s">l/s</option>
                            <option value="l/min">l/min</option>
                            <option value="GPH(US)">GPH(US)</option>
                            <option value="GPM(US)">GPM(US)</option>
                            <option value="MMSCFD">MMSCFD</option>
                            <option value="MSCFD">MSCFD</option>
                            <option value="MMSCFH">MMSCFH</option>
                            <option value="MSCFH">MSCFH</option>
                            <option value="SCFH">SCFH</option>
                            <option value="MMSCFM">MMSCFM</option>
                            <option value="MSCFM">MSCFM</option>
                            <option value="SCFM">SCFM</option>
                            <option value="GPH(UK)">GPH(UK)</option>
                            <option value="GPM(UK)">GPM(UK)</option>
                            <option value="dm³/h">dm³/h</option>
                            <option value="MMSCMD">MMSCMD</option>
                            <option value="MSCMD">MSCMD</option>
                            <option value="MMSCMH">MMSCMH</option>
                            <option value="MSCMH">MSCMH</option>
                            <option value="MMSCMM">MMSCMM</option>
                            <option value="MSCMM">MSCMM</option>
                            <option value="bbl/d(US)">bbl/d(US)</option>
                            <option value="bbl/d(oil)">bbl/d(oil)</option>
                            <option value="bbl/d(UK)">bbl/d(UK)</option>
                            <option value="bbl/h(US)">bbl/h(US)</option>
                            <option value="bbl/h(oil)">bbl/h(oil)</option>
                            <option value="bbl/h(UK)">bbl/h(UK)</option>
                          </select>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div className="radio-group">
                            <div className="radio-label">
                              <label><input type="radio" name="qnType" value="Qn" checked={!currentValve.isQM} onChange={(e) => handleRadioChange('isQM', !e.target.checked)} disabled={isReadOnly} /></label>
                            </div>
                            qn
                          </div>
                        </td>
                        <td><input id="qn-max" name="qnMax" type="number" value={currentValve.fluid.qn.max === 0 ? '' : currentValve.fluid.qn.max} onChange={(e) => handleFluidConditionChange('qn', 'max', parseFloat(e.target.value) || 0)} disabled={currentValve.isQM || isReadOnly} className={currentValve.isQM ? 'disabled-input' : ''} /></td>
                        <td><input id="qn-normal" name="qnNormal" type="number" value={currentValve.fluid.qn.normal === 0 ? '' : currentValve.fluid.qn.normal} onChange={(e) => handleFluidConditionChange('qn', 'normal', parseFloat(e.target.value) || 0)} disabled={currentValve.isQM || isReadOnly} className={currentValve.isQM ? 'disabled-input' : ''} /></td>
                        <td><input id="qn-min" name="qnMin" type="number" value={currentValve.fluid.qn.min === 0 ? '' : currentValve.fluid.qn.min} onChange={(e) => handleFluidConditionChange('qn', 'min', parseFloat(e.target.value) || 0)} disabled={currentValve.isQM || isReadOnly} className={currentValve.isQM ? 'disabled-input' : ''} /></td>
                        <td>
                          <select 
                            id="qn-unit" 
                            name="qnUnit"
                            value={currentValve.fluid.qn.unit}
                            onChange={(e) => handleFluidConditionChange('qn', 'unit', e.target.value)}
                            disabled={currentValve.isQM || isReadOnly}
                            className={currentValve.isQM ? 'disabled-input' : ''}
                          >
                            <option value="m³/h">m³/h</option>
                            <option value="GPM(US)">GPM(US)</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                  
                <div className="specification-grid">
                  <div className="spec-section">
                    <h4>BODY</h4>
                    <div className="body-spec-grid">
                      <div className="body-spec-item">
                        <label>Type</label>
                        <input
                          id="body-type"
                          name="bodyType"
                          type="text"
                          value={currentValve.body.type}
                          readOnly
                        />
                      </div>
                      <div className="spec-item">
                        <label>Size</label>
                        <div className="size-selection-group">
                          <select 
                            id="body-size-unit"
                            name="bodySizeUnit"
                            value={currentValve.body.sizeUnit}
                            onChange={(e) => {
                              handleBodyChange('sizeUnit', e.target.value);
                              // 단위가 변경되면 size 초기화
                              handleBodyChange('size', '');
                            }}
                            disabled={isReadOnly}
                          >
                            <option value="">단위</option>
                            {bodySizeUnits && bodySizeUnits.length > 0 ? bodySizeUnits.map(unit => {
                              // Unit 코드를 사용자 친화적인 이름으로 변환
                              let displayName = unit.name;
                              if (unit.code === 'A') displayName = 'DN';
                              if (unit.code === 'I') displayName = 'inch';
                              if (unit.code === 'N') displayName = 'None';
                              if (unit.code === 'Z') displayName = 'SPECIAL';
                              
                              return (
                                <option key={unit.code} value={unit.code}>
                                  {displayName}
                                </option>
                              );
                            }) : (
                              <option value="" disabled>로딩 중...</option>
                            )}
                          </select>
                          <select 
                            id="body-size"
                            name="bodySize"
                            value={currentValve.body.size}
                            onChange={(e) => handleBodyChange('size', e.target.value)}
                            disabled={!currentValve.body.sizeUnit || isReadOnly}
                          >
                            <option value="">선택하세요</option>
                            {filteredSizeList && filteredSizeList.length > 0 ? filteredSizeList.map(item => (
                              <option key={`${item.sizeUnitCode}-${item.bodySizeCode}`} value={item.bodySizeCode}>
                                {item.bodySize}
                              </option>
                            )) : (
                              <option value="" disabled>Size Unit을 먼저 선택하세요</option>
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="body-spec-item">
                        <label>Material Body</label>
                        <select 
                          id="body-material-body"
                          name="bodyMaterialBody"
                          value={currentValve.body.materialBody}
                          onChange={(e) => handleBodyChange('materialBody', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {bodyMatList.map(item => (
                            <option key={item.bodyMatCode} value={item.bodyMatCode}>
                              {item.bodyMat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="spec-item">
                        <label>Rating</label>
                        <div className="rating-selection-group">
                          <select 
                            id="body-rating-unit"
                            name="bodyRatingUnit"
                            value={currentValve.body.ratingUnit}
                            onChange={(e) => {
                              handleBodyChange('ratingUnit', e.target.value);
                              handleBodyChange('rating', '');
                            }}
                            disabled={isReadOnly}
                          >
                            <option value="">단위</option>
                            {uniqueRatingUnits.map(unit => (
                              <option key={unit.code} value={unit.code}>
                                {unit.name}
                              </option>
                            ))}
                          </select>
                          <select 
                            id="body-rating"
                            name="bodyRating"
                            value={currentValve.body.rating}
                            onChange={(e) => handleBodyChange('rating', e.target.value)}
                            disabled={!currentValve.body.ratingUnit || isReadOnly}
                          >
                            <option value="">등급</option>
                            {filteredRatingList.map(item => (
                              <option key={item.id} value={item.ratingCode}>
                                {item.ratingName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="spec-section">
                    <h4>Trim</h4>
                    <div className="spec-grid">
                      <div className="spec-item">
                        <label>Material Trim</label>
                        <select 
                          id="trim-material-trim"
                          name="trimMaterialTrim"
                          value={currentValve.body.materialTrim}
                          onChange={(e) => handleBodyChange('materialTrim', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {trimMatList.map(item => (
                            <option key={item.trimMatCode} value={item.trimMatCode}>
                              {item.trimMat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="spec-item">
                        <label>Option</label>
                        <select 
                          id="trim-option"
                          name="trimOption"
                          value={currentValve.body.option}
                          onChange={(e) => handleBodyChange('option', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {trimOptionList.map(item => (
                            <option key={item.trimOptionCode} value={item.trimOptionCode}>
                              {item.trimOption}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="spec-section">
                    <h4>ACT</h4>
                    <div className="spec-grid">
                      <div className="spec-item">
                        <label>Type</label>
                        <select 
                          id="actuator-type"
                          name="actuatorType"
                          value={currentValve.actuator.type}
                          onChange={(e) => handleActuatorChange('type', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {actuatorTypeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>

                      <div className="spec-item">
                        <label>H/W</label>
                        <select 
                          id="actuator-hw"
                          name="actuatorHw"
                          value={currentValve.actuator.hw}
                          onChange={(e) => handleActuatorChange('hw', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {hwOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              
              <div className="accessory-section">
                <h4>Accessory</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>Positioner</td>
                      <td>
                        <select 
                          id="accessory-positioner"
                          name="accessoryPositioner"
                          value={currentValve.accessory.positioner.type}
                          onChange={(e) => handleAccessoryChange('positioner.type', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {positionerTypeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Explosion proof</td>
                      <td>
                        <select 
                          id="accessory-explosion-proof"
                          name="accessoryExplosionProof"
                          value={currentValve.accessory.explosionProof}
                          onChange={(e) => handleAccessoryChange('explosionProof', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {explosionProofOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Transmitter</td>
                      <td>
                        <select 
                          id="accessory-transmitter"
                          name="accessoryTransmitter"
                          value={currentValve.accessory.transmitter.type}
                          onChange={(e) => handleAccessoryChange('transmitter.type', e.target.value)}
                          disabled={isReadOnly}
                        >
                          <option value="">선택하세요</option>
                          {transmitterTypeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Solenoid Valve</td>
                      <td>
                        <select 
                          id="accessory-solenoid-valve"
                          name="accessorySolenoidValve"
                          value={currentValve.accessory.solenoidValve.exists ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('solenoidValve.exists', e.target.value === 'Yes')}
                          disabled={isReadOnly}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Limit Switch</td>
                      <td>
                        <select 
                          id="accessory-limit-switch"
                          name="accessoryLimitSwitch"
                          value={currentValve.accessory.limitSwitch.exists ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('limitSwitch.exists', e.target.value === 'Yes')}
                          disabled={isReadOnly}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Air-set</td>
                      <td>
                        <select 
                          id="accessory-air-set"
                          name="accessoryAirSet"
                          value={currentValve.accessory.airSet.exists ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('airSet.exists', e.target.value === 'Yes')}
                          disabled={isReadOnly}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Volume booster</td>
                      <td>
                        <select 
                          id="accessory-volume-booster"
                          name="accessoryVolumeBooster"
                          value={currentValve.accessory.volumeBooster.exists ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('volumeBooster.exists', e.target.value === 'Yes')}
                          disabled={isReadOnly}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Air Operated Valve</td>
                      <td>
                        <select 
                          id="accessory-air-operated-valve"
                          name="accessoryAirOperatedValve"
                          value={currentValve.accessory.airOperatedValve.exists ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('airOperatedValve.exists', e.target.value === 'Yes')}
                          disabled={isReadOnly}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Lockup Valve</td>
                      <td>
                        <select 
                          id="accessory-lockup-valve"
                          name="accessoryLockupValve"
                          value={currentValve.accessory.lockupValve.exists ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('lockupValve.exists', e.target.value === 'Yes')}
                          disabled={isReadOnly}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Snap-acting relay</td>
                      <td>
                        <select 
                          id="accessory-snap-acting-relay"
                          name="accessorySnapActingRelay"
                          value={currentValve.accessory.snapActingRelay.exists ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('snapActingRelay.exists', e.target.value === 'Yes')}
                          disabled={isReadOnly}
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
            </div>
          </div>
          </div>
        ) : (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            margin: '10px 0'
          }}>
            Step 2에서 TagNo를 선택하면 상세 사양을 입력할 수 있습니다.
          </div>
        )}
      </div>
    );
  };

  // 첨부파일 섹션 (메모이제이션으로 분리)
  const AttachmentSection = React.memo(() => {
    return (
      <div className="attachment-section">
        <div className="attachment-header">
          <h4>첨부파일</h4>
          <div className="file-upload-container">
          <input
              id="file-upload"
              name="fileUpload"
            type="file"
              multiple 
              onChange={(e) => {
                if (e.target.files) {
                  handleFileUpload(e.target.files);
                }
              }}
              accept=".pdf,.xls,.xlsx,.doc,.docx,.hwp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.txt,.zip,.rar,.7z"
              style={{ display: 'none' }}
          />
          <button 
              className="upload-btn"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploadingFiles}
            >
              {uploadingFiles ? '업로드 중...' : '파일 선택'}
          </button>
        </div>
        </div>
        <div className="attachment-list">
          {fileAttachments.length === 0 ? (
            <div className="no-files">
              첨부된 파일이 없습니다.
            </div>
          ) : (
            <div className="file-list">
              {fileAttachments.map((file, index) => {
                console.log('🔍 첨부파일 렌더링 - 간단 테스트:', index, file.name);
                return (
                  <div key={`${file.id || file.uniqueId || file.attachmentId}-${index}`} className="file-item">
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(() => {
                        console.log('File size for', file.name, ':', file.size, typeof file.size);
                        const fileSize = parseInt(file.size) || 0;
                        if (fileSize === 0) return '0.00';
                        const sizeInMB = fileSize / 1024 / 1024;
                        return sizeInMB.toFixed(2);
                      })()} MB)</span>
                    </div>
                    <div className="file-actions">
                      <button 
                        className="delete-btn"
                        onClick={() => {
                          alert('삭제 버튼 클릭됨!');
                          console.log('🗑️ 삭제 버튼 클릭됨 - 간단 테스트');
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  });

  // 파일 변경 핸들러
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  }, []);

  // 파일 삭제 핸들러
  const handleRemoveFile = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Rating과 동일한 방식으로, bodySizeList가 변경될 때마다 고유한 Size Unit 목록을 생성합니다.
  const bodySizeUnits = useMemo(() => {
    console.log('🔍 bodySizeUnits 생성 시작 - bodySizeList 길이:', bodySizeList?.length);
    console.log('🔍 bodySizeList 첫 번째 항목:', bodySizeList?.[0]);
    
    if (!bodySizeList || bodySizeList.length === 0) {
      console.log('❌ bodySizeList가 비어있음');
      return [];
    }
    
    const unitMap = new Map<string, string>();
    bodySizeList.forEach((item, index) => {
      if (index < 3) { // 처음 3개만 로그 출력
        console.log(`🔍 item[${index}]:`, item);
      }
      
      // item.sizeUnitCode와 item.sizeUnit이 존재하는지 확인
      if (item.sizeUnitCode && item.sizeUnit && !unitMap.has(item.sizeUnitCode)) {
        unitMap.set(item.sizeUnitCode, item.sizeUnit);
        console.log(`✅ Unit 추가: ${item.sizeUnitCode} -> ${item.sizeUnit}`);
      } else {
        console.log(`❌ Unit 추가 실패: sizeUnitCode=${item.sizeUnitCode}, sizeUnit=${item.sizeUnit}`);
      }
    });
    
    // Rating과 동일한 { code, name } 형태로 반환합니다.
    const units = Array.from(unitMap, ([code, name]) => ({ code, name }));
    console.log('🔍 생성된 bodySizeUnits:', units);
    console.log('🔍 bodySizeUnits 길이:', units.length);
    
    const sortedUnits = units.sort((a, b) => customSort(a.name, b.name));
    console.log('🔍 정렬된 bodySizeUnits:', sortedUnits);
    
    return sortedUnits;
  }, [bodySizeList]);

  // Rating과 동일한 방식으로, 선택된 Size Unit에 해당하는 Size 목록을 필터링합니다.
  const filteredSizeList = useMemo(() => {
    if (!currentValve || !currentValve.body.sizeUnit) { // sizeUnit은 이제 코드입니다.
      return [];
    }
    return bodySizeList.filter(item => item.sizeUnitCode === currentValve.body.sizeUnit);
  }, [currentValve, bodySizeList]);

  // Size 섹션 디버깅을 위한 useEffect
  useEffect(() => {
    if (currentValve) {
      console.log('🔍 Size 섹션 상태 확인:', {
        hasCurrentValve: !!currentValve,
        bodySizeUnits: bodySizeUnits,
        filteredSizeList: filteredSizeList,
        currentSizeUnit: currentValve?.body?.sizeUnit,
        currentSize: currentValve?.body?.size
      });
    }
  }, [currentValve, bodySizeUnits, filteredSizeList]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    
    // 선택된 고객 정보 가져오기
    const customerStr = localStorage.getItem('selectedCustomer');
    if (customerStr) {
      setSelectedCustomer(JSON.parse(customerStr));
    }

    // readonly 쿼리 파라미터 확인
    const readonlyParam = searchParams.get('readonly');
    console.log('NewEstimateRequestPage - readonlyParam:', readonlyParam);
    console.log('NewEstimateRequestPage - searchParams:', Object.fromEntries(searchParams.entries()));
    
    if (readonlyParam === 'true') {
      setIsReadOnly(true);
      console.log('NewEstimateRequestPage - isReadOnly set to true');
    } else {
      setIsReadOnly(false);
      console.log('NewEstimateRequestPage - isReadOnly set to false');
    }
  }, [searchParams]);

  return (
    <div className="new-estimate-request-page dashboard-page">
      {/* 헤더 */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← {isReadOnly ? '견적요청 조회' : '견적요청'}
        </button>
        <h1>{isReadOnly ? '견적 상세 조회' : '견적 요청'}</h1>

      </div>

      {/* 프로젝트 정보 */}
      <div className="status-section">
        <div className="project-group">
          <label>프로젝트명:</label>
          <input 
            type="text" 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="프로젝트명을 입력하세요"
            className="project-input" 
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      {/* 상단 2열 패널: 견적 상세 정보 + 관리 첨부파일 */}
      <div className="top-two-panel">
        {/* 견적 상세 정보 */}
        <div className="mini-card estimate-summary">
          <div className="mini-card-header">견적 세부 정보</div>
          <div className="mini-card-body summary-grid">
            <div className="summary-item"><span className="label">견적번호</span><strong className="value">{tempEstimateNo || '-'}</strong></div>
            <div className="summary-item"><span className="label">상태</span><strong className="value">{uiStatusText}</strong></div>
            <div className="summary-item"><span className="label">회사명</span><strong className="value">{selectedCustomer?.companyName || selectedCustomer?.name || '-'}</strong></div>
            <div className="summary-item"><span className="label">수량</span><strong className="value">{totalQty}</strong></div>
            <div className="summary-item"><span className="label">요청자</span><strong className="value">{currentUser?.name || currentUser?.userName || '-'}</strong></div>
            <div className="summary-item"><span className="label">요청일자</span><strong className="value">{new Date().toISOString().slice(0,10).replaceAll('-','.')}</strong></div>
            <div className="summary-item"><span className="label">담당자</span><strong className="value">-</strong></div>
            <div className="summary-item"><span className="label">완료일자</span><strong className="value">-</strong></div>
          </div>
        </div>

        {/* 관리 첨부파일 (고객용 다운로드) */}
        <div className="mini-card manager-files">
          <div className="mini-card-header">관리 첨부파일</div>
          <div className="mini-card-body">
            {/* 상태별 안내/표시 */}
            {(() => {
              // 완료/주문만 파일 표시, 그 외 상태는 안내 문구
              // 현재 페이지는 신규/요청 흐름이라 백엔드 status가 없으므로, 간단한 텍스트 기준으로 분기
              const statusCode = backendStatus;
              if (statusCode === 4 || statusCode === 5) {
                return (
                  managerAttachments && managerAttachments.length > 0 ? (
                    <ul className="mini-file-list">
                      {managerAttachments.map((f: any) => (
                        <li key={f.attachmentID ?? `${f.fileName}-${f.filePath}`}
                            className="mini-file-item"
                            title={f.fileName}>
                          <span className="name">{f.fileName}</span>
                          <button className="btn btn-link btn-xs" onClick={() => handleDownloadManagerFile(f)}>다운</button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mini-empty">파일 없음</div>
                  )
                );
              }
              if (statusCode === 3) {
                return <div className="mini-empty">담당자 배정되었습니다. 견적서 작성중입니다.</div>;
              }
              // 1, 2 또는 상태값이 없을 때 기본 문구
              return <div className="mini-empty">견적 요청서 작성을 먼저 부탁드립니다. 이후 담당자 배정 도와드리겠습니다.</div>;
            })()}
          </div>
        </div>
      </div>

      <div className="main-content-detail">
        <div className="steps-container">
          {/* Step 1, 2, 3 통합 섹션 */}
          <div className="step-section">
            <div className="step-header">
              <h3>견적 상세 정보</h3>
            </div>
            
            {/* Step 1: Type 선정 */}
            <div className="step-subsection">
              <h4>Step 1: Type 선정</h4>
              <p className="step-description-req">견적에 필요한 밸브 타입을 선택하고 관리합니다.</p>
              <div className="type-header">
                <div className="type-actions">
                  <button onClick={handleAddType} disabled={isReadOnly}>추가</button>
                  <button onClick={() => selectedType && handleRemoveType(types.findIndex(type => type.id === selectedType))} disabled={isReadOnly}>삭제</button>
                </div>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTypeDragEnd}
              >
                <SortableContext
                  items={types.map(item => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {types.map((item, index) => (
                    <SortableItem key={item.id} id={item.id}>
                      <div 
                        className={`type-item ${selectedType === item.id ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedType(item.id);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        style={{ 
                          cursor: 'pointer', 
                          userSelect: 'none',
                          pointerEvents: 'auto'
                        }}
                      >
                        <span>{item.name} ({valves.filter(valve => valve.body.type === item.name).reduce((sum, valve) => sum + valve.qty, 0)})</span>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
              
              {/* 드롭다운을 TypeSection 안에 렌더링 */}
              {showValveDropdown && (
                <div className="valve-dropdown" style={{ 
                  position: 'relative',
                  backgroundColor: 'white', 
                  border: '2px solid #007bff',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  marginTop: '5px'
                }}>
                  {bodyValveList.map((valve) => (
                    <div
                      key={valve.valveSeriesCode}
                      onClick={() => handleValveSelect(valve)}
                      style={{ 
                        padding: '8px 12px', 
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee',
                        fontSize: '14px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      {valve.valveSeries}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: TagNo 추가 */}
            <div className="step-subsection">
              <h4>Step 2: TagNo 추가</h4>
              <p className="step-description-req">선택된1 타입에 따라 TagNo를 추가하고 관리합니다.</p>
              {ValveSection()}
            </div>

            {/* Step 3: 상세사양 입력 */}
            <div className="step-subsection">
              <h4>Step 3: 상세사양 입력</h4>
              <p className="step-description-req">BODY, Trim, ACT, Accessory의 상세 사양을 입력합니다.</p>
              {SpecificationSection()}
            </div>
          </div>

          {/* 기타요청사항 + 첨부파일 (2열 컴팩트) */}
          <div className="step-section compact-two-panel">
            <div className="compact-box other-requests-compact">
              <CustomerRequirementComponent
                value={customerRequirement}
                onChange={setCustomerRequirement}
                isReadOnly={isReadOnly}
              />
          </div>

            <div className="compact-box attachments-compact">
              <span className="compact-label">첨부파일</span>
              <div className="file-upload-container compact">
                <input
                  id="file-upload"
                  name="fileUpload"
                  type="file"
                  multiple 
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(e.target.files);
                    }
                  }}
                  accept=".pdf,.xls,.xlsx,.doc,.docx,.hwp,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.txt,.zip,.rar,.7z"
                  style={{ display: 'none' }}
                />
                <button 
                  className="upload-btn compact"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploadingFiles}
                >
                  {uploadingFiles ? '업로드 중...' : '파일 선택'}
                </button>
                <span className="file-count">{attachments?.length || 0}개</span>
              </div>
              {/* 상단 요약 영역에서도 파일명 간단 표시 */}
              {attachments && attachments.length > 0 && (
                <ul className="compact-file-list">
                  {attachments.slice(0, 5).map((f: any, idx: number) => (
                    <li key={(f.id || f.uniqueId || f.attachmentId || idx) + '-compact'} title={f.name}>
                      {f.isPending ? '⏳ ' : ''}{f.name}
                    </li>
                  ))}
                  {attachments.length > 5 && (
                    <li className="more">외 {attachments.length - 5}개…</li>
                  )}
                </ul>
              )}
            </div>
          </div>

          {/* 하단 관리 첨부파일 섹션 제거됨 */}
        </div>
      </div>

      {/* 하단 액션 버튼들 */}
      {!isReadOnly ? (
        <div className="bottom-actions">
          <div className="action-buttons">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard/estimate-requests')}
            >
              목록으로
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleSaveDraft}
            >
              임시저장
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleSubmitEstimate}
            >
              견적요청
            </button>
          </div>
        </div>
      ) : (
        <div className="bottom-actions">
          <div className="action-buttons">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard/estimate-inquiry')}
            >
              목록으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewEstimateRequestPage; 