import React, { useState, useEffect, useCallback } from 'react';
import './NewAccessoryManagementPage.css';

interface MasterDataItem {
  code: string;
  name: string;
  [key: string]: any;
}

const API_BASE_URL = 'http://192.168.0.14:5135/api/masterdata';

const NewAccessoryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'body' | 'trim' | 'act' | 'accessory'>('body');
  const [selectedBodySection, setSelectedBodySection] = useState<string>('bodyBonnet');
  const [selectedAccessorySection, setSelectedAccessorySection] = useState<string>('positioner');
  const [selectedMakerCode, setSelectedMakerCode] = useState<string | null>(null);
  const [selectedUnitCode, setSelectedUnitCode] = useState<string | null>(null); // New state for selected unit in Rating section
  const [selectedBodySizeUnitCode, setSelectedBodySizeUnitCode] = useState<string | null>(null); // New state for selected unit in Body Size section
  const [selectedTrimPortSizeUnitCode, setSelectedTrimPortSizeUnitCode] = useState<string | null>(null); // New state for selected unit in Trim Port Size section
  const [selectedActSection, setSelectedActSection] = useState<string>('actType'); // New state for selected act section
  const [selectedActSeriesCode, setSelectedActSeriesCode] = useState<string | null>(null); // New state for selected Act Series
  const [selectedTrimSection, setSelectedTrimSection] = useState<string>('trimType'); // New state for selected trim section

  const [bodyData, setBodyData] = useState<MasterDataItem[]>([]);
  const [unitData, setUnitData] = useState<MasterDataItem[]>([]); // Unit 데이터를 위한 상태 추가
  const [makerData, setMakerData] = useState<MasterDataItem[]>([]);
  const [modelData, setModelData] = useState<MasterDataItem[]>([]);
  const [actTypeData, setActTypeData] = useState<MasterDataItem[]>([]); // Act Type 데이터를 위한 상태
  const [actSeriesData, setActSeriesData] = useState<MasterDataItem[]>([]); // Act Series 데이터를 위한 상태
  const [actSizeData, setActSizeData] = useState<MasterDataItem[]>([]); // Act Size 데이터를 위한 상태
  const [actHWData, setActHWData] = useState<MasterDataItem[]>([]); // Act H.W 데이터를 위한 상태
  const [trimData, setTrimData] = useState<MasterDataItem[]>([]); // Trim 데이터를 위한 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalType, setModalType] = useState<'maker' | 'model' | 'unit' | 'rating' | 'actType' | 'actSeries' | 'actSize' | 'actHW' | 'trimType' | 'trimSeries' | 'trimPortSize' | 'trimForm' | 'trimMaterial' | 'trimOption' | 'bodyBonnet' | 'bodyValve' | 'bodyMaterial' | 'bodySize' | 'bodyConnection' | 'bodySizeUnit' | 'trimPortSizeUnit' | null>(null);
  const [currentItem, setCurrentItem] = useState<MasterDataItem | null>(null);
  const [formData, setFormData] = useState<Partial<MasterDataItem>>({});

  const tabs = [
    { id: 'body', name: '바디' },
    { id: 'trim', name: '트림' },
    { id: 'act', name: '작동기' },
    { id: 'accessory', name: '악세사리' },
  ];

  const bodySections = React.useMemo(() => [
    { id: 'bodyBonnet', name: '보닛타입', endpoint: 'body/bonnet', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
    { id: 'bodyValve', name: '바디시리즈', endpoint: 'body/valve', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
    { id: 'bodyMaterial', name: '바디재질', endpoint: 'body/material', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
    { id: 'bodySize', name: '바디 사이즈', endpoint: 'body/size' }, // columns removed, will be handled separately like rating
    { id: 'rating', name: '레이팅', endpoint: 'body/rating' }, // columns removed, will be handled separately
    { id: 'bodyConnection', name: '커넥션', endpoint: 'body/connection', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
  ], []);

  const accessorySections = React.useMemo(() => [
    { id: 'positioner', name: 'Positioner', apiId: 'Positioner' },
    { id: 'solenoid', name: 'Solenoid', apiId: 'Solenoid' },
    { id: 'limit', name: 'Limit', apiId: 'Limit' },
    { id: 'airSet', name: 'Air-Set', apiId: 'Airset' },
    { id: 'volumeB', name: 'Volume B', apiId: 'Volume' },
    { id: 'airOperate', name: 'Air Operate', apiId: 'Airoperate' },
    { id: 'lockUp', name: 'Lock Up', apiId: 'Lockup' },
    { id: 'snapActing', name: 'Snap Acting', apiId: 'Snapacting' },
  ], []);

  const actuatorSections = React.useMemo(() => [
    { id: 'actType', name: 'Act Type', endpoint: 'act/type', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
    { id: 'actSeries', name: 'Series & Size', endpoint: 'act/series', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] }, // Series will use act/series, Size will use act/size
    { id: 'actHW', name: 'H.W', endpoint: 'act/hw', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
  ], []);

  const trimSections = React.useMemo(() => [
    { id: 'trimType', name: 'Type', endpoint: 'trim-type', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] }, // 특수경로
    { id: 'trimSeries', name: 'Series', endpoint: 'trim/series', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
    { id: 'trimPortSize', name: 'Port Size', endpoint: 'trim/port-size' }, // columns removed, will be handled separately like rating
    { id: 'trimForm', name: 'Form', endpoint: 'trim/form', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
    { id: 'trimMaterial', name: 'Material', endpoint: 'trim/material', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
    { id: 'trimOption', name: 'Option', endpoint: 'trim/option', columns: [{ key: 'code', label: 'Code*' }, { key: 'name', label: 'NAME' }] },
  ], []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setBodyData([]);
    setMakerData([]);
    setModelData([]);
    // setUnitData([]); // Do NOT clear unitData unconditionally here

    try {
        if (activeTab === 'body') {
            if (selectedBodySection === 'rating') {
                const [ratingResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/body/rating${selectedUnitCode ? `?ratingUnitCode=${selectedUnitCode}` : ''}`)
                ]);

                if (!ratingResponse.ok) throw new Error('Failed to fetch rating data');

                const ratingData = await ratingResponse.json();

                const formattedRatingData = ratingData.map((item: any) => ({
                    code: item.ratingCode,
                    name: item.ratingName,
                    unit: item.ratingUnit 
                }));
                setBodyData(formattedRatingData);

                // Only fetch unit data if it's not already loaded
                // Unit 데이터를 BodyRatingUnitList에서 직접 조회
                const unitResponse = await fetch(`${API_BASE_URL}/body/rating-units`);
                if (!unitResponse.ok) throw new Error('Failed to fetch rating units data');
                const unitApiData = await unitResponse.json();
                console.log("Unit API Data:", unitApiData); // Log API response
                const formattedUnitData = unitApiData.map((item: any) => ({
                    code: item.ratingUnitCode,
                    name: item.ratingUnit,
                }));
                console.log("Formatted Unit Data:", formattedUnitData); // Log formatted data
                setUnitData(formattedUnitData);

            } else if (selectedBodySection === 'bodySize') {
                // Body Size 2레벨 구조
                if (selectedBodySizeUnitCode) {
                    // Unit이 선택된 경우에만 Size 목록 조회
                    const [sizeResponse] = await Promise.all([
                        fetch(`${API_BASE_URL}/body/size-list-by-unit?unitCode=${selectedBodySizeUnitCode}`)
                    ]);

                    if (!sizeResponse.ok) throw new Error('Failed to fetch body size data');

                    const sizeData = await sizeResponse.json();
                    const formattedSizeData = sizeData.map((item: any) => ({
                        code: item.bodySizeCode,
                        name: item.bodySize,
                        unit: item.unitCode
                    }));
                    setBodyData(formattedSizeData);
                } else {
                    // Unit이 선택되지 않은 경우 Size 목록은 비움
                    setBodyData([]);
                }

                // Body Size Unit 데이터는 항상 조회
                const unitResponse = await fetch(`${API_BASE_URL}/body/size-unit-list`);
                if (!unitResponse.ok) throw new Error('Failed to fetch body size units data');
                const unitApiData = await unitResponse.json();
                const formattedUnitData = unitApiData.map((item: any) => ({
                    code: item.unitCode,
                    name: item.unitName,
                }));
                setUnitData(formattedUnitData);

            } else {
                const section = bodySections.find(s => s.id === selectedBodySection);
                if (!section) return;

                const response = await fetch(`${API_BASE_URL}/${section.endpoint}`);
                if (!response.ok) throw new Error(`Failed to fetch ${section.name} data`);
                const data = await response.json();
                
                const formattedData = data.map((item: any) => ({
                    code: item.bonnetCode || item.valveSeriesCode || item.bodyMatCode || item.bodySizeCode || item.connectionCode || '',
                    name: item.bonnet || item.valveSeries || item.bodyMat || item.bodySize || item.connection || '',
                    unit: item.sizeUnit || undefined
                }));
                setBodyData(formattedData);
            }
        } else if (activeTab === 'accessory') {
            const accTypeCode = accessorySections.find(s => s.id === selectedAccessorySection)?.apiId;
            
            if (!accTypeCode) return;

            // Fetch Makers only
            const makerResponse = await fetch(`${API_BASE_URL}/acc/maker?accTypeCode=${accTypeCode}`);
            if (!makerResponse.ok) throw new Error(`Failed to fetch ${accTypeCode} maker data`);
            const makers = await makerResponse.json();
            const formattedMakers = makers.map((item: any) => ({ code: item.accMakerCode, name: item.accMakerName }));
            setMakerData(formattedMakers);
            
            // Clear models when accessory section changes
            setModelData([]);
            setSelectedMakerCode(null);
        } else if (activeTab === 'act') {
            console.log('🔍 Act 탭 선택됨:', { selectedActSection, actuatorSections });
            // Clear all act data when switching tabs
            setActTypeData([]);
            setActSeriesData([]);
            setActSizeData([]);
            setActHWData([]);

            const currentActSection = actuatorSections.find(s => s.id === selectedActSection);
            console.log('🔍 현재 Act 섹션:', currentActSection);
            if (!currentActSection) return;

            if (selectedActSection === 'actSeries') {
                // Fetch Act Series
                const seriesResponse = await fetch(`${API_BASE_URL}/act/series`);
                if (!seriesResponse.ok) throw new Error(`Failed to fetch Act Series data`);
                const seriesData = await seriesResponse.json();
                const formattedSeriesData = seriesData.map((item: any) => ({ code: item.actSeriesCode, name: item.actSeries }));
                setActSeriesData(formattedSeriesData);

                // Fetch Act Sizes based on selected series, or all if no series selected yet
                const sizeResponse = await fetch(`${API_BASE_URL}/act/size${selectedActSeriesCode ? `?actSeriesCode=${selectedActSeriesCode}` : ''}`);
                if (!sizeResponse.ok) throw new Error(`Failed to fetch Act Size data`);
                const sizeData = await sizeResponse.json();
                // Ensure size data includes seriesCode for proper filtering/display if needed
                const formattedSizeData = sizeData.map((item: any) => ({ 
                  code: item.actSizeCode, 
                  name: item.actSize, 
                  seriesCode: item.actSeriesCode // Make sure backend returns this
                }));
                setActSizeData(formattedSizeData);

            } else if (selectedActSection === 'actType') {
                const response = await fetch(`${API_BASE_URL}/act/type`);
                if (!response.ok) throw new Error(`Failed to fetch Act Type data`);
                const data = await response.json();
                setActTypeData(data.map((item: any) => ({ code: item.actTypeCode, name: item.actType })));
            } else if (selectedActSection === 'actHW') {
                console.log('🔍 Act HW 조회 시작');
                const response = await fetch(`${API_BASE_URL}/act/hw`);
                console.log('🔍 Act HW API 응답:', { status: response.status, statusText: response.statusText });
                if (!response.ok) throw new Error(`Failed to fetch Act H.W data`);
                const data = await response.json();
                console.log('🔍 Act HW 데이터:', data);
                setActHWData(data.map((item: any) => ({ code: item.hwCode, name: item.hw })));
            }
        } else if (activeTab === 'trim') {
            setTrimData([]); // Clear trim data
            const currentTrimSection = trimSections.find(s => s.id === selectedTrimSection);
            if (!currentTrimSection) return;

            try {
                if (currentTrimSection.id === 'trimPortSize') {
                    // Trim Port Size 2레벨 구조
                    if (selectedTrimPortSizeUnitCode) {
                        // Unit이 선택된 경우에만 Size 목록 조회
                        const [sizeResponse] = await Promise.all([
                            fetch(`${API_BASE_URL}/trim/port-size-list-by-unit?unitCode=${selectedTrimPortSizeUnitCode}`)
                        ]);

                        if (!sizeResponse.ok) throw new Error('Failed to fetch trim port size data');
                        const sizeData = await sizeResponse.json();

                        const formattedData = sizeData.map((item: any) => ({
                            code: item.portSizeCode,
                            name: item.portSize,
                            unit: item.unitCode
                        }));
                        setTrimData(formattedData);
                    } else {
                        // Unit이 선택되지 않은 경우 Size 목록은 비움
                        setTrimData([]);
                    }

                    // Trim Port Size Unit 데이터는 항상 조회
                    const unitResponse = await fetch(`${API_BASE_URL}/trim/port-size-unit-list`);
                    if (!unitResponse.ok) throw new Error('Failed to fetch trim port size units data');
                    const unitApiData = await unitResponse.json();
                    const formattedUnitData = unitApiData.map((item: any) => ({
                        code: item.unitCode,
                        name: item.unitName,
                    }));
                    setUnitData(formattedUnitData);
                } else {
                    const response = await fetch(`${API_BASE_URL}/${currentTrimSection.endpoint}`);
                    if (!response.ok) throw new Error(`Failed to fetch ${currentTrimSection.name} data`);
                    const data = await response.json();

                    const formattedData = data.map((item: any) => {
                        // Trim 섹션별 데이터 구조에 맞게 매핑
                        if (currentTrimSection.id === 'trimType') {
                            return { code: item.trimTypeCode, name: item.trimType };
                        } else if (currentTrimSection.id === 'trimSeries') {
                            return { code: item.trimSeriesCode, name: item.trimSeries };
                        } else if (currentTrimSection.id === 'trimForm') {
                            return { code: item.trimFormCode, name: item.trimForm };
                        } else if (currentTrimSection.id === 'trimMaterial') {
                            return { code: item.trimMatCode, name: item.trimMat };
                        } else if (currentTrimSection.id === 'trimOption') {
                            return { code: item.trimOptionCode, name: item.trimOption }; // Backend returns trimOptionName as trimOption
                        } else {
                            return { code: '', name: '' };
                        }
                    }).filter(Boolean); // null 값 제거
                    setTrimData(formattedData);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                setTrimData([]);
            }
        } else {
            setBodyData([]);
            setMakerData([]);
            setModelData([]);
            setActTypeData([]);
            setActSeriesData([]);
            setActSizeData([]);
            setActHWData([]);
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setBodyData([]);
        setMakerData([]);
        setModelData([]);
        setActTypeData([]);
        setActSeriesData([]);
        setActSizeData([]);
        setActHWData([]);
    } finally {
        setIsLoading(false);
    }
  }, [activeTab, selectedBodySection, selectedAccessorySection, bodySections, accessorySections, unitData, selectedUnitCode, selectedBodySizeUnitCode, selectedTrimPortSizeUnitCode, selectedActSection, selectedActSeriesCode, actuatorSections, selectedTrimSection, trimSections]);

  const fetchModelsForMaker = useCallback(async (makerCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
        const accTypeCode = accessorySections.find(s => s.id === selectedAccessorySection)?.apiId;
        if (!accTypeCode) return;
        
        const modelResponse = await fetch(`${API_BASE_URL}/acc/model?accTypeCode=${accTypeCode}&accMakerCode=${String(makerCode)}`);
        if (!modelResponse.ok) throw new Error(`Failed to fetch models for maker ${makerCode}`);
        const models = await modelResponse.json();
        setModelData(models.map((item: any) => ({ 
            code: item.accModelCode, 
            name: item.accModelName, 
            spec: item.accSize || 'N/A'
        })));

    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setModelData([]);
    } finally {
        setIsLoading(false);
    }
  }, [selectedAccessorySection, accessorySections]);

  useEffect(() => {
    // Reset selectedUnitCode when switching away from 'rating' section
    if (activeTab === 'body' && selectedBodySection !== 'rating') {
      setSelectedUnitCode(null);
    }
    // Reset selectedBodySizeUnitCode when switching away from 'bodySize' section
    if (activeTab === 'body' && selectedBodySection !== 'bodySize') {
      setSelectedBodySizeUnitCode(null);
    }
    // Reset selectedTrimPortSizeUnitCode when switching away from 'trimPortSize' section
    if (activeTab === 'trim' && selectedTrimSection !== 'trimPortSize') {
      setSelectedTrimPortSizeUnitCode(null);
    }
    fetchData();
  }, [activeTab, selectedBodySection, selectedAccessorySection, selectedUnitCode, selectedBodySizeUnitCode, selectedTrimPortSizeUnitCode, selectedTrimSection]); // Remove fetchData from dependencies to prevent infinite loop

  const handleMakerSelect = (makerCode: string) => {
      setSelectedMakerCode(makerCode);
      fetchModelsForMaker(makerCode);
  }

    const handleUnitSelect = (unitCode: string) => {
      setSelectedUnitCode(unitCode);
  }

  const handleBodySizeUnitSelect = (unitCode: string) => {
      setSelectedBodySizeUnitCode(unitCode);
  }

  const handleTrimPortSizeUnitSelect = (unitCode: string) => {
      setSelectedTrimPortSizeUnitCode(unitCode);
  };

  const handleActSeriesSelect = (seriesCode: string) => {
    setSelectedActSeriesCode(seriesCode);
  };

  // --- Modal and CRUD Functions ---

  const openModal = (type: 'maker' | 'model' | 'unit' | 'rating' | 'actType' | 'actSeries' | 'actSize' | 'actHW' | 'trimType' | 'trimSeries' | 'trimPortSize' | 'trimForm' | 'trimMaterial' | 'trimOption' | 'bodyBonnet' | 'bodyValve' | 'bodyMaterial' | 'bodySize' | 'bodyConnection' | 'bodySizeUnit' | 'trimPortSizeUnit' | null, mode: 'add' | 'edit', item: MasterDataItem | null = null) => {
    setModalType(type);
    setModalMode(mode);
    setCurrentItem(item);
    
    let initialFormData: Partial<MasterDataItem> = {}; // Initialize as empty object

    if (mode === 'edit' && item) {
      if (type === 'maker' || type === 'unit' || type === 'actType' || type === 'actSeries' || type === 'actHW' || type === 'trimType' || type === 'trimSeries' || type === 'trimForm' || type === 'trimMaterial' || type === 'trimOption' || type === 'bodyBonnet' || type === 'bodyValve' || type === 'bodyMaterial' || type === 'bodyConnection') {
        initialFormData = { code: item.code, name: item.name };
      } else if (type === 'model') {
        initialFormData = { code: item.code, name: item.name, spec: item.spec };
      } else if (type === 'rating') {
        initialFormData = { code: item.code, name: item.name, unit: item.unit };
      } else if (type === 'actSize') {
        initialFormData = { code: item.code, name: item.name, seriesCode: item.seriesCode };
      } else if (type === 'trimPortSize') {
        initialFormData = { code: item.code, name: item.name, unit: item.unit };
      } else if (type === 'bodySize') {
        initialFormData = { code: item.code, name: item.name, unit: item.unit };
      } else if (type === 'bodySizeUnit' || type === 'trimPortSizeUnit') {
        initialFormData = { code: item.code, name: item.name };
      }
    } else { // Add mode or no item
      // For add mode, or if item is null (e.g., initial state)
      // Ensure accMakerCode/Name for model, actSeriesCode/Name for actSize, unit for rating/portSize/bodySize
      if (type === 'model' && selectedMakerCode) {
        const selectedMaker = makerData.find(m => m.code === selectedMakerCode);
        if (selectedMaker) { initialFormData.accMakerCode = selectedMaker.code; initialFormData.accMakerName = selectedMaker.name; }
      } else if (type === 'rating') {
        // No special initial data needed for add rating, unit selected separately
      } else if (type === 'actSize' && selectedActSeriesCode) {
        const selectedActSeries = actSeriesData.find(s => s.code === selectedActSeriesCode);
        if (selectedActSeries) { initialFormData.actSeriesCode = selectedActSeries.code; initialFormData.actSeriesName = selectedActSeries.name; }
      } else if (type === 'trimPortSize') {
        // No special initial data for add trimPortSize
      } else if (type === 'bodySize') {
        // No special initial data for add bodySize
      }
    }

    console.log('🔍 openModal - type:', type, 'mode:', mode, 'item:', item);
    console.log('🔍 openModal - initialFormData:', initialFormData);
    
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setCurrentItem(null);
    setFormData({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!modalType) return;

    console.log("handleSave: modalType =", modalType);
    console.log("handleSave: modalMode =", modalMode);
    console.log("handleSave: currentItem =", currentItem);
    console.log("handleSave: formData =", formData);

    const accTypeCode = accessorySections.find(s => s.id === selectedAccessorySection)?.apiId;
    
    let url = ''; 
    let method = modalMode === 'add' ? 'POST' : 'PUT';
    let requestBody: any = {}; 

    // Determine URL and Request Body based on modalType and modalMode
    if (modalType === 'maker') {
        if (modalMode === 'add') {
            if (!accTypeCode) { setError('Accessory type is not selected correctly.'); return; }
            // 백엔드 API: POST /acc/{type} (type="maker")
            url = `${API_BASE_URL}/acc/maker`;
            // 백엔드가 기대하는 필드명: accTypeCode, makerCode, maker
            requestBody = { 
                accTypeCode, 
                makerCode: formData.code, 
                maker: formData.name 
            };
        } else { // edit mode
            // 백엔드 API: PUT /acc/{type}/{code} (type="maker", code=makerCode)
            url = `${API_BASE_URL}/acc/maker/${currentItem?.code}`;
            // 백엔드가 기대하는 필드명: accTypeCode, maker
            requestBody = { 
                accTypeCode, 
                maker: formData.name 
            };
        }
    } else if (modalType === 'model') {
        if (!accTypeCode || !selectedMakerCode) { setError('Accessory type or maker is not selected correctly.'); return; }
        if (modalMode === 'add') {
            // 백엔드 API: POST /acc/{type} (type="model")
            url = `${API_BASE_URL}/acc/model`;
            // 백엔드가 기대하는 필드명: modelCode, model, accTypeCode, accMakerCode, accSize
            requestBody = { 
                modelCode: formData.code, 
                model: formData.name, 
                accTypeCode, 
                accMakerCode: selectedMakerCode, 
                accSize: formData.spec 
            };
        } else { // edit mode
            // 백엔드 API: PUT /acc/{type}/{code} (type="model", code=modelCode)
            url = `${API_BASE_URL}/acc/model/${currentItem?.code}`;
            // 백엔드가 기대하는 필드명: model, accTypeCode, accMakerCode, accSize
            requestBody = { 
                model: formData.name, 
                accTypeCode, 
                accMakerCode: selectedMakerCode, 
                accSize: formData.spec 
            };
        }
    } else if (modalType === 'unit') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/body/rating-units`;
            requestBody = { ratingUnitCode: formData.code, ratingUnit: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/body/rating-units/${currentItem?.code}`;
            requestBody = { ratingUnitCode: currentItem?.code, ratingUnit: formData.name };
        }
    } else if (modalType === 'bodySizeUnit') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/body/size-unit`;
            requestBody = { unitCode: formData.code, unitName: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/body/size-unit/${currentItem?.code}`;
            requestBody = { unitCode: currentItem?.code, unitName: formData.name };
        }
    } else if (modalType === 'trimPortSizeUnit') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/trim/port-size-unit`;
            requestBody = { unitCode: formData.code, unitName: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/trim/port-size-unit/${currentItem?.code}`;
            requestBody = { unitCode: currentItem?.code, unitName: formData.name };
        }
    } else if (modalType === 'rating') {
        if (!selectedUnitCode) { setError('Rating Unit must be selected.'); return; }
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/body/rating`;
            requestBody = { ratingCode: formData.code, rating: formData.name, unit: selectedUnitCode };
        } else { // edit mode
            url = `${API_BASE_URL}/body/rating/${currentItem?.code}`;
            requestBody = { ratingCode: currentItem?.code, rating: formData.name, unit: selectedUnitCode };
        }
    } else if (modalType === 'actType') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/act/type`;
            requestBody = { actTypeCode: formData.code, actType: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/act/type/${currentItem?.code}`;
            requestBody = { actTypeCode: currentItem?.code, actType: formData.name };
        }
    } else if (modalType === 'actSeries') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/act/series`;
            requestBody = { actSeriesCode: formData.code, actSeries: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/act/series/${currentItem?.code}`;
            requestBody = { actSeriesCode: currentItem?.code, actSeries: formData.name };
        }
    } else if (modalType === 'actSize') {
        if (!selectedActSeriesCode) { setError('Actuator Series must be selected.'); return; }
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/act/size`;
            requestBody = { actSizeCode: formData.code, actSize: formData.name, actSeriesCode: selectedActSeriesCode };
        } else { // edit mode
            url = `${API_BASE_URL}/act/size/${currentItem?.code}`;
            requestBody = { actSizeCode: currentItem?.code, actSize: formData.name, actSeriesCode: selectedActSeriesCode };
        }
    } else if (modalType === 'actHW') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/act/hw`;
            requestBody = { hwCode: formData.code, hw: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/act/hw/${currentItem?.code}`;
            requestBody = { hwCode: currentItem?.code, hw: formData.name };
        }
    } else if (modalType === 'trimType') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/trim-type`;
            requestBody = { trimTypeCode: formData.code, trimType: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/trim-type/${currentItem?.code}`;
            requestBody = { trimTypeCode: currentItem?.code, trimType: formData.name };
        }
    } else if (modalType === 'trimSeries') {
        if (modalMode === 'add') {
            url = `${API_BASE_URL}/trim/series`;
            requestBody = { trimSeriesCode: formData.code, trimSeries: formData.name };
        } else { // edit mode
            url = `${API_BASE_URL}/trim/series/${currentItem?.code}`;
            requestBody = { trimSeriesCode: currentItem?.code, trimSeries: formData.name };
        }
    } else if (modalType === 'trimPortSize') {
        if (modalMode === 'add') {
            // 백엔드 API: POST /trim/{section} (section="portsize")
            url = `${API_BASE_URL}/trim/portsize`;
            // Unit이 선택된 경우 자동으로 unitCode 설정
            const unitCode = selectedTrimPortSizeUnitCode || formData.unit;
            // 백엔드가 기대하는 필드명: portSizeCode, portSize, unitCode
            requestBody = { portSizeCode: formData.code, portSize: formData.name, unitCode: unitCode };
            console.log('🔍 trimPortSize ADD - selectedUnitCode:', selectedTrimPortSizeUnitCode, 'formData.unit:', formData.unit, 'final unitCode:', unitCode);
        } else { // edit mode
            // 백엔드 API: PUT /trim/{section}/{code} (section="portsize")
            url = `${API_BASE_URL}/trim/portsize/${currentItem?.code}`;
            // 백엔드가 기대하는 필드명: portSize, unitCode
            requestBody = { portSize: formData.name, unitCode: currentItem?.unit || formData.unit };
        }
    } else if (modalType === 'trimForm') {
        if (modalMode === 'add') {
            // 백엔드 API: POST /trim/{section} (section="form")
            url = `${API_BASE_URL}/trim/form`;
            // 백엔드가 기대하는 필드명: formCode, form
            requestBody = { formCode: formData.code, form: formData.name };
        } else { // edit mode
            // 백엔드 API: PUT /trim/{section}/{code} (section="form")
            url = `${API_BASE_URL}/trim/form/${currentItem?.code}`;
            // 백엔드가 기대하는 필드명: form
            requestBody = { form: formData.name };
        }
    } else if (modalType === 'trimMaterial') {
        if (modalMode === 'add') {
            // 백엔드 API: POST /trim/{section} (section="material")
            url = `${API_BASE_URL}/trim/material`;
            // 백엔드가 기대하는 필드명: trimMatCode, trimMat
            requestBody = { trimMatCode: formData.code, trimMat: formData.name };
        } else { // edit mode
            // 백엔드 API: PUT /trim/{section}/{code} (section="material")
            url = `${API_BASE_URL}/trim/material/${currentItem?.code}`;
            // 백엔드가 기대하는 필드명: trimMat
            requestBody = { trimMat: formData.name };
        }
    } else if (modalType === 'trimOption') {
        if (modalMode === 'add') {
            // 백엔드 API: POST /trim/{section} (section="option")
            url = `${API_BASE_URL}/trim/option`;
            // 백엔드가 기대하는 필드명: trimOptionCode, trimOption
            requestBody = { trimOptionCode: formData.code, trimOption: formData.name };
        } else { // edit mode
            // 백엔드 API: PUT /trim/{section}/{code} (section="option")
            url = `${API_BASE_URL}/trim/option/${currentItem?.code}`;
            // 백엔드가 기대하는 필드명: trimOption
            requestBody = { trimOption: formData.name };
        }
    } else if (modalType.startsWith('body')) { // Group common body sections for add/edit
        const sectionId = modalType.replace('body', '').toLowerCase(); // e.g., 'bonnet', 'valve', 'material', 'connection'
        let codeKey = '';
        let nameKey = '';
        let unitKey = ''; // For size

        switch(sectionId) {
            case 'bonnet': codeKey = 'bonnetCode'; nameKey = 'bonnet'; break;
            case 'valve': codeKey = 'valveSeriesCode'; nameKey = 'valveSeries'; break;
            case 'material': codeKey = 'bodyMatCode'; nameKey = 'bodyMat'; break;
            case 'connection': codeKey = 'connectionCode'; nameKey = 'connection'; break;
            case 'size': codeKey = 'bodySizeCode'; nameKey = 'bodySize'; unitKey = 'sizeUnit'; break;
            default: 
                setError(`Unknown body section ID: ${sectionId}`); 
                return;
        }

        if (modalMode === 'add') {
            url = `${API_BASE_URL}/body/${sectionId}`;
            if (sectionId === 'size') {
                // Unit이 선택된 경우 자동으로 sizeUnit 설정
                const sizeUnit = selectedBodySizeUnitCode || formData.unit;
                requestBody = { [codeKey]: formData.code, [nameKey]: formData.name, [unitKey]: sizeUnit };
                console.log('🔍 bodySize ADD - selectedUnitCode:', selectedBodySizeUnitCode, 'formData.unit:', formData.unit, 'final sizeUnit:', sizeUnit);
            } else {
                requestBody = { [codeKey]: formData.code, [nameKey]: formData.name };
            }
        } else { // edit mode
            url = `${API_BASE_URL}/body/${sectionId}/${currentItem?.code}`;
            if (sectionId === 'size') {
                const sizeUnit = selectedBodySizeUnitCode || formData.unit;
                requestBody = { [codeKey]: currentItem?.code, [nameKey]: formData.name, [unitKey]: sizeUnit };
            } else {
                requestBody = { [codeKey]: currentItem?.code, [nameKey]: formData.name };
            }
        }
    } else {
        setError('Unknown modalType. Cannot construct URL or body.');
        return;
    }

    console.log("🔧 handleSave: Final URL =", url);
    console.log("🔧 handleSave: Final Method =", method);
    console.log("🔧 handleSave: Final Body =", requestBody);
    console.log("🔧 handleSave: accTypeCode =", accTypeCode);
    console.log("🔧 handleSave: selectedMakerCode =", selectedMakerCode);
    console.log("🔧 handleSave: modalType =", modalType);
    console.log("🔧 handleSave: modalMode =", modalMode);
    console.log("🔧 handleSave: selectedUnitCode =", selectedUnitCode);
    console.log("🔧 handleSave: formData =", formData);
    console.log("🔧 handleSave: requestBody JSON =", JSON.stringify(requestBody));

    try {
        console.log("🔧 API 호출 상세:", { url, method, requestBody });
        console.log("🔧 requestBody JSON:", JSON.stringify(requestBody));
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            console.error('🔧 API 응답 오류:', response.status, response.statusText);
            let errorMessage = 'Failed to save data.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                console.error('🔧 API 오류 상세:', errorData);
            } catch (parseError) {
                console.error('🔧 응답 파싱 오류:', parseError);
            }
            throw new Error(errorMessage);
        }

        closeModal();
        if (modalType === 'maker') {
            fetchData(); // Refetch all makers, or body sections
        } else if (modalType === 'model' && selectedMakerCode) {
            fetchModelsForMaker(selectedMakerCode); // Refetch models for the current maker
        } else if (modalType === 'unit' || modalType === 'rating' || modalType === 'bodySizeUnit' || modalType === 'trimPortSizeUnit') {
            fetchData(); // Refetch body data for rating section
        } else if (modalType === 'actType' || modalType === 'actSeries' || modalType === 'actSize' || modalType === 'actHW') {
            fetchData(); // Refetch act data
        } else if (modalType === 'trimType' || modalType === 'trimSeries' || modalType === 'trimPortSize' || modalType === 'trimForm' || modalType === 'trimMaterial' || modalType === 'trimOption') {
            fetchData(); // Refetch trim data
        } else if (modalType.startsWith('body')) { // Simplified check for all body sections
            fetchData(); // Refetch body data
        }

    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during save.');
    }
  };

  const handleDelete = async (type: 'maker' | 'model' | 'unit' | 'rating' | 'actType' | 'actSeries' | 'actSize' | 'actHW' | 'trimType' | 'trimSeries' | 'trimPortSize' | 'trimForm' | 'trimMaterial' | 'trimOption' | 'bodyBonnet' | 'bodyValve' | 'bodyMaterial' | 'bodySize' | 'bodyConnection' | 'bodySizeUnit' | 'trimPortSizeUnit', item: MasterDataItem) => {
    console.log('🚀 handleDelete 시작:', { type, item, selectedAccessorySection, selectedMakerCode });
    
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;

    const accTypeCode = accessorySections.find(s => s.id === selectedAccessorySection)?.apiId;
    
    // 악세사리 메이커/모델 삭제 전 사용 여부 확인
    if (type === 'maker' && accTypeCode) {
      console.log('🔍 메이커 삭제 전 사용 여부 확인 시작:', { type, accTypeCode, makerCode: item.code });
      
      try {
        const checkUrl = `${API_BASE_URL}/acc/${accTypeCode}/check-maker-usage/${item.code}`;
        console.log('🔍 API 호출 URL:', checkUrl);
        
        const usageCheck = await fetch(checkUrl);
        console.log('🔍 API 응답 상태:', usageCheck.status);
        
        if (!usageCheck.ok) {
          console.error('🔍 API 오류:', usageCheck.status, usageCheck.statusText);
          throw new Error(`API 오류: ${usageCheck.status}`);
        }
        
        const usageData = await usageCheck.json();
        console.log('🔍 사용 여부 데이터:', usageData);
        
        if (usageData.isUsed) {
          console.log('🔍 메이커가 사용 중입니다. 삭제 차단.');
          const choice = window.confirm(
            `이 메이커는 ${usageData.usedModelsCount}개의 모델에서 사용 중입니다.\n\n` +
            `삭제하려면 모든 모델을 먼저 삭제해야 합니다.\n\n` +
            `계속 진행하시겠습니까?`
          );
          
          if (choice) {
            alert('먼저 사용 중인 모델들을 삭제해주세요.');
            return;
          } else {
            return; // 삭제 취소
          }
        } else {
          console.log('🔍 메이커가 사용되지 않습니다. 삭제 진행.');
        }
      } catch (error) {
        console.error('🔍 사용 여부 확인 중 오류:', error);
        // 사용 여부 확인 실패 시에도 삭제 진행 (기존 동작 유지)
      }
    }
    
    if (type === 'model' && accTypeCode && selectedMakerCode) {
      console.log('🔍 모델 삭제 전 사용 여부 확인 시작:', { type, accTypeCode, makerCode: selectedMakerCode, modelCode: item.code });
      
      try {
        const checkUrl = `${API_BASE_URL}/acc/${accTypeCode}/check-model-usage/${selectedMakerCode}/${item.code}`;
        console.log('🔍 API 호출 URL:', checkUrl);
        
        const usageCheck = await fetch(checkUrl);
        console.log('🔍 API 응답 상태:', usageCheck.status);
        
        if (!usageCheck.ok) {
          console.error('🔍 API 오류:', usageCheck.status, usageCheck.statusText);
          throw new Error(`API 오류: ${usageCheck.status}`);
        }
        
        const usageData = await usageCheck.json();
        console.log('🔍 사용 여부 데이터:', usageData);
        
        if (usageData.isUsed) {
          console.log('🔍 모델이 사용 중입니다. 삭제 차단.');
          alert(
            `이 모델은 ${usageData.usedEstimatesCount}개의 견적에서 사용 중입니다.\n` +
            `삭제할 수 없습니다.`
          );
          return;
                } else {
            console.log('🔍 모델이 사용되지 않습니다. 삭제 진행.');
        }
      } catch (error) {
        console.error('🔍 사용 여부 확인 중 오류:', error);
        // 사용 여부 확인 실패 시에도 삭제 진행 (기존 동작 유지)
      }
    }
    
    // Act 삭제 전 사용 여부 확인 (새로 추가)
    if (type === 'actType' || type === 'actSeries' || type === 'actSize' || type === 'actHW') {
      console.log('🔍 Act 삭제 전 사용 여부 확인 시작:', { type, item });
      
      try {
        // 간단한 확인: 해당 Act가 하위 계층에서 사용 중인지 확인
        // 실제로는 백엔드에서 이미 확인하고 있지만, 프론트엔드에서도 경고 메시지 표시
        let warningMessage = '';
        if (type === 'actType') {
          warningMessage = '직접 삭제 가능합니다.';
        } else if (type === 'actSeries') {
          warningMessage = '삭제 시 하위 Act Size들도 함께 삭제됩니다.';
        } else if (type === 'actSize') {
          warningMessage = '직접 삭제 가능합니다.';
        } else if (type === 'actHW') {
          warningMessage = '직접 삭제 가능합니다.';
        }
        
        const confirmDelete = window.confirm(
          `이 ${type === 'actType' ? 'Act Type' : type === 'actSeries' ? 'Act Series' : type === 'actSize' ? 'Act Size' : 'Act HW'}을(를) 삭제하시겠습니까?\n\n` +
          `${warningMessage}`
        );
        
        if (!confirmDelete) {
          console.log('🔍 사용자가 삭제를 취소했습니다.');
          return;
        }
      } catch (error) {
        console.error('🔍 Act 삭제 확인 중 오류:', error);
      }
    }
    
    let url = '';
    if (type === 'model') {
        if (!selectedMakerCode) {
            setError('A maker must be selected to delete a model.');
            return;
        }
        if (!accTypeCode) {
            setError('Accessory type is not selected correctly.'); // Should not happen if selectedMakerCode is set
            return;
        }
        // 백엔드 API: acc/{section}/{modelCode}/{accTypeCode}/{accMakerCode}
        // model 삭제 시: section="model", modelCode=item.code, accTypeCode=accTypeCode, accMakerCode=selectedMakerCode
        url = `${API_BASE_URL}/acc/${type}/${item.code}/${accTypeCode}/${selectedMakerCode}`;
    } else if (type === 'maker') {
        if (!accTypeCode) {
            setError('Accessory type is not selected correctly.');
            return;
        }
        // 백엔드 API: acc/{section}/{modelCode}/{accTypeCode}/{accMakerCode}
        // maker 삭제 시: section="maker", modelCode=item.code, accTypeCode=accTypeCode, accMakerCode는 사용하지 않음
        url = `${API_BASE_URL}/acc/${type}/${item.code}/${accTypeCode}/dummy`;
    } else if (type === 'unit') {
        url = `${API_BASE_URL}/body/rating-units/${item.code}`;
    } else if (type === 'bodySizeUnit') {
        url = `${API_BASE_URL}/body/size-unit/${item.code}`;
    } else if (type === 'trimPortSizeUnit') {
        url = `${API_BASE_URL}/trim/port-size-unit/${item.code}`;
    } else if (type === 'rating') {
        // rating은 복합키이므로 unit 파라미터 필요
        if (!selectedUnitCode) {
            setError('Rating Unit must be selected to delete rating.');
            return;
        }
        url = `${API_BASE_URL}/body/rating/${item.code}?unit=${selectedUnitCode}`;
    } else if (type === 'actType') {
        // 백엔드 API: DELETE /act/{section}/{code} (section="type")
        url = `${API_BASE_URL}/act/type/${item.code}`;
    } else if (type === 'actSeries') {
        // 백엔드 API: DELETE /act/{section}/{code} (section="series")
        url = `${API_BASE_URL}/act/series/${item.code}`;
    } else if (type === 'actSize') {
        // 백엔드 API: DELETE /act/{section}/{code} (section="size") + Query Parameter actSeriesCode
        if (!selectedActSeriesCode) {
            setError('Actuator Series must be selected to delete size.');
            return;
        }
        url = `${API_BASE_URL}/act/size/${item.code}?actSeriesCode=${selectedActSeriesCode}`;
    } else if (type === 'actHW') {
        // 백엔드 API: DELETE /act/{section}/{code} (section="hw")
        url = `${API_BASE_URL}/act/hw/${item.code}`;
    } else if (type === 'trimType') {
        url = `${API_BASE_URL}/trim-type/${item.code}`;
    } else if (type === 'trimSeries') {
        url = `${API_BASE_URL}/trim/series/${item.code}`;
    } else if (type === 'trimPortSize') {
        if (!item.unit) {
            setError('Unit 정보가 필요합니다.');
            return;
        }
        url = `${API_BASE_URL}/trim/portsize/${item.code}?unit=${item.unit}`;
    } else if (type === 'trimForm') {
        url = `${API_BASE_URL}/trim/form/${item.code}`;
    } else if (type === 'trimMaterial') {
        url = `${API_BASE_URL}/trim/material/${item.code}`;
    } else if (type === 'trimOption') {
        url = `${API_BASE_URL}/trim/option/${item.code}`;
    } else if (type.startsWith('body')) { // Group common body sections for delete
        const sectionId = type.replace('body', '').toLowerCase();
        if (sectionId === 'size') {
            // bodySize는 복합키이므로 unit 파라미터 필요
            url = `${API_BASE_URL}/body/${sectionId}/${item.code}?unit=${item.unit}`;
        } else {
             url = `${API_BASE_URL}/body/${sectionId}/${item.code}`;
        }
    } else {
        setError('Unknown delete type. Cannot construct URL.');
        return;
    }

    try {
        console.log('🔧 삭제 API 호출:', { url, method: 'DELETE' });
        const response = await fetch(url, { method: 'DELETE' });
        console.log('🔧 삭제 API 응답:', { status: response.status, statusText: response.statusText });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete data.');
        }
        
        if (type === 'maker') {
            fetchData(); // Refetch makers
        } else if (type === 'model' && selectedMakerCode) {
            fetchModelsForMaker(selectedMakerCode); // Refetch models
        } else if (type === 'unit' || type === 'rating' || type === 'bodySizeUnit' || type === 'trimPortSizeUnit') {
            fetchData(); // Refetch body data for rating section
        } else if (type === 'actType' || type === 'actSeries' || type === 'actSize' || type === 'actHW') {
            fetchData(); // Refetch act data
        } else if (type === 'trimType' || type === 'trimSeries' || type === 'trimPortSize' || type === 'trimForm' || type === 'trimMaterial' || type === 'trimOption') {
            fetchData(); // Refetch trim data
        } else if (type.startsWith('body')) { // Simplified check for all body sections
            fetchData(); // Refetch body data
        }

    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred during delete.');
    }
  };


  // --- Render Functions ---

  const renderModal = () => {
    if (!isModalOpen) return null;

    const title = (() => {
        if (modalType === 'unit') {
            return `${modalMode === 'add' ? 'Add' : 'Edit'} Rating Unit`;
        } else if (modalType === 'rating') {
            return `${modalMode === 'add' ? 'Add' : 'Edit'} Body Rating`;
        } else if (modalType === 'bodySize') {
            return `${modalMode === 'add' ? 'Add' : 'Edit'} Body Size`;
        } else {
            return `${modalMode === 'add' ? 'Add' : 'Edit'} ${modalType}`;
        }
    })();

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h3>{title}</h3>
                <div className="modal-body">
                    {modalType !== 'bodySize' && (
                        <>
                            <div className="form-group">
                                <label>모델 코드</label>
                                <input name="code" value={formData.code || ''} onChange={handleFormChange} disabled={modalMode === 'edit'}/>
                            </div>
                            <div className="form-group">
                                <label>모델 이름</label>
                                <input name="name" value={formData.name || ''} onChange={handleFormChange} />
                            </div>
                        </>
                    )}
                    {modalType === 'model' && (
                        <>
                            <div className="form-group">
                                <label>메이커 코드</label>
                                <input name="accMakerCode" value={formData.accMakerCode || ''} disabled readOnly />
                            </div>
                            <div className="form-group">
                                <label>메이커 이름</label>
                                <input name="accMakerName" value={formData.accMakerName || ''} disabled readOnly />
                            </div>
                            <div className="form-group">
                                <label>규격 (Spec)</label>
                                <input name="spec" value={formData.spec || ''} onChange={handleFormChange} />
                            </div>
                        </>
                    )}
                    {modalType === 'rating' && (
                        <div className="form-group">
                            <label>Rating Unit</label>
                            <input name="unit" value={selectedUnitCode || ''} disabled readOnly />
                        </div>
                    )}
                    {modalType === 'bodySize' && (
                        <>
                            <div className="form-group">
                                <label>Body Size Code</label>
                                <input name="code" value={formData.code || ''} onChange={handleFormChange} placeholder="A, B, C 등" disabled={modalMode === 'edit'} />
                            </div>
                            <div className="form-group">
                                <label>Body Size Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleFormChange} placeholder="20A, 50A 등" />
                            </div>
                        </>
                    )}
                </div>
                <div className="modal-footer">
                    <button onClick={closeModal} className="control-btn">Cancel</button>
                    <button onClick={handleSave} className="control-btn add-btn">Save</button>
                </div>
            </div>
        </div>
    );
  };

  const renderContent = () => {
    // ... (이전 코드와 유사, 로딩/에러 처리 추가)

    if (isLoading) return <div className="placeholder-content">Loading...</div>;
    if (error) return <div className="placeholder-content error">Error: {error}</div>;

    switch (activeTab) {
      case 'body':
        const currentBodySection = bodySections.find(s => s.id === selectedBodySection);
        if (selectedBodySection === 'rating') {
            return (
                <div className="content-wrapper">
                    <div className="section-selector">
                        <h3>Body 섹션 선택</h3>
                        <div className="section-buttons">
                            {bodySections.map((section) => (
                            <button
                                key={section.id}
                                className={`section-button ${selectedBodySection === section.id ? 'active' : ''}`}
                                onClick={() => setSelectedBodySection(section.id)}
                            >
                                {section.name}
                            </button>
                            ))}
                        </div>
                    </div>
                    <div className="rating-grid">
                        <div className="table-area">
                            <div className="table-header">
                                <h3>Unit</h3>
                                <div className="controls">
                                    <input type="text" placeholder="검색..." className="search-input"/>
                                    <button className="control-btn" onClick={fetchData}>새로고침</button>
                                    <button className="control-btn add-btn" onClick={() => openModal('unit', 'add')}>+ 추가</button>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th key="code">Code</th>
                                        <th key="name">NAME</th>
                                        <th key="actions">작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unitData.map(item => (
                                        <tr 
                                            key={item.code} 
                                            onClick={() => handleUnitSelect(item.code)} // Add onClick event
                                            className={selectedUnitCode === item.code ? 'selected' : ''} // Add 'selected' class
                                        >
                                            <td>{item.code}</td>
                                            <td>{item.name}</td>
                                            <td>
                                                <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openModal('unit', 'edit', item); }}>수정</button>
                                                <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete('unit', item); }}>삭제</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {selectedUnitCode && ( // Conditionally render Rating table
                            <div className="table-area">
                                <div className="table-header">
                                    <h3>Rating</h3>
                                    <div className="controls">
                                        <input type="text" placeholder="검색..." className="search-input"/>
                                        <button className="control-btn" onClick={fetchData}>새로고침</button>
                                        <button className="control-btn add-btn" onClick={() => openModal('rating', 'add')}>+ 추가</button>
                                    </div>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th key="code">Code*</th>
                                            <th key="name">NAME</th>
                                            <th key="spec">규격</th>
                                            <th key="actions">작업</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bodyData.map(item => (
                                            <tr key={item.code}>
                                                <td>{item.code}</td>
                                                <td>{item.name}</td>
                                                <td>{item.unit}</td>
                                                <td>
                                                    <button className="action-btn edit-btn" onClick={() => openModal('rating', 'edit', item)}>수정</button>
                                                    <button className="action-btn delete-btn" onClick={() => handleDelete('rating', item)}>삭제</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )
        } else if (selectedBodySection === 'bodySize') {
            return (
                <div className="content-wrapper">
                    <div className="section-selector">
                        <h3>Body 섹션 선택</h3>
                        <div className="section-buttons">
                            {bodySections.map((section) => (
                            <button
                                key={section.id}
                                className={`section-button ${selectedBodySection === section.id ? 'active' : ''}`}
                                onClick={() => setSelectedBodySection(section.id)}
                            >
                                {section.name}
                            </button>
                            ))}
                        </div>
                    </div>
                    <div className="rating-grid">
                        <div className="table-area">
                            <div className="table-header">
                                <h3>Unit</h3>
                                <div className="controls">
                                    <input type="text" placeholder="검색..." className="search-input"/>
                                    <button className="control-btn" onClick={fetchData}>새로고침</button>
                                    <button className="control-btn add-btn" onClick={() => openModal('bodySizeUnit', 'add')}>+ 추가</button>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th key="code">Code</th>
                                        <th key="name">NAME</th>
                                        <th key="actions">작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unitData.map(item => (
                                        <tr 
                                            key={item.code} 
                                            onClick={() => handleBodySizeUnitSelect(item.code)} // Add onClick event
                                            className={selectedBodySizeUnitCode === item.code ? 'selected' : ''} // Add 'selected' class
                                        >
                                            <td>{item.code}</td>
                                            <td>{item.name}</td>
                                            <td>
                                                <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openModal('bodySizeUnit', 'edit', item); }}>수정</button>
                                                <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete('bodySizeUnit', item); }}>삭제</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {selectedBodySizeUnitCode && ( // Conditionally render Body Size table
                            <div className="table-area">
                                <div className="table-header">
                                    <h3>Body Size</h3>
                                    <div className="controls">
                                        <input type="text" placeholder="검색..." className="search-input"/>
                                        <button className="control-btn" onClick={fetchData}>새로고침</button>
                                        <button className="control-btn add-btn" onClick={() => openModal('bodySize', 'add')}>+ 추가</button>
                                    </div>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                        <th key="code">Code*</th>
                                        <th key="name">NAME</th>
                                        <th key="unit">Unit</th>
                                        <th key="actions">작업</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {bodyData.map(item => (
                                            <tr key={item.code}>
                                                <td>{item.code}</td>
                                                <td>{item.name}</td>
                                                <td>{item.unit}</td>
                                                <td>
                                                    <button className="action-btn edit-btn" onClick={() => openModal('bodySize', 'edit', item)}>수정</button>
                                                    <button className="action-btn delete-btn" onClick={() => handleDelete('bodySize', item)}>삭제</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        if (!currentBodySection) return null; // Add this line
        return (
          <div className="content-wrapper">
            <div className="section-selector">
              <h3>Body 섹션 선택</h3>
              <div className="section-buttons">
                {bodySections.map((section) => (
                  <button
                    key={section.id}
                    className={`section-button ${selectedBodySection === section.id ? 'active' : ''}`}
                    onClick={() => setSelectedBodySection(section.id)}
                  >
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="table-area">
                <div className="table-header">
                    <h3>{currentBodySection?.name}</h3>
                    <div className="controls">
                        <input type="text" placeholder="검색..." className="search-input"/>
                        <button className="control-btn" onClick={fetchData}>새로고침</button>
                        <button className="control-btn add-btn" onClick={() => openModal(currentBodySection.id as 'bodyBonnet' | 'bodyValve' | 'bodyMaterial' | 'bodySize' | 'bodyConnection', 'add')}>+ 추가</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            {currentBodySection?.columns && currentBodySection.columns.map(col => <th key={col.key}>{col.label}</th>)}
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bodyData.map((item, index) => (
                            <tr key={currentBodySection?.id === 'bodySize' ? `${item.unit}-${item.code}-${index}` : `${item.code}-${index}`}>
                                <td>{item.code}</td>
                                <td>{item.name}</td>
                                {currentBodySection?.columns && currentBodySection.columns.some(col => col.key === 'unit') && <td>{item.unit}</td>}
                                <td>
                                    <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openModal(currentBodySection.id as 'bodyBonnet' | 'bodyValve' | 'bodyMaterial' | 'bodySize' | 'bodyConnection', 'edit', item); }}>수정</button>
                                    <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(currentBodySection.id as 'bodyBonnet' | 'bodyValve' | 'bodyMaterial' | 'bodySize' | 'bodyConnection', item); }}>삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        );
      case 'accessory':
        return (
            <div className="content-wrapper">
                <div className="section-selector">
                    <h3>Accessory 섹션 선택</h3>
                    <div className="section-buttons">
                        {accessorySections.map((section) => (
                        <button
                            key={section.id}
                            className={`section-button ${selectedAccessorySection === section.id ? 'active' : ''}`}
                            onClick={() => setSelectedAccessorySection(section.id)}
                        >
                            {section.name}
                        </button>
                        ))}
                    </div>
                </div>
                <div className="accessory-grid">
                    <div className="table-area">
                        <div className="table-header">
                            <h3>Maker</h3>
                            <div className="controls">
                                <input type="text" placeholder="검색..." className="search-input"/>
                                <button className="control-btn" onClick={fetchData}>새로고침</button>
                                <button className="control-btn add-btn" onClick={() => openModal('maker', 'add')}>+ 추가</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>NAME</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {makerData.map(item => (
                                    <tr 
                                        key={item.code} 
                                        onClick={() => handleMakerSelect(item.code)}
                                        className={selectedMakerCode === item.code ? 'selected' : ''}
                                    >
                                        <td>{item.code}</td>
                                        <td>{item.name}</td>
                                        <td>
                                            <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openModal('maker', 'edit', item); }}>수정</button>
                                            <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete('maker', item); }}>삭제</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="table-area">
                         <div className="table-header">
                            <h3>Model</h3>
                            <div className="controls">
                                <input type="text" placeholder="검색..." className="search-input"/>
                                <button className="control-btn" onClick={() => selectedMakerCode && fetchModelsForMaker(selectedMakerCode)}>새로고침</button>
                                <button className="control-btn add-btn" onClick={() => openModal('model', 'add')} disabled={!selectedMakerCode}>+ 추가</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Code*</th>
                                    <th>NAME</th>
                                    <th>규격</th>
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modelData.map(item => (
                                    <tr key={item.code}>
                                        <td>{item.code}</td>
                                        <td>{item.name}</td>
                                        <td>{item.spec}</td>
                                        <td>
                                            <button className="action-btn edit-btn" onClick={() => openModal('model', 'edit', item)}>수정</button>
                                            <button className="action-btn delete-btn" onClick={() => handleDelete('model', item)}>삭제</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
      case 'trim':
        const currentTrimSection = trimSections.find(s => s.id === selectedTrimSection);
        if (!currentTrimSection) return null; // Should not happen

        if (selectedTrimSection === 'trimPortSize') {
            return (
                <div className="content-wrapper">
                    <div className="section-selector">
                        <h3>Trim 섹션 선택</h3>
                        <div className="section-buttons">
                            {trimSections.map((section) => (
                                <button
                                    key={section.id}
                                    className={`section-button ${selectedTrimSection === section.id ? 'active' : ''}`}
                                    onClick={() => setSelectedTrimSection(section.id)}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="rating-grid">
                        <div className="table-area">
                            <div className="table-header">
                                <h3>Unit</h3>
                                <div className="controls">
                                    <input type="text" placeholder="검색..." className="search-input"/>
                                    <button className="control-btn" onClick={fetchData}>새로고침</button>
                                    <button className="control-btn add-btn" onClick={() => openModal('trimPortSizeUnit', 'add')}>+ 추가</button>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th key="code">Code</th>
                                        <th key="name">NAME</th>
                                        <th key="actions">작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unitData.map(item => (
                                        <tr 
                                            key={item.code} 
                                            onClick={() => handleTrimPortSizeUnitSelect(item.code)} // Add onClick event
                                            className={selectedTrimPortSizeUnitCode === item.code ? 'selected' : ''} // Add 'selected' class
                                        >
                                            <td>{item.code}</td>
                                            <td>{item.name}</td>
                                            <td>
                                                <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openModal('trimPortSizeUnit', 'edit', item); }}>수정</button>
                                                <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete('trimPortSizeUnit', item); }}>삭제</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {selectedTrimPortSizeUnitCode && ( // Conditionally render Trim Port Size table
                            <div className="table-area">
                                <div className="table-header">
                                    <h3>Trim Port Size</h3>
                                    <div className="controls">
                                        <input type="text" placeholder="검색..." className="search-input"/>
                                        <button className="control-btn" onClick={fetchData}>새로고침</button>
                                        <button className="control-btn add-btn" onClick={() => openModal('trimPortSize', 'add')}>+ 추가</button>
                                    </div>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                        <th key="code">Code*</th>
                                        <th key="name">NAME</th>
                                        <th key="unit">Unit</th>
                                        <th key="actions">작업</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                        {trimData.map(item => (
                                            <tr key={item.code}>
                                                <td>{item.code}</td>
                                                <td>{item.name}</td>
                                                <td>{item.unit}</td>
                                                <td>
                                                    <button className="action-btn edit-btn" onClick={() => openModal('trimPortSize', 'edit', item)}>수정</button>
                                                    <button className="action-btn delete-btn" onClick={() => handleDelete('trimPortSize', item)}>삭제</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )
        }
        return (
            <div className="content-wrapper">
                <div className="section-selector">
                    <h3>Trim 섹션 선택</h3>
                    <div className="section-buttons">
                        {trimSections.map((section) => (
                            <button
                                key={section.id}
                                className={`section-button ${selectedTrimSection === section.id ? 'active' : ''}`}
                                onClick={() => setSelectedTrimSection(section.id)}
                            >
                                {section.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="table-area"> {/* Using table-area for single column layout for Trim */} 
                    <div className="table-header">
                        <h3>{currentTrimSection?.name}</h3>
                        <div className="controls">
                            <input type="text" placeholder="검색..." className="search-input"/>
                            <button className="control-btn" onClick={fetchData}>새로고침</button>
                            <button className="control-btn add-btn" onClick={() => openModal(currentTrimSection.id as 'trimType' | 'trimSeries' | 'trimPortSize' | 'trimForm' | 'trimMaterial' | 'trimOption', 'add')}>+ 추가</button>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                {currentTrimSection?.columns && currentTrimSection.columns.map(col => <th key={col.key}>{col.label}</th>)}
                                <th>작업</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trimData.map((item, index) => (
                                <tr key={currentTrimSection.id === 'trimPortSize' ? `${item.code}-${item.unit}-${index}` : `${item.code}-${index}`}>
                                    <td>{item.code}</td>
                                    <td>{item.name}</td>
                                    {currentTrimSection.id === 'trimPortSize' && <td>{item.unit}</td>} {/* Conditionally render unit for Port Size */}
                                    <td>
                                        <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openModal(currentTrimSection.id as 'trimType' | 'trimSeries' | 'trimPortSize' | 'trimForm' | 'trimMaterial' | 'trimOption', 'edit', item); }}>수정</button>
                                        <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete(currentTrimSection.id as 'trimType' | 'trimSeries' | 'trimPortSize' | 'trimForm' | 'trimMaterial' | 'trimOption', item); }}>삭제</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
      case 'act':
        const currentActSection = actuatorSections.find(s => s.id === selectedActSection);
        if (!currentActSection) return null; // Should not happen

        return (
            <div className="content-wrapper">
                <div className="section-selector">
                    <h3>Actuator 섹션 선택</h3>
                    <div className="section-buttons">
                        {actuatorSections.map((section) => (
                        <button
                            key={section.id}
                            className={`section-button ${selectedActSection === section.id ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedActSection(section.id);
                                setSelectedActSeriesCode(null); // Reset selected series when changing act sections
                            }}
                        >
                            {section.name}
                        </button>
                        ))}
                    </div>
                </div>
                {selectedActSection === 'actSeries' ? (
                    <div className="accessory-grid"> {/* Reusing accessory-grid for two columns */} 
                        <div className="table-area">
                            <div className="table-header">
                                <h3>Series</h3>
                                <div className="controls">
                                    <input type="text" placeholder="검색..." className="search-input"/>
                                    <button className="control-btn" onClick={fetchData}>새로고침</button>
                                    <button className="control-btn add-btn" onClick={() => openModal('actSeries', 'add')}>+ 추가</button>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th key="code">Code*</th>
                                        <th key="name">NAME</th>
                                        <th key="actions">작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actSeriesData.map(item => (
                                        <tr 
                                            key={item.code} 
                                            onClick={() => handleActSeriesSelect(item.code)}
                                            className={selectedActSeriesCode === item.code ? 'selected' : ''}
                                        >
                                            <td>{item.code}</td>
                                            <td>{item.name}</td>
                                            <td>
                                                <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); openModal('actSeries', 'edit', item); }}>수정</button>
                                                <button className="action-btn delete-btn" onClick={(e) => { e.stopPropagation(); handleDelete('actSeries', item); }}>삭제</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {selectedActSeriesCode && (
                            <div className="table-area">
                                <div className="table-header">
                                    <h3>Size</h3>
                                    <div className="controls">
                                        <input type="text" placeholder="검색..." className="search-input"/>
                                        <button className="control-btn" onClick={() => selectedActSeriesCode && fetchData()}>새로고침</button>
                                        <button className="control-btn add-btn" onClick={() => openModal('actSize', 'add')} disabled={!selectedActSeriesCode}>+ 추가</button>
                                    </div>
                                </div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th key="code">Code*</th>
                                            <th key="name">NAME</th>
                                            <th key="actions">작업</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {actSizeData
                                            .filter(item => item.seriesCode === selectedActSeriesCode) // Filter sizes by selected series
                                            .map(item => (
                                                <tr key={item.code}>
                                                    <td>{item.code}</td>
                                                    <td>{item.name}</td>
                                                    <td>
                                                        <button className="action-btn edit-btn" onClick={() => openModal('actSize', 'edit', item)}>수정</button>
                                                        <button className="action-btn delete-btn" onClick={() => handleDelete('actSize', item)}>삭제</button>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="table-area">
                        <div className="table-header">
                            <h3>{currentActSection?.name}</h3>
                            <div className="controls">
                                <input type="text" placeholder="검색..." className="search-input"/>
                                <button className="control-btn" onClick={fetchData}>새로고침</button>
                                <button className="control-btn add-btn" onClick={() => openModal(currentActSection.id === 'actType' ? 'actType' : 'actHW', 'add')}>+ 추가</button>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    {currentActSection?.columns && currentActSection.columns.map(col => <th key={col.key}>{col.label}</th>)}
                                    <th>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(selectedActSection === 'actType' ? actTypeData : actHWData).map(item => (
                                    <tr key={item.code}>
                                        <td>{item.code}</td>
                                        <td>{item.name}</td>
                                        <td>
                                            <button className="action-btn edit-btn" onClick={() => openModal(currentActSection.id === 'actType' ? 'actType' : 'actHW', 'edit', item)}>수정</button>
                                            <button className="action-btn delete-btn" onClick={() => handleDelete(currentActSection.id === 'actType' ? 'actType' : 'actHW', item)}>삭제</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="new-accessory-management-page">
      <div className="main-tabs-container">
        <h3>대분류 선택</h3>
        <div className="main-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`main-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as 'body' | 'trim' | 'act' | 'accessory')}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      {renderContent()}
      {renderModal()}
    </div>
  );
};

export default NewAccessoryManagementPage;
