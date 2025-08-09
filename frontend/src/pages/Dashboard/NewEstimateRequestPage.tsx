import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface ValveData {
  id: string;  // 드래그앤드롭용 고유 ID
  tagNo: string;
  qty: number;
  order: number;  // 순서 정보
  sheetID: number;  // DB의 SheetID와 연결
  fluid: {
    medium: string;
    fluid: string;
    density: string;
    molecular: string;
    t1: { max: number; normal: number; min: number; unit: string; };
    p1: { max: number; normal: number; min: number; unit: string; };
    p2: { max: number; normal: number; min: number; unit: string; };
    dp: { max: number; normal: number; min: number; unit: string; };
    qm: { max: number; normal: number; min: number; unit: string; };
    qn: { max: number; normal: number; min: number; unit: string; };
  };
  body: {
    type: string;
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
  // 라디오 버튼 상태들
  isQM: boolean;
  isP2: boolean;
  isN1: boolean;
  isDensity: boolean;

}

interface TypeData {
  id: string;
  name: string;
  count: number;
  order: number;
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
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void; 
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
      />
    </div>
  );
});

const NewEstimateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [tempEstimateNo, setTempEstimateNo] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [types, setTypes] = useState<TypeData[]>([]);
  const [valves, setValves] = useState<ValveData[]>([]);
  const [currentValve, setCurrentValve] = useState<ValveData | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [customerRequirement, setCustomerRequirement] = useState('');
  const [bodyValveList, setBodyValveList] = useState<BodyValveData[]>([]);
  const [showValveDropdown, setShowValveDropdown] = useState(false);
  const specSectionRef = useRef<HTMLDivElement>(null);
  const tagNoRef = useRef<HTMLInputElement>(null);

  // 현재 사용자 정보 가져오기
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

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
  }, []);

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

  // BodyValveList 가져오기
  const fetchBodyValveList = async () => {
    try {
      const response = await axios.get('/api/estimate/body-valve-list');
      setBodyValveList(response.data);
    } catch (error) {
      console.error('BodyValveList 가져오기 실패:', error);
      // 임시 데이터로 대체
      setBodyValveList([
        { valveSeries: '2-way Globe', valveSeriesCode: 'A' },
        { valveSeries: '3-way Globe', valveSeriesCode: 'B' },
        { valveSeries: 'Angle', valveSeriesCode: 'C' },
        { valveSeries: 'Hi-Performance Butterfly', valveSeriesCode: 'D' },
        { valveSeries: 'Segmental Ball', valveSeriesCode: 'E' },
        { valveSeries: 'Damper', valveSeriesCode: 'F' },
        { valveSeries: '2-Way Ball', valveSeriesCode: 'G' },
        { valveSeries: 'Gate Valve', valveSeriesCode: 'H' },
        { valveSeries: 'Electric Motor Globe', valveSeriesCode: 'I' },
        { valveSeries: 'Electric Motor Gate', valveSeriesCode: 'J' },
        { valveSeries: 'Diaphragm (Weir Type)', valveSeriesCode: 'K' },
        { valveSeries: '2-WAY GLOBE JAKET', valveSeriesCode: 'L' },
        { valveSeries: 'Float 2-Way Globe', valveSeriesCode: 'M' },
        { valveSeries: '3-Way Ball', valveSeriesCode: 'N' }
      ]);
    }
  };

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
    }
  }, []);

  // Type 추가/삭제 기능
  const handleAddType = useCallback(() => {
    setShowValveDropdown(true);
  }, []);

  const handleValveSelect = useCallback((valve: BodyValveData) => {
    // 중복 체크
    const isDuplicate = types.some(type => type.name === valve.valveSeries);
    if (isDuplicate) {
      alert('이미 추가된 Type입니다.');
      return;
    }

    const newType: TypeData = {
      id: `type-${Date.now()}`,
      name: valve.valveSeries,
      count: 0,
      order: types.length + 1
    };

    setTypes(prev => [...prev, newType]);
    setShowValveDropdown(false);
  }, [types]);

  const handleDeleteType = useCallback((typeId: string) => {
    setTypes(prev => prev.filter(type => type.id !== typeId));
    if (selectedType === typeId) {
      setSelectedType('');
    }
  }, [selectedType]);

  // Valve 드래그앤드롭 핸들러
  const handleValveDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setValves((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // order 업데이트
        return newItems.map((item, index) => ({
          ...item,
          order: index + 1
        }));
      });
    }
  }, []);

  // Valve 추가/삭제 기능
  const handleAddValve = useCallback(() => {
    if (!selectedType) {
      alert('먼저 Step 1에서 Type을 선택해주세요.');
      return;
    }

    const selectedTypeData = types.find(t => t.id === selectedType);
    if (!selectedTypeData) return;

    const newValve: ValveData = {
      id: `valve-${Date.now()}`,
      tagNo: `Tag-${String(getNextTagNo()).padStart(4, '0')}`, // 기본값이지만 사용자가 수정 가능
      qty: 0,
      order: valves.length + 1,
      sheetID: valves.length + 1,
      fluid: {
      medium: '',
        fluid: '',
        density: '',
        molecular: '',
        t1: { max: 0, normal: 0, min: 0, unit: '°C' },
        p1: { max: 0, normal: 0, min: 0, unit: 'Mpa(g)' },
        p2: { max: 0, normal: 0, min: 0, unit: 'Mpa(g)' },
        dp: { max: 0, normal: 0, min: 0, unit: '-' },
        qm: { max: 0, normal: 0, min: 0, unit: 'm³/h' },
        qn: { max: 0, normal: 0, min: 0, unit: 'm³/h' }
      },
      body: {
        type: selectedTypeData.name,
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
        positioner: { type: '', exists: false },
        explosionProof: '',
        transmitter: { type: '', exists: false },
        solenoidValve: false,
        limitSwitch: false,
        airSet: false,
        volumeBooster: false,
        airOperatedValve: false,
        lockupValve: false,
        snapActingRelay: false
      },
      // 라디오 버튼 상태들
      isQM: false,
      isP2: false,
      isN1: false,
      isDensity: false
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
  const [bodySizeList, setBodySizeList] = useState<any[]>([]);
  const [bodyMatList, setBodyMatList] = useState<any[]>([]);
  const [trimMatList, setTrimMatList] = useState<any[]>([]);
  const [trimOptionList, setTrimOptionList] = useState<any[]>([]);
  const [bodyRatingList, setBodyRatingList] = useState<any[]>([]);

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
    // UI에서 이미 코드를 선택하므로 그대로 반환
    return name;
  };
  
  // 첨부파일 관련 상태
  const [fileAttachments, setFileAttachments] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // 임시 저장할 파일들

  const handleDeleteValve = useCallback((valveId: string) => {
    setValves(prev => prev.filter(valve => valve.id !== valveId));
    if (currentValve?.id === valveId) {
      setCurrentValve(null);
    }
  }, [currentValve]);

    // 첨부파일 업로드 함수 (임시 저장)
  const handleFileUpload = useCallback(async (files: FileList) => {
    setUploadingFiles(true);
    const newFiles: File[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        newFiles.push(file);
      }

      // 임시 파일 목록에 추가
      setPendingFiles(prev => [...prev, ...newFiles]);
      
      // 임시 첨부파일 목록에 추가 (UI 표시용)
      const newAttachments = newFiles.map(file => ({
        fileName: file.name,
        fileSize: file.size,
        uniqueId: Date.now() + Math.random(),
        isPending: true // 임시 파일임을 표시
      }));

      setFileAttachments(prev => [...prev, ...newAttachments]);
    } catch (error: any) {
      console.error('파일 임시 저장 실패:', error);
      alert('파일 임시 저장에 실패했습니다.');
    } finally {
      setUploadingFiles(false);
    }
  }, []);

  // 첨부파일 삭제 함수 (임시 파일과 업로드된 파일 구분)
  const handleDeleteAttachment = useCallback(async (uniqueId: number, filePath?: string) => {
    try {
      // 임시 파일인지 확인
      const attachment = fileAttachments.find(att => att.uniqueId === uniqueId);
      
      if (attachment?.isPending) {
        // 임시 파일인 경우 pendingFiles에서도 제거
        setPendingFiles(prev => prev.filter(file => file.name !== attachment.fileName));
      } else if (filePath) {
        // 업로드된 파일인 경우 서버에서 삭제
        await axios.delete('/api/estimate/attachments/file', {
          data: { filePath: filePath }
        });
      }
      
      // 로컬 상태에서 삭제
      setFileAttachments(prev => prev.filter(att => att.uniqueId !== uniqueId));
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      // 서버 삭제 실패해도 로컬에서는 삭제
      setFileAttachments(prev => prev.filter(att => att.uniqueId !== uniqueId));
    }
  }, [fileAttachments]);

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

  // 페이지 진입 시 데이터 가져오기
  useEffect(() => {
    fetchBodyValveList();
    fetchMasterData();
    
    // 페이지를 벗어날 때 정리하는 이벤트 리스너
    const handleBeforeUnload = () => {
      // TempEstimateNo가 생성되었지만 임시저장되지 않은 경우 정리
      if (tempEstimateNo && !localStorage.getItem(`saved_${tempEstimateNo}`)) {
        // 동기적으로 정리 (페이지가 닫히기 전에)
        navigator.sendBeacon(`http://localhost:5135/api/estimate/sheets/${tempEstimateNo}`);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tempEstimateNo]);

  // 마스터 데이터 가져오기
  const fetchMasterData = async () => {
    try {
      const [sizeRes, matRes, trimMatRes, optionRes, ratingRes] = await Promise.all([
        axios.get('/api/estimate/body-size-list'),
        axios.get('/api/estimate/body-mat-list'),
        axios.get('/api/estimate/trim-mat-list'),
        axios.get('/api/estimate/trim-option-list'),
        axios.get('/api/estimate/body-rating-list')
      ]);
      
      setBodySizeList(sizeRes.data);
      setBodyMatList(matRes.data);
      setTrimMatList(trimMatRes.data);
      setTrimOptionList(optionRes.data);
      setBodyRatingList(ratingRes.data);
    } catch (error) {
      console.error('마스터 데이터 가져오기 실패:', error);
    }
  };

  // TempEstimateNo 생성
  const generateTempEstimateNo = async () => {
    try {
      const response = await axios.post('http://localhost:5135/api/estimate/generate-temp-no');
      setTempEstimateNo(response.data.tempEstimateNo);
    } catch (error) {
      console.error('TempEstimateNo 생성 실패:', error);
    }
  };

  // 임시저장 기능
  const handleSaveDraft = async () => {
    // TempEstimateNo가 없으면 먼저 생성
    let currentTempEstimateNo = tempEstimateNo;
    if (!currentTempEstimateNo) {
      try {
        const response = await axios.post('http://localhost:5135/api/estimate/generate-temp-no');
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
      const saveData = {
        TypeSelections: types.map((type, typeIndex) => ({
          Type: type.name,
          Valves: valves
            .filter(valve => valve.body.type === type.name)
            .map((valve, index) => ({
              ValveName: valve.tagNo,
              TagNos: [{
                SheetNo: valve.order,
                Tagno: valve.tagNo,
                Qty: valve.qty,
                Medium: valve.fluid.medium,
                Fluid: valve.fluid.fluid,
                IsQM: valve.fluid.qm.max > 0,
                QMUnit: valve.fluid.qm.unit,
                QMMax: valve.fluid.qm.max,
                QMNor: valve.fluid.qm.normal,
                QMMin: valve.fluid.qm.min,
                QNUnit: valve.fluid.qn.unit,
                QNMax: valve.fluid.qn.max,
                QNNor: valve.fluid.qn.normal,
                QNMin: valve.fluid.qn.min,
                IsP2: valve.fluid.p2.max > 0,
                InletPressureUnit: valve.fluid.p1.unit,
                InletPressureMaxQ: valve.fluid.p1.max,
                InletPressureNorQ: valve.fluid.p1.normal,
                InletPressureMinQ: valve.fluid.p1.min,
                OutletPressureUnit: valve.fluid.p2.unit,
                OutletPressureMaxQ: valve.fluid.p2.max,
                OutletPressureNorQ: valve.fluid.p2.normal,
                OutletPressureMinQ: valve.fluid.p2.min,
                DifferentialPressureUnit: valve.fluid.dp.unit,
                DifferentialPressureMaxQ: valve.fluid.dp.max,
                DifferentialPressureNorQ: valve.fluid.dp.normal,
                DifferentialPressureMinQ: valve.fluid.dp.min,
                InletTemperatureUnit: valve.fluid.t1.unit,
                InletTemperatureQ: valve.fluid.t1.max,
                InletTemperatureNorQ: valve.fluid.t1.normal,
                InletTemperatureMinQ: valve.fluid.t1.min,
                DensityUnit: 'kg/m³',
                Density: parseFloat(valve.fluid.density) || 0,
                MolecularWeightUnit: 'g/mol',
                MolecularWeight: parseFloat(valve.fluid.molecular) || 0,
                BodySizeUnit: valve.body.sizeUnit || null,
                BodySize: getBodySizeCode(valve.body.size, valve.body.sizeUnit),
                BodyMat: getBodyMatCode(valve.body.materialBody),
                TrimMat: getTrimMatCode(valve.body.materialTrim),
                TrimOption: getTrimOptionCode(valve.body.option),
                BodyRating: getBodyRatingCode(valve.body.rating),
                ActType: valve.actuator.type,
                IsHW: valve.actuator.hw === 'Yes',
                IsPositioner: valve.accessory.positioner.exists,
                PositionerType: valve.accessory.positioner.type,
                ExplosionProof: valve.accessory.explosionProof,
                IsTransmitter: valve.accessory.transmitter.exists,
                IsSolenoid: valve.accessory.solenoidValve,
                IsLimSwitch: valve.accessory.limitSwitch,
                IsAirSet: valve.accessory.airSet,
                IsVolumeBooster: valve.accessory.volumeBooster,
                IsAirOperated: valve.accessory.airOperatedValve,
                IsLockUp: valve.accessory.lockupValve,
                IsSnapActingRelay: valve.accessory.snapActingRelay
              }]
            }))
        })),
        Project: projectName,
        CustomerRequirement: customerRequirement,
        CustomerID: selectedCustomer?.userID || currentUser?.userId || 'admin', // 선택된 고객 ID 또는 현재 사용자 ID
        WriterID: currentUser?.userId || 'admin', // 현재 로그인한 사용자 ID
        Attachments: []
      };

      console.log('전송할 데이터:', JSON.stringify(saveData, null, 2));
      
      // 임시 파일들을 업로드
      if (pendingFiles.length > 0) {
        console.log('임시 파일들을 업로드합니다...');
        for (const file of pendingFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('uploadUserID', 'currentUser');
          
          await axios.post(
            `http://localhost:5135/api/estimate/sheets/${currentTempEstimateNo}/attachments?uploadUserID=currentUser`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        }
        
        // 임시 파일 목록 초기화
        setPendingFiles([]);
        
        // fileAttachments에서 isPending 플래그 제거
        setFileAttachments(prev => prev.map(att => ({ ...att, isPending: false })));
      }
      
      await axios.post(`http://localhost:5135/api/estimate/sheets/${currentTempEstimateNo}/save-draft`, saveData);
      // 임시저장 성공 시 localStorage에 플래그 설정
      localStorage.setItem(`saved_${currentTempEstimateNo}`, 'true');
      alert('임시저장이 완료되었습니다.');
    } catch (error) {
      console.error('임시저장 실패:', error);
      alert('임시저장에 실패했습니다.');
    }
  };

  // 견적요청 기능
  const handleSubmitEstimate = async () => {
    // TempEstimateNo가 없으면 먼저 생성
    let currentTempEstimateNo = tempEstimateNo;
    if (!currentTempEstimateNo) {
      try {
        const response = await axios.post('http://localhost:5135/api/estimate/generate-temp-no');
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
      const submitData = {
        TypeSelections: types.map((type, typeIndex) => ({
          Type: type.name,
          Valves: valves
            .filter(valve => valve.body.type === type.name)
            .map((valve, index) => ({
              ValveName: valve.tagNo,
              TagNos: [{
                SheetNo: valve.order,
                Tagno: valve.tagNo,
                Qty: valve.qty,
                Medium: valve.fluid.medium,
                Fluid: valve.fluid.fluid,
                IsQM: valve.fluid.qm.max > 0,
                QMUnit: valve.fluid.qm.unit,
                QMMax: valve.fluid.qm.max,
                QMNor: valve.fluid.qm.normal,
                QMMin: valve.fluid.qm.min,
                QNUnit: valve.fluid.qn.unit,
                QNMax: valve.fluid.qn.max,
                QNNor: valve.fluid.qn.normal,
                QNMin: valve.fluid.qn.min,
                IsP2: valve.fluid.p2.max > 0,
                InletPressureUnit: valve.fluid.p1.unit,
                InletPressureMaxQ: valve.fluid.p1.max,
                InletPressureNorQ: valve.fluid.p1.normal,
                InletPressureMinQ: valve.fluid.p1.min,
                OutletPressureUnit: valve.fluid.p2.unit,
                OutletPressureMaxQ: valve.fluid.p2.max,
                OutletPressureNorQ: valve.fluid.p2.normal,
                OutletPressureMinQ: valve.fluid.p2.min,
                DifferentialPressureUnit: valve.fluid.dp.unit,
                DifferentialPressureMaxQ: valve.fluid.dp.max,
                DifferentialPressureNorQ: valve.fluid.dp.normal,
                DifferentialPressureMinQ: valve.fluid.dp.min,
                InletTemperatureUnit: valve.fluid.t1.unit,
                InletTemperatureQ: valve.fluid.t1.max,
                InletTemperatureNorQ: valve.fluid.t1.normal,
                InletTemperatureMinQ: valve.fluid.t1.min,
                DensityUnit: 'kg/m³',
                Density: parseFloat(valve.fluid.density) || 0,
                MolecularWeightUnit: 'g/mol',
                MolecularWeight: parseFloat(valve.fluid.molecular) || 0,
                BodySizeUnit: valve.body.sizeUnit || null,
                BodySize: getBodySizeCode(valve.body.size, valve.body.sizeUnit),
                BodyMat: getBodyMatCode(valve.body.materialBody),
                TrimMat: getTrimMatCode(valve.body.materialTrim),
                TrimOption: getTrimOptionCode(valve.body.option),
                BodyRating: getBodyRatingCode(valve.body.rating),
                ActType: valve.actuator.type,
                IsHW: valve.actuator.hw === 'Yes',
                IsPositioner: valve.accessory.positioner.exists,
                PositionerType: valve.accessory.positioner.type,
                ExplosionProof: valve.accessory.explosionProof,
                IsTransmitter: valve.accessory.transmitter.exists,
                IsSolenoid: valve.accessory.solenoidValve,
                IsLimSwitch: valve.accessory.limitSwitch,
                IsAirSet: valve.accessory.airSet,
                IsVolumeBooster: valve.accessory.volumeBooster,
                IsAirOperated: valve.accessory.airOperatedValve,
                IsLockUp: valve.accessory.lockupValve,
                IsSnapActingRelay: valve.accessory.snapActingRelay
              }]
            }))
        })),
        Project: projectName,
        CustomerRequirement: customerRequirement,
        StaffComment: '', // 직원 코멘트 추가
        CustomerID: selectedCustomer?.userID || currentUser?.userId || 'admin', // 선택된 고객 ID 또는 현재 사용자 ID
        WriterID: currentUser?.userId || 'admin' // 현재 로그인한 사용자 ID
      };

      // 임시 파일들을 업로드
      if (pendingFiles.length > 0) {
        console.log('임시 파일들을 업로드합니다...');
        for (const file of pendingFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('uploadUserID', 'currentUser');
          
          await axios.post(
            `http://localhost:5135/api/estimate/sheets/${currentTempEstimateNo}/attachments?uploadUserID=currentUser`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
        }
        
        // 임시 파일 목록 초기화
        setPendingFiles([]);
        
        // fileAttachments에서 isPending 플래그 제거
        setFileAttachments(prev => prev.map(att => ({ ...att, isPending: false })));
      }
      
      await axios.post(`http://localhost:5135/api/estimate/sheets/${currentTempEstimateNo}/submit`, submitData);
      // 견적요청 성공 시 localStorage에 플래그 설정
      localStorage.setItem(`saved_${currentTempEstimateNo}`, 'true');
      alert('견적요청이 완료되었습니다.');
      navigate('/estimate-requests'); // 목록으로 이동
    } catch (error) {
      console.error('견적요청 실패:', error);
      alert('견적요청에 실패했습니다.');
    }
  };

  const handleValveClick = (valve: ValveData) => {
    setCurrentValve(valve);
    // Step 3로 스크롤 이동
    setTimeout(() => {
      if (specSectionRef.current) {
        specSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
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

  const TypeSection = () => (
    <div className="type-section">
      <div className="type-header">
        <h3>Step 1: Type 선정</h3>
        <div className="type-actions">
          <button onClick={handleAddType}>추가</button>
          <button onClick={() => selectedType && handleDeleteType(selectedType)}>삭제</button>
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
          {types.map((item) => (
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
          <h3>Step 2: TagNo 추가</h3>
          <div className="valve-actions">
            <button 
              onClick={handleAddValve} 
              disabled={!selectedType}
            >
              추가
          </button>
            <button 
              onClick={() => currentValve && handleDeleteValve(currentValve.id)}
              disabled={!currentValve}
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
      if (tagNoRef.current) {
        tagNoRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    return (
      <div className="spec-section">
        <h3>Step 3: 상세사양 입력</h3>
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
                <h3>Fluid</h3>
                  <div className="fluid-row">
                    <label>Medium:</label>
                    <input
                      id="fluid-medium" 
                      name="fluidMedium" 
                      type="text"
                      value={currentValve.fluid.medium}
                      onChange={(e) => handleFluidFieldChange('medium', e.target.value)}
                    />
                  </div>
                  
                  <div className="fluid-row">
                    <label>Fluid:</label>
                    <select 
                      id="fluid-type" 
                      name="fluidType"
                      value={currentValve.fluid.fluid}
                      onChange={(e) => handleFluidFieldChange('fluid', e.target.value)}
                    >
                      <option value="">선택하세요</option>
                      {fluidOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="fluid-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ fontSize: '10px' }}>
                        <label><input type="radio" name="densityType" value="Density" checked={currentValve.isDensity} onChange={(e) => handleRadioChange('isDensity', e.target.checked)} /></label>
                </div>
                      <label>Density:</label>
                      <input 
                        id="fluid-density" 
                        name="fluidDensity" 
                        type="text" 
                        value={currentValve.fluid.density}
                        onChange={(e) => handleFluidFieldChange('density', e.target.value)}
                        placeholder={!currentValve.isDensity ? 'Molecular 선택 시 사용 불가' : ''}
                        disabled={!currentValve.isDensity}
                        style={{ 
                          width: '150px',
                          backgroundColor: !currentValve.isDensity ? '#f0f0f0' : 'white',
                          color: !currentValve.isDensity ? '#999' : 'black',
                          border: !currentValve.isDensity ? '1px solid #ccc' : '1px solid #ddd',
                          opacity: !currentValve.isDensity ? 0.6 : 1
                        }}
                      />
              </div>
            </div>

                  <div className="fluid-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ fontSize: '10px' }}>
                        <label><input type="radio" name="densityType" value="Molecular" checked={!currentValve.isDensity} onChange={(e) => handleRadioChange('isDensity', !e.target.checked)} /></label>
              </div>
                      <label>Molecular:</label>
                                <input
                        id="fluid-molecular" 
                        name="fluidMolecular" 
                                  type="text"
                        value={currentValve.fluid.molecular}
                        onChange={(e) => handleFluidFieldChange('molecular', e.target.value)}
                        placeholder={currentValve.isDensity ? 'Density 선택 시 사용 불가' : ''}
                        disabled={currentValve.isDensity}
                        style={{ 
                          width: '150px',
                          backgroundColor: currentValve.isDensity ? '#f0f0f0' : 'white',
                          color: currentValve.isDensity ? '#999' : 'black',
                          border: currentValve.isDensity ? '1px solid #ccc' : '1px solid #ddd',
                          opacity: currentValve.isDensity ? 0.6 : 1
                        }}
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
                        <td><input id="t1-max" name="t1Max" type="number" value={currentValve.fluid.t1.max === 0 ? '' : currentValve.fluid.t1.max} onChange={(e) => handleFluidConditionChange('t1', 'max', parseFloat(e.target.value) || 0)} /></td>
                        <td><input id="t1-normal" name="t1Normal" type="number" value={currentValve.fluid.t1.normal === 0 ? '' : currentValve.fluid.t1.normal} onChange={(e) => handleFluidConditionChange('t1', 'normal', parseFloat(e.target.value) || 0)} /></td>
                        <td><input id="t1-min" name="t1Min" type="number" value={currentValve.fluid.t1.min === 0 ? '' : currentValve.fluid.t1.min} onChange={(e) => handleFluidConditionChange('t1', 'min', parseFloat(e.target.value) || 0)} /></td>
                        <td>
                          <select 
                            id="t1-unit" 
                            name="t1Unit"
                            value={currentValve.fluid.t1.unit}
                            onChange={(e) => handleFluidConditionChange('t1', 'unit', e.target.value)}
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
                        <td><input id="p1-max" name="p1Max" type="number" value={currentValve.fluid.p1.max === 0 ? '' : currentValve.fluid.p1.max} onChange={(e) => handleFluidConditionChange('p1', 'max', parseFloat(e.target.value) || 0)} /></td>
                        <td><input id="p1-normal" name="p1Normal" type="number" value={currentValve.fluid.p1.normal === 0 ? '' : currentValve.fluid.p1.normal} onChange={(e) => handleFluidConditionChange('p1', 'normal', parseFloat(e.target.value) || 0)} /></td>
                        <td><input id="p1-min" name="p1Min" type="number" value={currentValve.fluid.p1.min === 0 ? '' : currentValve.fluid.p1.min} onChange={(e) => handleFluidConditionChange('p1', 'min', parseFloat(e.target.value) || 0)} /></td>
                        <td>
                          <select 
                            id="p1-unit" 
                            name="p1Unit"
                            value={currentValve.fluid.p1.unit}
                            onChange={(e) => handleFluidConditionChange('p1', 'unit', e.target.value)}
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
                              <label><input type="radio" name="p2Type" value="P2" checked={currentValve.isP2} onChange={(e) => handleRadioChange('isP2', e.target.checked)} /></label>
                            </div>
                            p2
                    </div>
                        </td>
                        <td><input id="p2-max" name="p2Max" type="number" value={currentValve.fluid.p2.max === 0 ? '' : currentValve.fluid.p2.max} onChange={(e) => handleFluidConditionChange('p2', 'max', parseFloat(e.target.value) || 0)} disabled={!currentValve.isP2} style={{ backgroundColor: !currentValve.isP2 ? '#f0f0f0' : 'white', color: !currentValve.isP2 ? '#999' : 'black', border: !currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isP2 ? 0.6 : 1 }} /></td>
                        <td><input id="p2-normal" name="p2Normal" type="number" value={currentValve.fluid.p2.normal === 0 ? '' : currentValve.fluid.p2.normal} onChange={(e) => handleFluidConditionChange('p2', 'normal', parseFloat(e.target.value) || 0)} disabled={!currentValve.isP2} style={{ backgroundColor: !currentValve.isP2 ? '#f0f0f0' : 'white', color: !currentValve.isP2 ? '#999' : 'black', border: !currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isP2 ? 0.6 : 1 }} /></td>
                        <td><input id="p2-min" name="p2Min" type="number" value={currentValve.fluid.p2.min === 0 ? '' : currentValve.fluid.p2.min} onChange={(e) => handleFluidConditionChange('p2', 'min', parseFloat(e.target.value) || 0)} disabled={!currentValve.isP2} style={{ backgroundColor: !currentValve.isP2 ? '#f0f0f0' : 'white', color: !currentValve.isP2 ? '#999' : 'black', border: !currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isP2 ? 0.6 : 1 }} /></td>
                        <td>
                          <select 
                            id="p2-unit" 
                            name="p2Unit"
                            value={currentValve.fluid.p2.unit}
                            onChange={(e) => handleFluidConditionChange('p2', 'unit', e.target.value)}
                            disabled={!currentValve.isP2}
                            style={{ backgroundColor: !currentValve.isP2 ? '#f0f0f0' : 'white', color: !currentValve.isP2 ? '#999' : 'black', border: !currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isP2 ? 0.6 : 1 }}
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
                              <label><input type="radio" name="dpType" value="DP" checked={!currentValve.isP2} onChange={(e) => handleRadioChange('isP2', !e.target.checked)} /></label>
            </div>
                            Δp
          </div>
                        </td>
                        <td><input id="dp-max" name="dpMax" type="number" value={currentValve.fluid.dp.max === 0 ? '' : currentValve.fluid.dp.max} onChange={(e) => handleFluidConditionChange('dp', 'max', parseFloat(e.target.value) || 0)} disabled={currentValve.isP2} style={{ backgroundColor: currentValve.isP2 ? '#f0f0f0' : 'white', color: currentValve.isP2 ? '#999' : 'black', border: currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isP2 ? 0.6 : 1 }} /></td>
                        <td><input id="dp-normal" name="dpNormal" type="number" value={currentValve.fluid.dp.normal === 0 ? '' : currentValve.fluid.dp.normal} onChange={(e) => handleFluidConditionChange('dp', 'normal', parseFloat(e.target.value) || 0)} disabled={currentValve.isP2} style={{ backgroundColor: currentValve.isP2 ? '#f0f0f0' : 'white', color: currentValve.isP2 ? '#999' : 'black', border: currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isP2 ? 0.6 : 1 }} /></td>
                        <td><input id="dp-min" name="dpMin" type="number" value={currentValve.fluid.dp.min === 0 ? '' : currentValve.fluid.dp.min} onChange={(e) => handleFluidConditionChange('dp', 'min', parseFloat(e.target.value) || 0)} disabled={currentValve.isP2} style={{ backgroundColor: currentValve.isP2 ? '#f0f0f0' : 'white', color: currentValve.isP2 ? '#999' : 'black', border: currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isP2 ? 0.6 : 1 }} /></td>
                        <td>
                          <select 
                            id="dp-unit" 
                            name="dpUnit"
                            value={currentValve.fluid.dp.unit}
                            onChange={(e) => handleFluidConditionChange('dp', 'unit', e.target.value)}
                            disabled={currentValve.isP2}
                            style={{ backgroundColor: currentValve.isP2 ? '#f0f0f0' : 'white', color: currentValve.isP2 ? '#999' : 'black', border: currentValve.isP2 ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isP2 ? 0.6 : 1 }}
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
                              <label><input type="radio" name="qmType" value="Qm" checked={currentValve.isQM} onChange={(e) => handleRadioChange('isQM', e.target.checked)} /></label>
                            </div>
                            qm
                          </div>
                        </td>
                        <td><input id="qm-max" name="qmMax" type="number" value={currentValve.fluid.qm.max === 0 ? '' : currentValve.fluid.qm.max} onChange={(e) => handleFluidConditionChange('qm', 'max', parseFloat(e.target.value) || 0)} disabled={!currentValve.isQM} style={{ backgroundColor: !currentValve.isQM ? '#f0f0f0' : 'white', color: !currentValve.isQM ? '#999' : 'black', border: !currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isQM ? 0.6 : 1 }} /></td>
                        <td><input id="qm-normal" name="qmNormal" type="number" value={currentValve.fluid.qm.normal === 0 ? '' : currentValve.fluid.qm.normal} onChange={(e) => handleFluidConditionChange('qm', 'normal', parseFloat(e.target.value) || 0)} disabled={!currentValve.isQM} style={{ backgroundColor: !currentValve.isQM ? '#f0f0f0' : 'white', color: !currentValve.isQM ? '#999' : 'black', border: !currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isQM ? 0.6 : 1 }} /></td>
                        <td><input id="qm-min" name="qmMin" type="number" value={currentValve.fluid.qm.min === 0 ? '' : currentValve.fluid.qm.min} onChange={(e) => handleFluidConditionChange('qm', 'min', parseFloat(e.target.value) || 0)} disabled={!currentValve.isQM} style={{ backgroundColor: !currentValve.isQM ? '#f0f0f0' : 'white', color: !currentValve.isQM ? '#999' : 'black', border: !currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isQM ? 0.6 : 1 }} /></td>
                        <td>
                          <select 
                            id="qm-unit" 
                            name="qmUnit"
                            value={currentValve.fluid.qm.unit}
                            onChange={(e) => handleFluidConditionChange('qm', 'unit', e.target.value)}
                            disabled={!currentValve.isQM}
                            style={{ backgroundColor: !currentValve.isQM ? '#f0f0f0' : 'white', color: !currentValve.isQM ? '#999' : 'black', border: !currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: !currentValve.isQM ? 0.6 : 1 }}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{ fontSize: '10px' }}>
                              <label><input type="radio" name="qnType" value="Qn" checked={!currentValve.isQM} onChange={(e) => handleRadioChange('isQM', !e.target.checked)} /></label>
                            </div>
                            qn
                          </div>
                        </td>
                        <td><input id="qn-max" name="qnMax" type="number" value={currentValve.fluid.qn.max === 0 ? '' : currentValve.fluid.qn.max} onChange={(e) => handleFluidConditionChange('qn', 'max', parseFloat(e.target.value) || 0)} disabled={currentValve.isQM} style={{ backgroundColor: currentValve.isQM ? '#f0f0f0' : 'white', color: currentValve.isQM ? '#999' : 'black', border: currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isQM ? 0.6 : 1 }} /></td>
                        <td><input id="qn-normal" name="qnNormal" type="number" value={currentValve.fluid.qn.normal === 0 ? '' : currentValve.fluid.qn.normal} onChange={(e) => handleFluidConditionChange('qn', 'normal', parseFloat(e.target.value) || 0)} disabled={currentValve.isQM} style={{ backgroundColor: currentValve.isQM ? '#f0f0f0' : 'white', color: currentValve.isQM ? '#999' : 'black', border: currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isQM ? 0.6 : 1 }} /></td>
                        <td><input id="qn-min" name="qnMin" type="number" value={currentValve.fluid.qn.min === 0 ? '' : currentValve.fluid.qn.min} onChange={(e) => handleFluidConditionChange('qn', 'min', parseFloat(e.target.value) || 0)} disabled={currentValve.isQM} style={{ backgroundColor: currentValve.isQM ? '#f0f0f0' : 'white', color: currentValve.isQM ? '#999' : 'black', border: currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isQM ? 0.6 : 1 }} /></td>
                        <td>
                          <select 
                            id="qn-unit" 
                            name="qnUnit"
                            value={currentValve.fluid.qn.unit}
                            onChange={(e) => handleFluidConditionChange('qn', 'unit', e.target.value)}
                            disabled={currentValve.isQM}
                            style={{ backgroundColor: currentValve.isQM ? '#f0f0f0' : 'white', color: currentValve.isQM ? '#999' : 'black', border: currentValve.isQM ? '1px solid #ccc' : '1px solid #ddd', opacity: currentValve.isQM ? 0.6 : 1 }}
                          >
                            <option value="m³/h">m³/h</option>
                            <option value="GPM(US)">GPM(US)</option>
                          </select>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                  
                <div className="body-section">
                <h4>BODY & ACTUATOR</h4>
                <table>
                  <tbody>
                    <tr>
                      <td>Type</td>
                      <td>
                            <input
                          id="body-type"
                          name="bodyType"
                              type="text"
                          value={currentValve.body.type}
                          readOnly
                        />
                      </td>
                    </tr>
                    <tr>
                      <td>Size</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select 
                            id="body-size-unit"
                            name="bodySizeUnit"
                            value={currentValve.body.sizeUnit}
                            onChange={(e) => {
                              handleBodyChange('sizeUnit', e.target.value);
                              // 단위가 변경되면 size 초기화
                              handleBodyChange('size', '');
                            }}
                            style={{ width: '80px' }}
                          >
                            <option value="">단위</option>
                            <option value="inch">inch</option>
                            <option value="A">A</option>
                          </select>
                          <select 
                            id="body-size"
                            name="bodySize"
                            value={currentValve.body.size}
                            onChange={(e) => handleBodyChange('size', e.target.value)}
                            disabled={!currentValve.body.sizeUnit}
                          >
                            <option value="">선택하세요</option>
                            {currentValve.body.sizeUnit && bodySizeList
                              .filter(item => item.sizeUnit === currentValve.body.sizeUnit)
                              .map(item => (
                                <option key={item.bodySizeCode} value={item.bodySizeCode}>
                                  {item.bodySize}
                                </option>
                              ))}
                          </select>
                          </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Material Body</td>
                      <td>
                        <select 
                          id="body-material-body"
                          name="bodyMaterialBody"
                          value={currentValve.body.materialBody}
                          onChange={(e) => handleBodyChange('materialBody', e.target.value)}
                        >
                          <option value="">선택하세요</option>
                          {bodyMatList.map(item => (
                            <option key={item.bodyMatCode} value={item.bodyMatCode}>
                              {item.bodyMat}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Material Trim</td>
                      <td>
                        <select 
                          id="body-material-trim"
                          name="bodyMaterialTrim"
                          value={currentValve.body.materialTrim}
                          onChange={(e) => handleBodyChange('materialTrim', e.target.value)}
                        >
                          <option value="">선택하세요</option>
                          {trimMatList.map(item => (
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
                        <select 
                          id="body-option"
                          name="bodyOption"
                          value={currentValve.body.option}
                          onChange={(e) => handleBodyChange('option', e.target.value)}
                        >
                          <option value="">선택하세요</option>
                          {trimOptionList.map(item => (
                            <option key={item.trimOptionCode} value={item.trimOptionCode}>
                              {item.trimOptionName}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>Rating</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select 
                            id="body-rating-unit"
                            name="bodyRatingUnit"
                            value={currentValve.body.ratingUnit}
                            onChange={(e) => {
                              handleBodyChange('ratingUnit', e.target.value);
                              // 단위가 변경되면 rating 초기화
                              handleBodyChange('rating', '');
                            }}
                            style={{ width: '100px' }}
                          >
                            <option value="">단위</option>
                            <option value="JIS/KS">JIS/KS</option>
                            <option value="ASME">ASME</option>
                            <option value="PN">PN</option>
                          </select>
                          <select 
                            id="body-rating"
                            name="bodyRating"
                            value={currentValve.body.rating}
                            onChange={(e) => handleBodyChange('rating', e.target.value)}
                            disabled={!currentValve.body.ratingUnit}
                          >
                            <option value="">선택하세요</option>
                            {currentValve.body.ratingUnit && bodyRatingList
                              .filter(item => item.ratingUnit === currentValve.body.ratingUnit)
                              .map(item => (
                                <option key={item.ratingCode} value={item.ratingCode}>
                                  {item.ratingName}
                                </option>
                              ))}
                          </select>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Actuator Type</td>
                      <td>
                        <select 
                          id="actuator-type"
                          name="actuatorType"
                          value={currentValve.actuator.type}
                          onChange={(e) => handleActuatorChange('type', e.target.value)}
                        >
                          <option value="">선택하세요</option>
                          {actuatorTypeOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <td>H/W</td>
                      <td>
                        <select 
                          id="actuator-hw"
                          name="actuatorHw"
                          value={currentValve.actuator.hw}
                          onChange={(e) => handleActuatorChange('hw', e.target.value)}
                        >
                          <option value="">선택하세요</option>
                          {hwOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                          value={currentValve.accessory.solenoidValve ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('solenoidValve', e.target.value === 'Yes')}
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
                          value={currentValve.accessory.limitSwitch ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('limitSwitch', e.target.value === 'Yes')}
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
                          value={currentValve.accessory.airSet ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('airSet', e.target.value === 'Yes')}
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
                          value={currentValve.accessory.volumeBooster ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('volumeBooster', e.target.value === 'Yes')}
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
                          value={currentValve.accessory.airOperatedValve ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('airOperatedValve', e.target.value === 'Yes')}
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
                          value={currentValve.accessory.lockupValve ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('lockupValve', e.target.value === 'Yes')}
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
                          value={currentValve.accessory.snapActingRelay ? 'Yes' : 'No'}
                          onChange={(e) => handleAccessoryChange('snapActingRelay', e.target.value === 'Yes')}
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
                             {fileAttachments.map((file, index) => (
                 <div key={index} className="file-item">
                   <div className="file-info">
                     <span className="file-name">{file.fileName}</span>
                     <span className="file-size">({(() => {
                       console.log('File size for', file.fileName, ':', file.fileSize, typeof file.fileSize);
                       const fileSize = parseInt(file.fileSize) || 0;
                       if (fileSize === 0) return '0.00';
                       const sizeInMB = fileSize / 1024 / 1024;
                       return sizeInMB.toFixed(2);
                     })()} MB)</span>
                   </div>
                   <div className="file-actions">
                <button 
                       className="delete-btn"
                       onClick={() => handleDeleteAttachment(file.uniqueId, file.filePath)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
          )}
      </div>
      </div>
    );
  });



  return (
    <div className="new-estimate-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>&lt;</button>
          <h2>견적요청</h2>
            </div>
        <div className="header-right">
          <input 
            id="project-name"
            name="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="프로젝트 명칭 대체 태풍수해복구"
          />
          <button className="save-btn" onClick={handleSaveDraft}>임시저장</button>
          <button className="submit-btn" onClick={handleSubmitEstimate}>견적요청</button>
        </div>
      </div>

      <div className="steps-section">
        <div className="steps-container">
          <TypeSection />
          {ValveSection()}
          {SpecificationSection()}
        </div>
      </div>

      <div className="attachment-section-container">
        <AttachmentSection />
      </div>

      <div className="requirement-section-container">
        <CustomerRequirementComponent 
          value={customerRequirement}
          onChange={setCustomerRequirement}
        />
      </div>
    </div>
  );
};

export default NewEstimateRequestPage; 