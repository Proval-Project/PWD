import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEstimateDetail, EstimateDetailResponseDto } from '../../api/estimateRequest';
import './DashboardPages.css';
import './EstimateDetailPage.css';

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

const EstimateDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { tempEstimateNo } = useParams<{ tempEstimateNo: string }>();
  
  // 상태 관리
  const [types, setTypes] = useState<TypeData[]>([]);
  const [valves, setValves] = useState<ValveData[]>([]);
  const [selectedValve, setSelectedValve] = useState<ValveData | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  
  // 마스터 데이터
  const [bodyValveList, setBodyValveList] = useState<BodyValveData[]>([]);
  const [bodySizeList, setBodySizeList] = useState<any[]>([]);
  const [bodyMatList, setBodyMatList] = useState<any[]>([]);
  const [trimMatList, setTrimMatList] = useState<any[]>([]);
  const [trimOptionList, setTrimOptionList] = useState<any[]>([]);
  const [bodyRatingList, setBodyRatingList] = useState<any[]>([]);
  
  // Step 3 마스터 데이터
  const [bodyBonnetList, setBodyBonnetList] = useState<any[]>([]);
  const [bodyConnectionList, setBodyConnectionList] = useState<any[]>([]);
  const [trimTypeList, setTrimTypeList] = useState<any[]>([]);
  const [trimSeriesList, setTrimSeriesList] = useState<any[]>([]);
  const [trimPortSizeList, setTrimPortSizeList] = useState<any[]>([]);
  const [trimFormList, setTrimFormList] = useState<any[]>([]);
  const [actTypeList, setActTypeList] = useState<any[]>([]);
  const [actSeriesList, setActSeriesList] = useState<any[]>([]);
  const [actSizeList, setActSizeList] = useState<any[]>([]);
  const [actHWList, setActHWList] = useState<any[]>([]);
  const [accTypeList, setAccTypeList] = useState<any[]>([]);
  const [accMakerList, setAccMakerList] = useState<any[]>([]);
  const [accModelList, setAccModelList] = useState<any[]>([]);
  
  // 기타 데이터
  const [otherRequests, setOtherRequests] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('견적요청');

  // ACC 섹션 선택 상태 관리
  const [accSelections, setAccSelections] = useState<{
    [key: string]: {
      modelCode: string;
      makerCode: string;
      specification: string;
    };
  }>({
    positioner: { modelCode: '', makerCode: '', specification: '' },
    solenoidValve: { modelCode: '', makerCode: '', specification: '' },
    limitSwitch: { modelCode: '', makerCode: '', specification: '' },
    airSet: { modelCode: '', makerCode: '', specification: '' },
    volumeBooster: { modelCode: '', makerCode: '', specification: '' },
    airOperatedValve: { modelCode: '', makerCode: '', specification: '' },
    lockUpValve: { modelCode: '', makerCode: '', specification: '' },
    snapActingRelay: { modelCode: '', makerCode: '', specification: '' }
  });

  // TagNo별 사용자 선택값 임시 저장 (TagNo 변경 시 복원용)
  const [tempSelections, setTempSelections] = useState<{
    [sheetID: number]: {
      body: any;
      trim: any;
      act: any;
      acc: any;
    };
  }>({});

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
      console.log(`${sheetID}의 선택값들을 임시 저장했습니다.`);
    }
  };

  // valve 선택 시 호출되는 함수
  const handleValveSelection = (valve: ValveData) => {
    console.log('선택된 valve의 sheetID:', valve.sheetID); // sheetID 로그 추가
    
    // 현재 선택된 valve가 있다면 선택값들을 저장
    if (selectedValve) {
      saveCurrentSelections(selectedValve.sheetID);
    }
    
    // 새로운 valve 선택
    setSelectedValve(valve);
    
    // 이 SheetID에 저장된 선택값이 있는지 확인
    if (tempSelections[valve.sheetID]) {
      // 저장된 선택값이 있음: 복원
      console.log(`${valve.sheetID}의 저장된 선택값을 복원합니다.`);
      restoreTempSelections(valve.sheetID);
    } else {
      // 저장된 선택값이 없음: DB에서 초기 데이터 로드
      console.log(`${valve.sheetID}의 초기 데이터를 DB에서 로드합니다.`);
      loadInitialSpecification(valve.sheetID);
    }
  };

                    // Body 섹션 선택 상태 관리
                  const [bodySelections, setBodySelections] = useState({
                    bonnetType: '',
                    materialBody: '',
                    sizeBodyUnit: '',
                    sizeBody: '',
                    ratingUnit: '',
                    rating: '',
                    connection: ''
                  });
                
                  // Trim 섹션 선택 상태 관리
                  const [trimSelections, setTrimSelections] = useState({
                    trimType: '',
                    trimSeries: '',
                    materialTrim: '',
                    sizePortUnit: '',
                    sizePort: '',
                    form: '',
                    option: '' // Trim Option 필드 추가
                  });
                
                  // ACT 섹션 선택 상태 관리
                  const [actSelections, setActSelections] = useState({
                    actionType: '',
                    series: '',
                    size: '',
                    hw: ''
                  });

  // 상태 및 프로젝트 정보
  const [projectName, setProjectName] = useState<string>('');

  // BodyValveList 가져오기
  const fetchBodyValveList = async () => {
    try {
      const response = await fetch('/api/estimate/body-valve-list');
      const data = await response.json();
      setBodyValveList(data);
    } catch (error) {
      console.error('BodyValveList 가져오기 실패:', error);
    }
  };

  // ACT Size 목록 가져오기
  const fetchActSizeList = async (actSeriesCode: string) => {
    try {
      console.log('fetchActSizeList 시작:', actSeriesCode);
      const response = await fetch(`http://localhost:5135/api/estimate/act-size-list?actSeriesCode=${actSeriesCode}`);
      const data = await response.json();
      console.log('ACT Size API 응답:', data);
      setActSizeList(data || []);
    } catch (error) {
      console.error('ACT Size 목록 가져오기 실패:', error);
      setActSizeList([]);
    }
  };

                    // Body 섹션 이벤트 핸들러들
                  const handleBodyChange = (field: string, value: string) => {
                    setBodySelections(prev => {
                      const newSelections = { ...prev, [field]: value };
                      
                      // Unit이 변경되면 해당하는 값 초기화
                      if (field === 'sizeBodyUnit') {
                        newSelections.sizeBody = '';
                      }
                      if (field === 'ratingUnit') {
                        newSelections.rating = '';
                      }
                      
                      return newSelections;
                    });
                  };

                    // Trim 섹션 이벤트 핸들러들
                  const handleTrimChange = (field: string, value: string) => {
                    setTrimSelections(prev => {
                      const newSelections = { ...prev, [field]: value };
                      
                      // Unit이 변경되면 해당하는 값 초기화
                      if (field === 'sizePortUnit') {
                        newSelections.sizePort = '';
                      }
                      
                      return newSelections;
                    });
                  };

                    // ACT 섹션 이벤트 핸들러들
                  const handleActChange = (field: string, value: string) => {
                    console.log('ACT Change:', field, value);
                    setActSelections(prev => {
                      const newSelections = { ...prev, [field]: value };
                      
                      // Series가 변경되면 Size 초기화하고 새로운 Size 목록 가져오기
                      if (field === 'series') {
                        newSelections.size = '';
                        console.log('Series 변경됨:', value);
                        // Series가 선택되면 해당하는 Size 목록 가져오기
                        if (value) {
                          console.log('fetchActSizeList 호출:', value);
                          fetchActSizeList(value);
                        } else {
                          console.log('actSizeList 초기화');
                          setActSizeList([]);
                        }
                      }
                      
                      return newSelections;
                    });
                  };

  // ACC 섹션 이벤트 핸들러들
  const handleAccModelChange = (accType: string, modelCode: string) => {
    if (modelCode) {
      // 선택된 모델의 정보 가져오기
      const selectedModel = accModelList.find((item: any) => 
        item.accModelCode === modelCode && item.accTypeCode === getAccTypeCode(accType)
      );
      
      if (selectedModel) {
        setAccSelections(prev => ({
          ...prev,
          [accType]: {
            ...prev[accType],
            modelCode,
            makerCode: selectedModel.accMakerCode, // 모델 선택 시 메이커 자동 설정
            specification: selectedModel.accSize // 모델 선택 시 규격 자동 설정
          }
        }));
      }
    } else {
      // 모델 선택 해제 시 초기화
      setAccSelections(prev => ({
        ...prev,
        [accType]: {
          ...prev[accType],
          modelCode: '',
          makerCode: '',
          specification: ''
        }
      }));
    }
  };

  const handleAccMakerChange = (accType: string, makerCode: string) => {
    if (makerCode) {
      setAccSelections(prev => ({
        ...prev,
        [accType]: {
          ...prev[accType],
          makerCode,
          modelCode: '', // 메이커 변경 시 모델 초기화
          specification: '' // 메이커 변경 시 규격 초기화
        }
      }));
    } else {
      // 메이커 선택 해제 시 초기화
      setAccSelections(prev => ({
        ...prev,
        [accType]: {
          ...prev[accType],
          makerCode: '',
          modelCode: '',
          specification: ''
        }
      }));
    }
  };

  // 액세서리 타입별 코드 반환
  const getAccTypeCode = (accType: string): string => {
    const typeMap: { [key: string]: string } = {
      positioner: 'A',
      solenoidValve: 'B',
      limitSwitch: 'C',
      airSet: 'D',
      volumeBooster: 'E',
      airOperatedValve: 'F',
      lockUpValve: 'G',
      snapActingRelay: 'H'
    };
    return typeMap[accType] || '';
  };

  // 마스터 데이터 가져오기
  const fetchMasterData = async () => {
    try {
      const [sizeRes, matRes, trimMatRes, optionRes, ratingRes] = await Promise.all([
        fetch('http://localhost:5135/api/estimate/body-size-list'),
        fetch('http://localhost:5135/api/estimate/body-mat-list'),
        fetch('http://localhost:5135/api/estimate/trim-mat-list'),
        fetch('http://localhost:5135/api/estimate/trim-option-list'),
        fetch('http://localhost:5135/api/estimate/body-rating-list')
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

      // Step 3 마스터 데이터 가져오기
      const [bodyBonnetRes, bodyConnectionRes, trimTypeRes, trimSeriesRes, trimPortSizeRes, trimFormRes, 
            actTypeRes, actSeriesRes, actHWRes, accTypeRes, accMakerRes, accModelRes] = await Promise.all([
        fetch('http://localhost:5135/api/estimate/body-bonnet-list'),
        fetch('http://localhost:5135/api/estimate/body-connection-list'),
        fetch('http://localhost:5135/api/estimate/trim-type-list'),
        fetch('http://localhost:5135/api/estimate/trim-series-list'),
        fetch('http://localhost:5135/api/estimate/trim-port-size-list'),
        fetch('http://localhost:5135/api/estimate/trim-form-list'),
        fetch('http://localhost:5135/api/estimate/act-type-list'),
        fetch('http://localhost:5135/api/estimate/act-series-list'),
        fetch('http://localhost:5135/api/estimate/act-hw-list'),
        fetch('http://localhost:5135/api/estimate/acc-type-list'),
        fetch('http://localhost:5135/api/estimate/acc-maker-list'),
        fetch('http://localhost:5135/api/estimate/acc-model-list')
      ]);

      const [bodyBonnetData, bodyConnectionData, trimTypeData, trimSeriesData, trimPortSizeData, trimFormData,
            actTypeData, actSeriesData, actHWData, accTypeData, accMakerData, accModelData] = await Promise.all([
        bodyBonnetRes.json(),
        bodyConnectionRes.json(),
        trimTypeRes.json(),
        trimSeriesRes.json(),
        trimPortSizeRes.json(),
        trimFormRes.json(),
        actTypeRes.json(),
        actSeriesRes.json(),
        actHWRes.json(),
        accTypeRes.json(),
        accMakerRes.json(),
        accModelRes.json()
      ]);

      setBodyBonnetList(bodyBonnetData || []);
      setBodyConnectionList(bodyConnectionData || []);
      setTrimTypeList(trimTypeData || []);
      setTrimSeriesList(trimSeriesData || []);
      setTrimPortSizeList(trimPortSizeData || []);
      setTrimFormList(trimFormData || []);
      setActTypeList(actTypeData || []);
      setActSeriesList(actSeriesData || []);
      setActHWList(actHWData || []);
      setAccTypeList(accTypeData || []);
      setAccMakerList(accMakerData || []);
      setAccModelList(accModelData || []);

    } catch (error) {
      console.error('마스터 데이터 가져오기 실패:', error);
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
      setAccTypeList([]);
      setAccMakerList([]);
      setAccModelList([]);
    }
  };

  // 기존 데이터 로드
  const loadExistingData = async () => {
    if (!tempEstimateNo) return;
    
    console.log('현재 tempEstimateNo:', tempEstimateNo); // tempEstimateNo 로그 추가
    
    try {
      // currentUserId는 임시로 'admin' 사용 (실제로는 로그인된 사용자 ID를 사용해야 함)
      const response = await getEstimateDetail(tempEstimateNo, 'admin');
      const data = response;
      
      console.log('견적 상세 데이터:', data);
      
      // 프로젝트명 설정
      if (data.estimateSheet && data.estimateSheet.project) {
        setProjectName(data.estimateSheet.project);
      }
      
      // 현재 상태 설정
      if (data.estimateSheet && data.estimateSheet.statusText) {
        setCurrentStatus(data.estimateSheet.statusText);
      }
      
      // EstimateRequest 데이터를 기반으로 types와 valves 설정
      if (data.estimateRequests && data.estimateRequests.length > 0) {
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
        
        setTypes(typesData);
        
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
              order: tag.sheetID,
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
        
        setValves(valvesData);
        
        // 첫 번째 valve를 기본 선택
        // if (valvesData.length > 0) {
        //   setSelectedValve(valvesData[0]);
        // }
      }
      
      // 기타 요청사항 설정
      if (data.estimateSheet && data.estimateSheet.customerRequirement) {
        setOtherRequests(data.estimateSheet.customerRequirement);
      }
      
      // 첨부파일 설정
      if (data.attachments && data.attachments.length > 0) {
        // 첨부파일은 File 객체로 변환할 수 없으므로 이름만 표시
        const fileList = data.attachments.map((att: any) => ({
          name: att.fileName || 'Unknown',
          size: att.fileSize || 0
        } as any));
        setAttachments(fileList);
      }
      
    } catch (error) {
      console.error('기존 데이터 로드 실패:', error);
    }
  };

  // 상태 변경 처리
  const handleStatusChange = async (newStatus: string) => {
    try {
      // 견적요청 상태에서만 견적처리중으로 변경 가능
      if (currentStatus === '견적요청' && newStatus === '견적처리중') {
        // 상태 변경 API 호출
        const response = await fetch(`/api/estimate/${tempEstimateNo}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          setCurrentStatus(newStatus);
          alert('상태가 견적처리중으로 변경되었습니다.');
        } else {
          throw new Error('상태 변경에 실패했습니다.');
        }
      } else {
        alert('견적요청 상태에서만 견적처리중으로 변경할 수 있습니다.');
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 사양 저장 함수
  const handleSaveSpecification = async () => {
    try {
      if (!selectedValve) {
        alert('저장할 밸브를 선택해주세요.');
        return;
      }

      const specificationData = {
        valveId: selectedValve.body.typeCode,
        body: {
          bonnetType: bodySelections.bonnetType || '',
          materialBody: bodySelections.materialBody || '',
          // materialTrim: trimSelections.materialTrim || '', // Body에서 Trim으로 이동
          // option: selectedValve.body.option || '', // Trim으로 이동 및 trimSelections.option 사용
          rating: bodySelections.rating || '',
          connection: bodySelections.connection || '',
          sizeUnit: bodySelections.sizeBodyUnit || '', // BodySizeUnit 추가
          size: bodySelections.sizeBody || '' // sizeBody를 size로 사용
        },
        trim: {
          type: trimSelections.trimType || '',
          series: trimSelections.trimSeries || '',
          portSize: trimSelections.sizePort || '', // sizePort를 portSize로 사용
          form: trimSelections.form || '',
          materialTrim: trimSelections.materialTrim || '', // Trim에 materialTrim 추가
          option: trimSelections.option || '' // Trim에 option 값 추가
        },
        actuator: {
          type: actSelections.actionType || '',
          series: actSelections.series || '',
          size: actSelections.size || '',
          hw: actSelections.hw || ''
        },
        accessories: {
          maker: accSelections.positioner?.makerCode || '',
          model: accSelections.positioner?.modelCode || '',
          
          // 모든 악세사리 필드들 추가
          PosCode: accSelections.positioner?.modelCode || '',
          SolCode: accSelections.solenoidValve?.modelCode || '',
          LimCode: accSelections.limitSwitch?.modelCode || '',
          ASCode: accSelections.airSet?.modelCode || '',
          VolCode: accSelections.volumeBooster?.modelCode || '',
          AirOpCode: accSelections.airOperatedValve?.modelCode || '',
          LockupCode: accSelections.lockUpValve?.modelCode || '',
          SnapActCode: accSelections.snapActingRelay?.modelCode || ''
        }
      };

      // 디버깅용 로그 추가
      console.log('선택된 밸브 정보:', selectedValve);
      console.log('전송할 사양 데이터:', specificationData);

      const response = await fetch(`http://localhost:5135/api/estimate/sheets/${tempEstimateNo}/requests/${selectedValve.sheetID}/specification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(specificationData),
      });

      if (response.ok) {
        alert('사양이 성공적으로 저장되었습니다.');
      } else {
        alert('사양 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('사양 저장 중 오류 발생:', error);
      alert('사양 저장 중 오류가 발생했습니다.');
    }
  };

  // 초기화
  useEffect(() => {
    console.log('EstimateDetailPage 초기화 시작');
    fetchBodyValveList();
    fetchMasterData();
  }, []);

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
  }, [bodyValveList.length, bodyRatingList.length, tempEstimateNo]);

  // bodyValveList가 로드된 후 타입 정보 업데이트
  useEffect(() => {
    if (bodyValveList.length > 0 && types.length > 0) {
      const updatedTypes = types.map(type => {
        const valveInfo = bodyValveList.find(v => v.valveSeriesCode === type.code);
        return {
          ...type,
          name: valveInfo ? valveInfo.valveSeries : type.name
        };
      });
      
      // 실제로 변경된 경우에만 업데이트
      const hasChanges = updatedTypes.some((updatedType, index) => 
        updatedType.name !== types[index].name
      );
      
      if (hasChanges) {
        setTypes(updatedTypes);
      }
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
    console.log('loadInitialSpecification 호출됨, sheetID:', sheetID); // sheetID 로그 추가
    
    try {
      if (!tempEstimateNo) {
        console.error("tempEstimateNo가 없습니다.");
        return;
      }
      const response = await fetch(`http://localhost:5135/api/estimate/sheets/${tempEstimateNo}/specification/${sheetID}`);
      if (response.ok) {
        const specificationData = await response.json();
        console.log('API 응답 데이터:', specificationData); // API 응답 로그 추가
        
        console.log('--- 실제 Body 데이터 구조 ---', specificationData.body);
        console.log('--- 실제 Trim 데이터 구조 ---', specificationData.trim);
        console.log('--- 실제 Actuator 데이터 구조 ---', specificationData.actuator);

        // 주요 필드별 값 확인 로그 추가
        console.log('--- Body ---');
        console.log('BonnetType:', specificationData.body?.bonnetType);
        console.log('MaterialBody:', specificationData.body?.materialBody);
        console.log('Size:', specificationData.body?.size);
        console.log('Rating:', specificationData.body?.rating);
        console.log('Connection:', specificationData.body?.connection);
        console.log('--- Trim ---');
        console.log('TrimType:', specificationData.trim?.type);
        console.log('TrimSeries:', specificationData.trim?.series);
        console.log('MaterialTrim:', specificationData.body?.materialTrim);
        console.log('PortSize:', specificationData.trim?.portSize);
        console.log('Form:', specificationData.trim?.form);
        console.log('--- Actuator ---');
        console.log('ActType:', specificationData.actuator?.type);
        console.log('ActSeries:', specificationData.actuator?.series);
        console.log('ActSize:', specificationData.actuator?.size);
        console.log('ActHW:', specificationData.actuator?.hw);
        console.log('--- 실제 Accessories 데이터 구조 ---', specificationData.accessories);
        // Body 사양 데이터 설정 (초기값만) - null 처리 개선
        if (specificationData.body) {
          console.log('Body 데이터:', specificationData.body); // Body 데이터 로그 추가
          setBodySelections(prev => ({
            ...prev,
            bonnetType: specificationData.body.bonnetTypeCode || '',
            materialBody: specificationData.body.materialBodyCode || '',
            sizeBodyUnit: specificationData.body.sizeUnit || '',
            sizeBody: specificationData.body.sizeCode || '',
            ratingUnit: specificationData.body.ratingUnit || '',
            rating: specificationData.body.ratingCode || '',
            connection: specificationData.body.connectionCode || ''
          }));
        }
        
        // Trim 사양 데이터 설정 (초기값만) - null 처리 개선
        if (specificationData.trim) {
          console.log('Trim 데이터:', specificationData.trim); // Trim 데이터 로그 추가
          setTrimSelections(prev => ({
            ...prev,
            trimType: specificationData.trim.typeCode || '',
            trimSeries: specificationData.trim.seriesCode || '',
            materialTrim: specificationData.body?.materialTrimCode || '',
            sizePortUnit: specificationData.trim.portSizeUnit || '',
            sizePort: specificationData.trim.portSizeCode || '',
            form: specificationData.trim.formCode || '',
            option: specificationData.body.optionCode || '' // Body에서 Option 값을 가져옴
          }));
        }
        
        // Actuator 사양 데이터 설정 (초기값만) - null 처리 개선
        if (specificationData.actuator) {
          console.log('Actuator 데이터:', specificationData.actuator); // Actuator 데이터 로그 추가
          const seriesCode = specificationData.actuator.seriesCode || '';
          setActSelections(prev => ({
            ...prev,
            actionType: specificationData.actuator.typeCode || '',
            series: seriesCode,
            size: specificationData.actuator.sizeCode || '',
            hw: specificationData.actuator.hwCode || ''
          }));

          // Series 코드가 있으면 해당 Size 목록을 가져옴
          if (seriesCode) {
            fetchActSizeList(seriesCode);
          }
        }
        
        // Accessory 사양 데이터 설정 (초기값만) - null 처리 개선
        if (specificationData.accessories) {
          // accessories 객체 구조 대응
          const accSelectionsObj = {
            positioner: { modelCode: '', makerCode: '', specification: '' },
            solenoidValve: { modelCode: '', makerCode: '', specification: '' },
            limitSwitch: { modelCode: '', makerCode: '', specification: '' },
            airSet: { modelCode: '', makerCode: '', specification: '' },
            volumeBooster: { modelCode: '', makerCode: '', specification: '' },
            airOperatedValve: { modelCode: '', makerCode: '', specification: '' },
            lockUpValve: { modelCode: '', makerCode: '', specification: '' },
            snapActingRelay: { modelCode: '', makerCode: '', specification: '' }
          };
          const apiToFrontKeyMap = {
            positioner: 'positioner',
            solenoid: 'solenoidValve',
            limiter: 'limitSwitch',
            airSupply: 'airSet',
            volumeBooster: 'volumeBooster',
            airOperator: 'airOperatedValve',      // 실제 응답 키 'airOperator'로 변경
            lockUp: 'lockUpValve',            // 실제 응답 키 'lockUp'으로 변경
            snapActingRelay: 'snapActingRelay'
          };
          Object.entries(apiToFrontKeyMap).forEach(([apiKey, frontKey]) => {
            const accObj = specificationData.accessories[apiKey];
            if (accObj && accObj.modelCode) {
              const modelInfo = accModelList.find(item => item.accModelCode === accObj.modelCode);
              accSelectionsObj[frontKey as keyof typeof accSelectionsObj] = {
                modelCode: accObj.modelCode,
                makerCode: modelInfo ? modelInfo.accMakerCode : '',
                specification: modelInfo ? modelInfo.accSize : ''
              };
            }
          });
          setAccSelections(accSelectionsObj);
        } else if (specificationData.PosCode || specificationData.SolCode) {
          // DataSheet 칼럼 구조 fallback
          const accSelectionsObj = {
            positioner: { modelCode: '', makerCode: '', specification: '' },
            solenoidValve: { modelCode: '', makerCode: '', specification: '' },
            limitSwitch: { modelCode: '', makerCode: '', specification: '' },
            airSet: { modelCode: '', makerCode: '', specification: '' },
            volumeBooster: { modelCode: '', makerCode: '', specification: '' },
            airOperatedValve: { modelCode: '', makerCode: '', specification: '' },
            lockUpValve: { modelCode: '', makerCode: '', specification: '' },
            snapActingRelay: { modelCode: '', makerCode: '', specification: '' }
          };
          const codeToKeyMap = {
            PosCode: 'positioner',
            SolCode: 'solenoidValve',
            LimCode: 'limitSwitch',
            ASCode: 'airSet',
            VolCode: 'volumeBooster',
            AirOpCode: 'airOperatedValve',
            LockupCode: 'lockUpValve',
            SnapActCode: 'snapActingRelay'
          };
          Object.entries(codeToKeyMap).forEach(([col, key]) => {
            const modelCode = specificationData[col];
            if (modelCode) {
              const modelInfo = accModelList.find(item => item.accModelCode === modelCode);
              accSelectionsObj[key as keyof typeof accSelectionsObj] = {
                modelCode,
                makerCode: modelInfo ? modelInfo.accMakerCode : '',
                specification: modelInfo ? modelInfo.accSize : ''
              };
            }
          });
          setAccSelections(accSelectionsObj);
        } else {
            // 액세서리 데이터가 없는 경우 모든 선택 초기화
            setAccSelections({
                positioner: { modelCode: '', makerCode: '', specification: '' },
                solenoidValve: { modelCode: '', makerCode: '', specification: '' },
                limitSwitch: { modelCode: '', makerCode: '', specification: '' },
                airSet: { modelCode: '', makerCode: '', specification: '' },
                volumeBooster: { modelCode: '', makerCode: '', specification: '' },
                airOperatedValve: { modelCode: '', makerCode: '', specification: '' },
                lockUpValve: { modelCode: '', makerCode: '', specification: '' },
                snapActingRelay: { modelCode: '', makerCode: '', specification: '' }
            });
        }
      } else {
        console.log('API 응답 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('초기 사양 데이터 로드 실패:', error);
    }
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
    <div className="step-section">
      <div className="step-header">
        <h3>견적 상세 정보</h3>
      </div>
      
      {/* Step 1: Type 선정 */}
      <div className="step-subsection">
        <h4>Step 1: Type 선정</h4>
        <div className="type-header">
          <p className="step-description">견적에 필요한 밸브 타입을 선택하고 관리합니다.</p>
        </div>
        <div className="type-list">
          {types.map((type, index) => (
            <div 
              key={type.id} 
              className={`type-item ${selectedType === type.id ? 'selected' : ''}`}
              onClick={() => setSelectedType(type.id)}
            >
              <span className="type-name">{type.name}</span>
              <span className="type-count">({type.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: TagNo 선택 */}
      <div className="step-subsection">
        <h4>Step 2: TagNo 선택</h4>
        <p className="step-description">선택된 Type에 따라 TagNo를 선택합니다.</p>
        {!selectedType ? (
          <div className="no-type-selected">
            Step 1에서 Type을 선택하면 해당 Type의 TagNo를 선택할 수 있습니다.
          </div>
        ) : (
          <div className="valve-list">
            {valves
              .filter(valve => {
                const selectedTypeData = types.find(t => t.id === selectedType);
                return selectedTypeData && valve.body.type === selectedTypeData.name;
              })
              .map((valve, index) => (
                <div 
                  key={valve.id} 
                  className={`valve-item ${selectedValve?.id === valve.id ? 'selected' : ''}`}
                  onClick={() => handleValveSelection(valve)}
                >
                  <span className="valve-tag">{valve.tagNo}</span>
                  <span className="valve-qty">({valve.qty})</span>
                </div>
              ))}
          </div>
        )}
      </div>

                {/* Step 3: 상세사양 입력 */}
          {selectedValve && (
            <div className="step-subsection">
              <h4>Step 3: 상세사양 입력</h4>
              <div className="specification-grid">
                {/* BODY 섹션 */}
                <div className="spec-section">
                  <h4>BODY</h4>
                  <div className="spec-grid">
                    <div className="spec-item">
                      <label>Bonnet Type:</label>
                      <select value={bodySelections.bonnetType} onChange={(e) => handleBodyChange('bonnetType', e.target.value)}>
                        <option value="">선택하세요</option>
                        {bodyBonnetList && bodyBonnetList.length > 0 && bodyBonnetList.map((item: any) => (
                          <option key={item.bonnetCode} value={item.bonnetCode}>
                            {item.bonnet}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Material Body:</label>
                      <select value={bodySelections.materialBody} onChange={(e) => handleBodyChange('materialBody', e.target.value)}>
                        <option value="">선택하세요</option>
                        {bodyMatList && bodyMatList.length > 0 && bodyMatList.map((item: any) => (
                          <option key={item.bodyMatCode} value={item.bodyMatCode}>
                            {item.bodyMat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Size Body:</label>
                      <div className="size-input-group">
                        <select value={bodySelections.sizeBodyUnit} onChange={(e) => handleBodyChange('sizeBodyUnit', e.target.value)}>
                          <option value="">Unit 선택</option>
                          {bodySizeList && bodySizeList.length > 0 && 
                            bodySizeList
                              .map(item => item.sizeUnit)
                              .filter((unit, index, arr) => arr.indexOf(unit) === index)
                              .map((unit: string) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))
                          }
                        </select>
                        <select value={bodySelections.sizeBody} onChange={(e) => handleBodyChange('sizeBody', e.target.value)} disabled={!bodySelections.sizeBodyUnit}>
                          <option value="">값 선택</option>
                          {bodySelections.sizeBodyUnit && bodySizeList && bodySizeList.length > 0 && 
                            bodySizeList
                              .filter(item => item.sizeUnit === bodySelections.sizeBodyUnit)
                              .map((item: any) => (
                                <option key={item.bodySizeCode} value={item.bodySizeCode}>
                                  {item.bodySize}
                                </option>
                              ))
                          }
                        </select>
                      </div>
                    </div>
                    <div className="spec-item">
                      <label>Rating:</label>
                      <div className="rating-input-group">
                        <select value={bodySelections.ratingUnit} onChange={(e) => handleBodyChange('ratingUnit', e.target.value)}>
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
                        <select value={bodySelections.rating} onChange={(e) => handleBodyChange('rating', e.target.value)} disabled={!bodySelections.ratingUnit}>
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
                    </div>
                    <div className="spec-item">
                      <label>Connection:</label>
                      <select value={bodySelections.connection} onChange={(e) => handleBodyChange('connection', e.target.value)}>
                        <option value="">선택하세요</option>
                        {bodyConnectionList && bodyConnectionList.length > 0 && bodyConnectionList.map((item: any) => (
                          <option key={item.connectionCode} value={item.connectionCode}>
                            {item.connection}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Trim 섹션 */}
                <div className="spec-section">
                  <h4>Trim</h4>
                  <div className="spec-grid">
                    <div className="spec-item">
                      <label>Trim Type:</label>
                      <select value={trimSelections.trimType} onChange={(e) => handleTrimChange('trimType', e.target.value)}>
                        <option value="">선택하세요</option>
                        {trimTypeList && trimTypeList.length > 0 && trimTypeList.map((item: any) => (
                          <option key={item.trimTypeCode} value={item.trimTypeCode}>
                            {item.trimType}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Trim Series:</label>
                      <select value={trimSelections.trimSeries} onChange={(e) => handleTrimChange('trimSeries', e.target.value)}>
                        <option value="">선택하세요</option>
                        {trimSeriesList && trimSeriesList.length > 0 && trimSeriesList.map((item: any) => (
                          <option key={item.trimSeriesCode} value={item.trimSeriesCode}>
                            {item.trimSeries}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Material Trim:</label>
                      <select value={trimSelections.materialTrim} onChange={(e) => handleTrimChange('materialTrim', e.target.value)}>
                        <option value="">선택하세요</option>
                        {trimMatList && trimMatList.length > 0 && trimMatList.map((item: any) => (
                          <option key={item.trimMatCode} value={item.trimMatCode}>
                            {item.trimMat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Size Port:</label>
                      <div className="size-input-group">
                        <select value={trimSelections.sizePortUnit} onChange={(e) => handleTrimChange('sizePortUnit', e.target.value)}>
                          <option value="">Unit 선택</option>
                          {trimPortSizeList && trimPortSizeList.length > 0 && 
                            trimPortSizeList
                              .map(item => item.portSizeUnit)
                              .filter((unit, index, arr) => arr.indexOf(unit) === index)
                              .map((unit: string) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))
                          }
                        </select>
                        <select value={trimSelections.sizePort} onChange={(e) => handleTrimChange('sizePort', e.target.value)} disabled={!trimSelections.sizePortUnit}>
                          <option value="">값 선택</option>
                          {trimSelections.sizePortUnit && trimPortSizeList && trimPortSizeList.length > 0 && 
                            trimPortSizeList
                              .filter(item => item.portSizeUnit === trimSelections.sizePortUnit)
                              .map((item: any) => (
                                <option key={item.portSizeCode} value={item.portSizeCode}>
                                  {item.portSize}
                                </option>
                              ))
                          }
                        </select>
                      </div>
                    </div>
                    <div className="spec-item">
                      <label>Form:</label>
                      <select value={trimSelections.form} onChange={(e) => handleTrimChange('form', e.target.value)}>
                        <option value="">선택하세요</option>
                        {trimFormList && trimFormList.length > 0 && trimFormList.map((item: any) => (
                          <option key={item.trimFormCode} value={item.trimFormCode}>
                            {item.trimForm}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Option:</label>
                      <select value={trimSelections.option} onChange={(e) => handleTrimChange('option', e.target.value)}>
                        <option value="">선택하세요</option>
                        {trimOptionList && trimOptionList.length > 0 && trimOptionList.map((item: any) => (
                          <option key={item.trimOptionCode} value={item.trimOptionCode}>
                            {item.trimOption}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* ACT 섹션 */}
                <div className="spec-section">
                  <h4>ACT</h4>
                  <div className="spec-grid">
                    <div className="spec-item">
                      <label>Action Type:</label>
                      <select value={actSelections.actionType} onChange={(e) => handleActChange('actionType', e.target.value)}>
                        <option value="">선택하세요</option>
                        {actTypeList && actTypeList.length > 0 && actTypeList.map((item: any) => (
                          <option key={item.actTypeCode} value={item.actTypeCode}>
                            {item.actType}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Series:</label>
                      <select value={actSelections.series} onChange={(e) => handleActChange('series', e.target.value)}>
                        <option value="">선택하세요</option>
                        {actSeriesList && actSeriesList.length > 0 && actSeriesList.map((item: any) => (
                          <option key={item.actSeriesCode} value={item.actSeriesCode}>
                            {item.actSeries}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>Size:</label>
                      <select value={actSelections.size} onChange={(e) => handleActChange('size', e.target.value)} disabled={!actSelections.series}>
                        <option value="">선택하세요</option>
                        {actSizeList && actSizeList.length > 0 && 
                          actSizeList.map((item: any) => (
                            <option key={item.actSizeCode} value={item.actSizeCode}>
                              {item.actSize} {/* actSizeName -> actSize로 변경 */}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <div className="spec-item">
                      <label>H.W:</label>
                      <select value={actSelections.hw} onChange={(e) => handleActChange('hw', e.target.value)}>
                        <option value="">선택하세요</option>
                        {actHWList && actHWList.length > 0 && actHWList.map((item: any) => (
                          <option key={item.hwCode} value={item.hwCode}>
                            {item.hw}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACC 섹션 - 사진과 동일한 3열 구조로 변경 */}
              <div className="acc-section">
                <h4>ACC</h4>
                <div className="acc-table">
                  <table>
                    <thead>
                      <tr>
                        <th>선택목록</th>
                        <th>모델명</th>
                        <th>메이커</th>
                        <th>규격</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Positioner</td>
                               <td>
         <select 
           value={accSelections.positioner.modelCode} 
           onChange={(e) => handleAccModelChange('positioner', e.target.value)}
         >
           <option value="">선택하세요</option>
                                     {accModelList && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'A' && 
                                (!accSelections.positioner.makerCode || item.accMakerCode === accSelections.positioner.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
         </select>
       </td>
       <td>
         <select 
           value={accSelections.positioner.makerCode} 
           onChange={(e) => handleAccMakerChange('positioner', e.target.value)}
         >
           <option value="">선택하세요</option>
         {accMakerList && accMakerList.length > 0 && accMakerList
           .filter((item: any) => item.accTypeCode === 'A')
           .map((item: any) => (
             <option key={item.accMakerCode} value={item.accMakerCode}>
               {item.accMakerName}
             </option>
           ))}
         </select>
       </td>
       <td>
         <input type="text" value={accSelections.positioner.specification} readOnly />
       </td>
                      </tr>
                                              <tr>
                          <td>Solenoid Valve</td>
                          <td>
                            <select 
                              value={accSelections.solenoidValve.modelCode} 
                              onChange={(e) => handleAccModelChange('solenoidValve', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accModelList && accModelList.length > 0 && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'B' && 
                                (!accSelections.solenoidValve.makerCode || item.accMakerCode === accSelections.solenoidValve.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={accSelections.solenoidValve.makerCode} 
                              onChange={(e) => handleAccMakerChange('solenoidValve', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accMakerList && accMakerList.length > 0 && accMakerList
                              .filter((item: any) => item.accTypeCode === 'B')
                              .map((item: any) => (
                                <option key={item.accMakerCode} value={item.accMakerCode}>
                                  {item.accMakerName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={accSelections.solenoidValve.specification} readOnly />
                          </td>
                        </tr>
                                              <tr>
                          <td>Limit Switch</td>
                          <td>
                            <select 
                              value={accSelections.limitSwitch.modelCode} 
                              onChange={(e) => handleAccModelChange('limitSwitch', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accModelList && accModelList.length > 0 && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'C' && 
                                (!accSelections.limitSwitch.makerCode || item.accMakerCode === accSelections.limitSwitch.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={accSelections.limitSwitch.makerCode} 
                              onChange={(e) => handleAccMakerChange('limitSwitch', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accMakerList && accMakerList.length > 0 && accMakerList
                              .filter((item: any) => item.accTypeCode === 'C')
                              .map((item: any) => (
                                <option key={item.accMakerCode} value={item.accMakerCode}>
                                  {item.accMakerName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={accSelections.limitSwitch.specification} readOnly />
                          </td>
                        </tr>
                                              <tr>
                          <td>Air Set</td>
                          <td>
                            <select 
                              value={accSelections.airSet.modelCode} 
                              onChange={(e) => handleAccModelChange('airSet', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accModelList && accModelList.length > 0 && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'D' && 
                                (!accSelections.airSet.makerCode || item.accMakerCode === accSelections.airSet.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={accSelections.airSet.makerCode} 
                              onChange={(e) => handleAccMakerChange('airSet', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accMakerList && accMakerList.length > 0 && accMakerList
                              .filter((item: any) => item.accTypeCode === 'D')
                              .map((item: any) => (
                                <option key={item.accMakerCode} value={item.accMakerCode}>
                                  {item.accMakerName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={accSelections.airSet.specification} readOnly />
                          </td>
                        </tr>
                                              <tr>
                          <td>Volume Booster</td>
                          <td>
                            <select 
                              value={accSelections.volumeBooster.modelCode} 
                              onChange={(e) => handleAccModelChange('volumeBooster', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accModelList && accModelList.length > 0 && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'E' && 
                                (!accSelections.volumeBooster.makerCode || item.accMakerCode === accSelections.volumeBooster.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={accSelections.volumeBooster.makerCode} 
                              onChange={(e) => handleAccMakerChange('volumeBooster', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accMakerList && accMakerList.length > 0 && accMakerList
                              .filter((item: any) => item.accTypeCode === 'E')
                              .map((item: any) => (
                                <option key={item.accMakerCode} value={item.accMakerCode}>
                                  {item.accMakerName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={accSelections.volumeBooster.specification} readOnly />
                          </td>
                        </tr>
                                              <tr>
                          <td>Air Operated Valve</td>
                          <td>
                            <select 
                              value={accSelections.airOperatedValve.modelCode} 
                              onChange={(e) => handleAccModelChange('airOperatedValve', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accModelList && accModelList.length > 0 && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'F' && 
                                (!accSelections.airOperatedValve.makerCode || item.accMakerCode === accSelections.airOperatedValve.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={accSelections.airOperatedValve.makerCode} 
                              onChange={(e) => handleAccMakerChange('airOperatedValve', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accMakerList && accMakerList.length > 0 && accMakerList
                              .filter((item: any) => item.accTypeCode === 'F')
                              .map((item: any) => (
                                <option key={item.accMakerCode} value={item.accMakerCode}>
                                  {item.accMakerName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={accSelections.airOperatedValve.specification} readOnly />
                          </td>
                        </tr>
                                              <tr>
                          <td>Lock Up Valve</td>
                          <td>
                            <select 
                              value={accSelections.lockUpValve.modelCode} 
                              onChange={(e) => handleAccModelChange('lockUpValve', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accModelList && accModelList.length > 0 && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'G' && 
                                (!accSelections.lockUpValve.makerCode || item.accMakerCode === accSelections.lockUpValve.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={accSelections.lockUpValve.makerCode} 
                              onChange={(e) => handleAccMakerChange('lockUpValve', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accMakerList && accMakerList.length > 0 && accMakerList
                              .filter((item: any) => item.accTypeCode === 'G')
                              .map((item: any) => (
                                <option key={item.accMakerCode} value={item.accMakerCode}>
                                  {item.accMakerName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={accSelections.lockUpValve.specification} readOnly />
                          </td>
                        </tr>
                                              <tr>
                          <td>Snap Acting Relay</td>
                          <td>
                            <select 
                              value={accSelections.snapActingRelay.modelCode} 
                              onChange={(e) => handleAccModelChange('snapActingRelay', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accModelList && accModelList.length > 0 && accModelList
                              .filter((item: any) => 
                                item.accTypeCode === 'H' && 
                                (!accSelections.snapActingRelay.makerCode || item.accMakerCode === accSelections.snapActingRelay.makerCode)
                              )
                              .map((item: any) => (
                                <option key={item.accModelCode} value={item.accModelCode}>
                                  {item.accModelName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select 
                              value={accSelections.snapActingRelay.makerCode} 
                              onChange={(e) => handleAccMakerChange('snapActingRelay', e.target.value)}
                            >
                              <option value="">선택하세요</option>
                            {accMakerList && accMakerList.length > 0 && accMakerList
                              .filter((item: any) => item.accTypeCode === 'H')
                              .map((item: any) => (
                                <option key={item.accMakerCode} value={item.accMakerCode}>
                                  {item.accMakerName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input type="text" value={accSelections.snapActingRelay.specification} readOnly />
                          </td>
                        </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 저장 버튼 */}
              <div className="save-section">
                <button 
                  className="btn btn-primary save-specification-btn"
                  onClick={handleSaveSpecification}
                >
                  사양 저장
                </button>
              </div>

        </div>
      )}
    </div>
  );

  // 기타요청사항 섹션
  const OtherRequestsSection = () => (
    <div className="step-section">
      <div className="step-header">
        <h3>기타요청사항</h3>
      </div>
      <div className="other-requests-content">
        <textarea
          value={otherRequests}
          readOnly
          placeholder="기타 요청사항이 없습니다."
          className="other-requests-textarea"
        />
      </div>
    </div>
  );

  // 첨부파일 섹션
  const AttachmentsSection = () => (
    <div className="step-section">
      <div className="step-header">
        <h3>첨부파일</h3>
      </div>
      <div className="attachments-content">
        {attachments.length > 0 ? (
          <div className="attachment-list">
            {attachments.map((file, index) => (
              <div key={index} className="attachment-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-attachments">
            첨부된 파일이 없습니다.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="estimate-detail-page">
      {/* 헤더 */}
      <div className="page-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← 견적요청
        </button>
        <h1>사양 선정</h1>
        <div className="header-actions">
          <button className="btn btn-secondary">견적 세부 정보 한눈에 보기</button>
          <button className="btn btn-secondary">견적 서류 다운로드</button>
        </div>
      </div>

      {/* 상태 및 프로젝트 정보 */}
      <div className="status-section">
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
            disabled={currentStatus !== '견적요청'}
            className="status-select"
          >
            <option value="견적요청">견적요청</option>
            <option value="견적처리중">견적처리중</option>
            <option value="견적완료">견적완료</option>
            <option value="주문">주문</option>
          </select>
        </div>
        <div className="project-group">
          <label>프로젝트명:</label>
          <input type="text" value={projectName} readOnly className="project-input" />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        <div className="steps-container">
          <StepsSection />
          <OtherRequestsSection />
          <AttachmentsSection />
        </div>
      </div>
    </div>
  );
};

export default EstimateDetailPage;
