import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './AccessoryManagementPage.css';

interface MasterDataItem {
  category: string;
  code: string;
  name: string;
  unit?: string;
  series?: string;
}

interface NewItemFormState {
  code: string;
  name: string;
  unit?: string;
  series?: string;
}

// 필터 인터페이스 추가
interface FilterState {
  codeRange: {
    start: string;
    end: string;
  };
  nameSearch: string;
  categoryFilter: string;
  showOnlySpecial: boolean;
}

// API 응답 타입들
interface BodyBonnetItem {
  bonnetCode: string;
  bonnetType: string;
}

interface TrimTypeItem {
  trimTypeCode: string;
  trimType: string;
}

interface ActTypeItem {
  actTypeCode: string;
  actType: string;
}

interface AccTypeItem {
  accTypeCode: string;
  accType: string;
}

const AccessoryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'body' | 'trim' | 'act' | 'acc'>('body' as const);
  const [searchFilter, setSearchFilter] = useState('');
  const [masterData, setMasterData] = useState<MasterDataItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MasterDataItem | null>(null);
  const [newItem, setNewItem] = useState<NewItemFormState>({ code: '', name: '', unit: '', series: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 고급 필터 상태 추가
  const [filters, setFilters] = useState<FilterState>({
    codeRange: { start: '', end: '' },
    nameSearch: '',
    categoryFilter: '',
    showOnlySpecial: false
  });

  // Body 하위 섹션 선택 상태 추가
  const [selectedBodySection, setSelectedBodySection] = useState<string>('bonnet');
  const [selectedTrimSection, setSelectedTrimSection] = useState<string>('type');
  const [selectedActSection, setSelectedActSection] = useState<string>('type');
  const [selectedAccSection, setSelectedAccSection] = useState<string>('type');
  const [sizeUnits, setSizeUnits] = useState<string[]>([]);
  const [ratingUnits, setRatingUnits] = useState<string[]>([]);

  // 카테고리별 탭 정의
  const tabs = [
    { id: 'body', name: 'BODY', color: '#4CAF50' },
    { id: 'trim', name: 'TRIM', color: '#2196F3' },
    { id: 'act', name: 'ACT', color: '#FF9800' },
    { id: 'acc', name: 'ACC', color: '#9C27B0' }
  ];

  // Body 하위 섹션 정의
  const bodySections = [
    { id: 'valve', name: 'Valve Series', table: 'BodyValveList', codeField: 'ValveSeriesCode', nameField: 'ValveSeries' },
    { id: 'bonnet', name: 'Bonnet Type', table: 'BodyBonnetList', codeField: 'BonnetCode', nameField: 'BonnetType' },
    { id: 'material', name: 'Material', table: 'BodyMatList', codeField: 'BodyMatCode', nameField: 'BodyMat' },
    { id: 'size', name: 'Size', table: 'BodySizeList', codeField: 'BodySizeCode', nameField: 'BodySize', hasUnit: true },
    { id: 'rating', name: 'Rating', table: 'BodyRatingList', codeField: 'RatingCode', nameField: 'RatingName', hasUnit: true },
    { id: 'connection', name: 'Connection', table: 'BodyConnectionList', codeField: 'ConnectionCode', nameField: 'Connection' }
  ];

  // Trim 하위 섹션 정의
  const trimSections = [
    { id: 'type', name: 'Trim Type', table: 'TrimTypeList', codeField: 'TrimTypeCode', nameField: 'TrimType' },
    { id: 'series', name: 'Trim Series', table: 'TrimSeriesList', codeField: 'TrimSeriesCode', nameField: 'TrimSeries' },
    { id: 'portSize', name: 'Port Size', table: 'TrimPortSizeList', codeField: 'TrimPortSizeCode', nameField: 'TrimPortSize' },
    { id: 'form', name: 'Trim Form', table: 'TrimFormList', codeField: 'TrimFormCode', nameField: 'TrimForm' },
    { id: 'material', name: 'Trim Material', table: 'TrimMatList', codeField: 'TrimMatCode', nameField: 'TrimMat' },
    { id: 'option', name: 'Trim Option', table: 'TrimOptionList', codeField: 'TrimOptionCode', nameField: 'TrimOptionName' }
  ];

  // Act 하위 섹션 정의
  const actSections = [
    { id: 'type', name: 'Action Type', table: 'ActTypeList', codeField: 'ActTypeCode', nameField: 'ActType' },
    { id: 'series-size', name: 'Act Series-Size', table: 'ActSeriesSizeList', codeField: 'ActSeriesSizeCode', nameField: 'ActSeriesSize', hasUnit: true },
    { id: 'hw', name: 'H.W.', table: 'ActHWList', codeField: 'ActHWCode', nameField: 'ActHW' }
  ];

  // Acc 하위 섹션 정의 - 백엔드 API에 맞춰 3개 섹션으로 수정
  const accSections = [
    { id: 'type', name: 'Acc Type', table: 'AccTypeList', codeField: 'AccTypeCode', nameField: 'AccTypeName' },
    { id: 'maker', name: 'Acc Maker', table: 'AccMakerList', codeField: 'AccMakerCode', nameField: 'AccMakerName' },
    { id: 'model', name: 'Acc Model', table: 'AccModelList', codeField: 'AccModelCode', nameField: 'AccModelName' }
  ];

  // API 엔드포인트 매핑
  const getApiEndpoint = (category: string) => {
    // category가 undefined이거나 빈 문자열인 경우 처리
    if (!category || category.trim() === '') {
      console.warn('getApiEndpoint: 카테고리가 정의되지 않았습니다.');
      return null;
    }

    switch (category) {
      case 'body':
        return 'http://localhost:5135/api/masterdata/body-bonnet';
      case 'trim':
        return 'http://localhost:5135/api/masterdata/trim/type';
      case 'act':
        return 'http://localhost:5135/api/masterdata/act/type';
      case 'acc':
        return 'http://localhost:5135/api/masterdata/acc-type';
      default:
        console.warn(`getApiEndpoint: 알 수 없는 카테고리입니다: ${category}`);
        return null;
    }
  };

  // Body 섹션별 API 엔드포인트
  const getBodyApiEndpoint = (section: string) => {
    // section이 undefined이거나 빈 문자열인 경우 처리
    if (!section || section.trim() === '') {
      console.warn('getBodyApiEndpoint: 섹션이 정의되지 않았습니다.');
      return null;
    }

    const sectionInfo = bodySections.find(s => s.id === section);
    if (!sectionInfo) {
      console.warn(`getBodyApiEndpoint: 알 수 없는 섹션입니다: ${section}`);
      return null;
    }
    
    return `http://localhost:5135/api/masterdata/body/${section}`;
  };

  // Trim 섹션별 API 엔드포인트
  const getTrimApiEndpoint = (section: string) => {
    // section이 undefined이거나 빈 문자열인 경우 처리
    if (!section || section.trim() === '') {
      console.warn('getTrimApiEndpoint: 섹션이 정의되지 않았습니다.');
      return null;
    }

    const sectionInfo = trimSections.find(s => s.id === section);
    if (!sectionInfo) {
      console.warn(`getTrimApiEndpoint: 알 수 없는 섹션입니다: ${section}`);
      return null;
    }
    
    // section 이름을 백엔드 엔드포인트에 맞게 변환
    const endpointMap: { [key: string]: string } = {
      'type': 'trim-type',
      'series': 'trim/series', 
      'portSize': 'trim/port-size',
      'form': 'trim/form',
      'material': 'trim/material',
      'option': 'trim/option'
    };
    
    const endpoint = endpointMap[section];
    if (!endpoint) {
      console.warn(`getTrimApiEndpoint: 알 수 없는 섹션입니다: ${section}`);
      return null;
    }
    
    return `http://localhost:5135/api/masterdata/${endpoint}`;
  };

  // Act 섹션별 API 엔드포인트
  const getActApiEndpoint = (section: string) => {
    // section이 undefined이거나 빈 문자열인 경우 처리
    if (!section || section.trim() === '') {
      console.warn('getActApiEndpoint: 섹션이 정의되지 않았습니다.');
      return null;
    }

    const endpointMap: { [key: string]: string } = {
      'type': 'act-type',
      'series-size': 'act/series-size',
      'hw': 'act/hw'
    };
    
    const endpoint = endpointMap[section];
    if (!endpoint) {
      console.warn(`getActApiEndpoint: 알 수 없는 섹션입니다: ${section}`);
      return null;
    }
    
    return `http://localhost:5135/api/masterdata/${endpoint}`;
  };

  // Acc 섹션별 API 엔드포인트
  const getAccApiEndpoint = (section: string) => {
    // section이 undefined이거나 빈 문자열인 경우 처리
    if (!section || section.trim() === '') {
      console.warn('getAccApiEndpoint: 섹션이 정의되지 않았습니다.');
      return null;
    }

    // 백엔드 API 구조에 맞춰 엔드포인트 반환
    switch (section) {
      case 'type':
        return 'http://localhost:5135/api/masterdata/acc-type';
      case 'maker':
        return 'http://localhost:5135/api/masterdata/acc/maker';
      case 'model':
        return 'http://localhost:5135/api/masterdata/acc/model';
      default:
        console.warn(`getAccApiEndpoint: 알 수 없는 섹션입니다: ${section}`);
        return null;
    }
  };

  // 마스터 데이터 로드
  const loadMasterData = useCallback(async (category: string) => {
    // category가 undefined이거나 빈 문자열인 경우 처리
    if (!category || category.trim() === '') {
      console.warn('카테고리가 정의되지 않았습니다.');
      setError('카테고리를 선택해주세요.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let endpoint;
      let selectedSection: string;
      
      if (category === 'body') {
        selectedSection = selectedBodySection || 'bonnet';
        endpoint = getBodyApiEndpoint(selectedSection);
        // Unit 목록도 함께 로드
        await loadUnitData();
      } else if (category === 'trim') {
        selectedSection = selectedTrimSection || 'type';
        endpoint = getTrimApiEndpoint(selectedSection);
        // Unit이 필요한 섹션인 경우 Unit 데이터도 로드
        if (selectedSection === 'portSize' || selectedSection === 'material') {
          await loadUnitData();
        }
      } else if (category === 'act') {
        selectedSection = selectedActSection || 'type';
        endpoint = getActApiEndpoint(selectedSection);
        // Act Series-Size 섹션에서만 Unit 데이터 로드
        if (selectedSection === 'series-size') {
          await loadUnitData();
        }
      } else if (category === 'acc') {
        selectedSection = selectedAccSection || 'type';
        endpoint = getAccApiEndpoint(selectedSection);
        // Acc는 Unit이 필요하지 않음
      } else {
        selectedSection = '';
        endpoint = getApiEndpoint(category);
      }
      
      // endpoint가 null인 경우 처리
      if (!endpoint) {
        throw new Error(`API 엔드포인트를 찾을 수 없습니다. 카테고리: ${category}, 섹션: ${selectedSection}`);
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      let transformedData;
      if (category === 'body') {
        transformedData = transformBodyData(data, selectedSection);
      } else if (category === 'trim') {
        transformedData = transformTrimData(data, selectedSection);
      } else if (category === 'act') {
        transformedData = transformActData(data, selectedSection);
      } else if (category === 'acc') {
        transformedData = transformAccData(data, selectedSection);
      } else {
        transformedData = transformApiData(data, category);
      }
      setMasterData(transformedData);
    } catch (err) {
      console.error('마스터 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setMasterData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBodySection, selectedTrimSection, selectedActSection, selectedAccSection]);

  // Unit 데이터 로드
  const loadUnitData = async () => {
    try {
      const [sizeResponse, ratingResponse] = await Promise.all([
        fetch('http://localhost:5135/api/masterdata/body/size-units'),
        fetch('http://localhost:5135/api/masterdata/body/rating-units')
      ]);
      
      if (sizeResponse.ok) {
        const sizeData = await sizeResponse.json();
        setSizeUnits(sizeData);
      }
      
      if (ratingResponse.ok) {
        const ratingData = await ratingResponse.json();
        setRatingUnits(ratingData);
      }
    } catch (error) {
      console.error('Unit 데이터 로드 실패:', error);
    }
  };

  // Body 섹션 데이터 로드
  const loadBodySectionData = useCallback(async (section: string) => {
    if (activeTab !== 'body') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = getBodyApiEndpoint(section);
      if (!endpoint) {
        throw new Error('잘못된 Body 섹션입니다.');
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      const transformedData = transformBodyData(data, section);
      setMasterData(transformedData);
      
      // Unit이 필요한 섹션인 경우 Unit 데이터도 로드
      if (section === 'size' || section === 'rating') {
        await loadUnitData();
      }
    } catch (err) {
      console.error('Body 섹션 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setMasterData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Acc 섹션 데이터 로드
  const loadAccSectionData = useCallback(async (section: string) => {
    if (activeTab !== 'acc') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = getAccApiEndpoint(section);
      if (!endpoint) {
        throw new Error('잘못된 Acc 섹션입니다.');
      }

      console.log(`Acc 섹션 데이터 로드: ${section}, 엔드포인트: ${endpoint}`);
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Acc 섹션 ${section} 데이터:`, data);
      
      const transformedData = transformAccData(data, section);
      setMasterData(transformedData);
    } catch (err) {
      console.error('Acc 섹션 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setMasterData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Trim 섹션 데이터 로드
  const loadTrimSectionData = useCallback(async (section: string) => {
    if (activeTab !== 'trim') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = getTrimApiEndpoint(section);
      if (!endpoint) {
        throw new Error('잘못된 Trim 섹션입니다.');
      }

      console.log(`Trim 섹션 데이터 로드: ${section}, 엔드포인트: ${endpoint}`);
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Trim 섹션 ${section} 데이터:`, data);
      
      const transformedData = transformTrimData(data, section);
      setMasterData(transformedData);
    } catch (err) {
      console.error('Trim 섹션 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setMasterData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Act Series와 Size 데이터를 조합하는 함수
  const combineActSeriesSizeData = useCallback(async () => {
    try {
      console.log('Act Series-size 데이터 결합 시작');
      
      const [seriesResponse, sizeResponse] = await Promise.all([
        fetch('http://localhost:5135/api/masterdata/act/series'),
        fetch('http://localhost:5135/api/masterdata/act/series-size')
      ]);

      if (!seriesResponse.ok || !sizeResponse.ok) {
        throw new Error(`API 호출 실패: series=${seriesResponse.status}, size=${sizeResponse.status}`);
      }

      const seriesData = await seriesResponse.json();
      const sizeData = await sizeResponse.json();
      
      console.log('Series 데이터:', seriesData);
      console.log('Size 데이터:', sizeData);

      const combinedData: MasterDataItem[] = [];

      sizeData.forEach((size: any) => {
        console.log('처리 중인 size 항목:', size);
        
        // 백엔드에서 제공하는 seriesCode를 직접 사용
        const seriesCode = size.seriesCode || size.actSeriesCode;
        
        if (seriesCode) {
          const seriesItem = seriesData.find((series: any) => series.actSeriesCode === seriesCode);
          
          if (seriesItem) {
            const combinedItem: MasterDataItem = {
              category: 'act',
              code: seriesCode,
              series: seriesItem.actSeries,
              name: size.code,
              unit: size.name
            };
            combinedData.push(combinedItem);
          } else {
            console.warn(`⚠️ 매칭 실패: seriesCode ${seriesCode}에 해당하는 series를 찾을 수 없음`);
          }
        } else {
          console.warn(`⚠️ 매칭 실패: size ${size.name}에 seriesCode가 없음`);
        }
      });

      console.log('결합된 데이터:', combinedData);
      setMasterData(combinedData);
    } catch (error) {
      console.error('Act Series-size 데이터 결합 실패:', error);
      setError('데이터 로드에 실패했습니다.');
    }
  }, []);

  // Act 섹션 데이터 로드
  const loadActSectionData = useCallback(async (section: string) => {
    if (activeTab !== 'act') return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (section === 'series-size') {
        
        // Series-size 섹션일 때는 Series와 Size 데이터를 모두 가져옴
        await combineActSeriesSizeData();
      } else {
        // 다른 섹션은 기존 방식대로 처리
        const endpoint = getActApiEndpoint(section);
        if (!endpoint) {
          throw new Error('잘못된 Act 섹션입니다.');
        }

        console.log(`Act 섹션 데이터 로드: ${section}, 엔드포인트: ${endpoint}`);
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`API 호출 실패: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Act 섹션 ${section} 데이터:`, data);
        
        const transformedData = transformActData(data, section);
        setMasterData(transformedData);
      }
    } catch (err) {
      console.error('Act 섹션 데이터 로드 실패:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setMasterData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, combineActSeriesSizeData]);

  // 데이터 변환 함수
  const transformApiData = (data: any[], category: string): MasterDataItem[] => {
    return data.map(item => {
      switch (category) {
        case 'body':
          return {
            code: (item as BodyBonnetItem).bonnetCode,
            name: (item as BodyBonnetItem).bonnetType,
            category: 'body'
          };
        case 'trim':
          return {
            code: (item as TrimTypeItem).trimTypeCode,
            name: (item as TrimTypeItem).trimType,
            category: 'trim'
          };
        case 'act':
          return {
            code: (item as ActTypeItem).actTypeCode,
            name: (item as ActTypeItem).actType,
            category: 'act'
          };
        case 'acc':
          return {
            code: (item as AccTypeItem).accTypeCode,
            name: (item as AccTypeItem).accType,
            category: 'acc'
          };
        default:
          return item;
      }
    });
  };

  // Body 데이터 변환
  const transformBodyData = (data: any[], section: string): MasterDataItem[] => {
    const sectionInfo = bodySections.find(s => s.id === section);
    if (!sectionInfo) return [];

    return data.map(item => {
      let code = '';
      let name = '';
      let unit = undefined;

      switch (section) {
        case 'valve':
          code = item.valveSeriesCode || '';
          name = item.valveSeries || '';
          break;
        case 'bonnet':
          code = item.bonnetCode || '';
          name = item.bonnet || '';
          break;
        case 'material':
          code = item.bodyMatCode || '';
          name = item.bodyMat || '';
          break;
        case 'size':
          code = item.bodySizeCode || '';
          name = item.bodySize || '';
          unit = item.sizeUnit || '';
          console.log('Size 변환 - 원본 item:', item);
          console.log('Size 변환 - 변환된 데이터:', { code, name, unit });
          break;
        case 'rating':
          code = item.ratingCode || '';
          name = item.ratingName || '';
          // RatingUnit에서 rating과 unit을 분리
          const ratingUnit = item.ratingUnit || '';
          const parts = ratingUnit.split(' ');
          if (parts.length >= 2) {
            name = parts[0] || '';
            unit = parts.slice(1).join(' ') || '';
          } else {
            name = ratingUnit;
            unit = '';
          }
          break;
        case 'connection':
          code = item.connectionCode || '';
          name = item.connection || '';
          break;
        default:
          code = item[sectionInfo.codeField] || '';
          name = item[sectionInfo.nameField] || '';
      }

      return {
        category: 'body',
        code,
        name,
        unit
      };
    });
  };

  // Trim 데이터 변환 함수
  const transformTrimData = (data: any[], section: string): MasterDataItem[] => {
    return data.map(item => {
      let code = '';
      let name = '';
      let unit = '';

      switch (section) {
        case 'type':
          code = item.trimTypeCode || '';
          name = item.trimType || '';
          break;
        case 'series':
          code = item.trimSeriesCode || '';
          name = item.trimSeries || '';
          break;
        case 'portSize':
          code = item.portSizeCode || '';
          name = item.portSize || '';
          unit = item.portSizeUnit || '';
          break;
        case 'form':
          code = item.trimFormCode || '';
          name = item.trimForm || '';
          break;
        case 'material':
          code = item.trimMatCode || '';
          name = item.trimMat || '';
          break;
        case 'option':
          code = item.trimOptionCode || '';
          name = item.trimOptionName || '';
          break;
        default:
          code = item.code || '';
          name = item.name || '';
      }

      return {
        category: 'trim',
        code,
        name,
        unit
      };
    });
  };

  // Act 데이터 변환 함수
  const transformActData = (data: any[], section: string): MasterDataItem[] => {
    return data.map(item => {
      let code = '';
      let name = '';
      let unit = '';

      switch (section) {
        case 'type':
          code = item.actTypeCode || '';
          name = item.actType || '';
          break;
        case 'series':
          code = item.actSeriesCode || '';
          name = item.actSeries || '';
          break;
        case 'series-size':
          // series-size는 combineActSeriesSizeData 함수에서 처리됨
          // code는 Series Code, name은 Size Code, unit은 Size
          code = item.code || '';
          name = item.name || '';
          unit = item.unit || '';
          break;
        case 'hw':
          code = item.hwCode || '';
          name = item.hw || '';
          break;
        default:
          code = item.code || '';
          name = item.name || '';
      }

      return {
        category: 'act',
        code,
        name,
        unit
      };
    });
  };

  // Acc 데이터 변환
  const transformAccData = (data: any[], section: string): MasterDataItem[] => {
    return data.map(item => {
      let code: string = '';
      let name: string = '';
      let series: string | undefined = undefined; // maker, model은 series가 있을 수 있음

      switch (section) {
        case 'type':
          code = item.accTypeCode || '';
          name = item.accTypeName || '';
          break;
        case 'maker':
          code = item.accMakerCode || '';
          name = item.accMakerName || '';
          series = item.accTypeCode || ''; // series 필드에 Type 코드를 할당
          break;
        case 'model':
          code = item.accModelCode || '';
          name = item.accModelName || '';
          series = item.accMakerCode || ''; // series 필드에 Maker 코드를 할당
          break;
        default:
          code = item.accTypeCode || item.accMakerCode || item.accModelCode || '';
          name = item.accTypeName || item.accMakerName || item.accModelName || '';
      }

      return {
        category: 'acc',
        code,
        name,
        series
      };
    });
  };

  // 섹션별 테이블 헤더 반환
  const getTableHeaders = () => {
    if (activeTab === 'body') {
      switch (selectedBodySection) {
        case 'valve':
          return ['코드', 'Valve Series'];
        case 'bonnet':
          return ['코드', 'Bonnet Type'];
        case 'material':
          return ['코드', 'Material'];
        case 'size':
          return ['코드', 'Size', 'Unit'];
        case 'rating':
          return ['코드', 'Rating', 'Unit'];
        case 'connection':
          return ['코드', 'Connection'];
        default:
          return ['코드', '이름'];
      }
    } else if (activeTab === 'trim') {
      switch (selectedTrimSection) {
        case 'type':
          return ['코드', 'Trim Type'];
        case 'series':
          return ['코드', 'Trim Series'];
        case 'portSize':
          return ['코드', 'Port Size'];
        case 'form':
          return ['코드', 'Trim Form'];
        case 'material':
          return ['코드', 'Trim Material'];
        case 'option':
          return ['코드', 'Trim Option'];
        default:
          return ['코드', '이름'];
      }
    } else if (activeTab === 'act') {
      switch (selectedActSection) {
        case 'type':
          return ['코드', 'Action Type'];
        case 'series-size':
          return ['Series Code', 'Series', 'Size Code', 'Size'];
        case 'hw':
          return ['코드', 'H.W.'];
        default:
          return ['코드', '이름'];
      }
    } else if (activeTab === 'acc') {
      switch (selectedAccSection) {
        case 'type':
          return ['코드', 'Acc Type'];
        case 'maker':
          return ['코드', 'Acc Maker', 'Acc Type'];
        case 'model':
          return ['코드', 'Acc Model', 'Acc Maker'];
        default:
          return ['코드', '이름'];
      }
    }
    
    return ['코드', '이름'];
  };

  // 섹션별 컬럼명 반환
  const getColumnLabels = () => {
    if (activeTab === 'body') {
      switch (selectedBodySection) {
        case 'valve':
          return { code: '코드', name: 'Valve Series'};
        case 'bonnet':
          return { code: '코드', name: 'Bonnet Type'};
        case 'material':
          return { code: '코드', name: 'Material'};
        case 'size':
          return { code: '코드', name: 'Size' };
        case 'rating':
          return { code: '코드', name: 'Rating' };
        case 'connection':
          return { code: '코드', name: 'Connection' };
        default:
          return { code: '코드', name: '이름' };
      }
    } else if (activeTab === 'trim') {
      switch (selectedTrimSection) {
        case 'type':
          return { code: '코드', name: 'Trim Type'};
        case 'series':
          return { code: '코드', name: 'Trim Series'};
        case 'portSize':
          return { code: '코드', name: 'Port Size'};
        case 'form':
          return { code: '코드', name: 'Trim Form'};
        case 'material':
          return { code: '코드', name: 'Trim Material'};
        case 'option':
          return { code: '코드', name: 'Trim Option'};
        default:
          return { code: '코드', name: '이름' };
      }
    } else if (activeTab === 'act') {
      switch (selectedActSection) {
        case 'type':
          return { code: '코드', name: 'Action Type'};
        case 'series-size':
          return { code: 'Series Code', name: 'Series'};
        case 'hw':
          return { code: '코드', name: 'H.W.'};
        default:
          return { code: '코드', name: '이름' };
      }
    } else if (activeTab === 'acc') {
      switch (selectedAccSection) {
        case 'type':
          return { code: '코드', name: 'Acc Type'};
        case 'maker':
          return { code: '코드', name: 'Acc Maker'};
        case 'model':
          return { code: '코드', name: 'Acc Model'};
        default:
          return { code: '코드', name: '제조사' };
      }
    }
    
    return { code: '코드', name: '이름' };
  };

  useEffect(() => {
    // activeTab이 유효한 값인 경우에만 loadMasterData 호출
    if (activeTab && ['body', 'trim', 'act', 'acc'].includes(activeTab)) {
      // ACT 탭의 경우 기본 섹션(type) 데이터를 로드
      if (activeTab === 'act') {
        loadActSectionData('type');
      } else {
        loadMasterData(activeTab);
      }
    }
  }, [activeTab, loadMasterData, loadActSectionData]);

  // Body 섹션 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'body' && selectedBodySection && selectedBodySection.trim() !== '') {
      loadBodySectionData(selectedBodySection);
    }
  }, [activeTab, selectedBodySection, loadBodySectionData]);

  // Acc 섹션 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'acc' && selectedAccSection && selectedAccSection.trim() !== '') {
      loadAccSectionData(selectedAccSection);
    }
  }, [activeTab, selectedAccSection, loadAccSectionData]);

  // Trim 섹션 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'trim' && selectedTrimSection && selectedTrimSection.trim() !== '') {
      loadTrimSectionData(selectedTrimSection);
    }
  }, [activeTab, selectedTrimSection, loadTrimSectionData]);

  // Act 섹션 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'act' && selectedActSection && selectedActSection.trim() !== '') {
      loadActSectionData(selectedActSection);
    }
  }, [activeTab, selectedActSection, loadActSectionData]);

  // 필터링된 데이터 계산
  const filteredData = useMemo(() => {
    let filtered = masterData;

    // 코드 범위 필터
    if (filters.codeRange.start || filters.codeRange.end) {
      filtered = filtered.filter(item => {
        const code = item.code;
        const start = filters.codeRange.start;
        const end = filters.codeRange.end;
        
        if (start && end) {
          return code >= start && code <= end;
        } else if (start) {
          return code >= start;
        } else if (end) {
          return code <= end;
        }
        return true;
      });
    }

    // 이름 검색 필터
    if (filters.nameSearch) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(filters.nameSearch.toLowerCase())
      );
    }

    // 카테고리 필터
    if (filters.categoryFilter) {
      filtered = filtered.filter(item => {
        if (filters.categoryFilter === 'standard') {
          return !item.name.toLowerCase().includes('special') && 
                 !item.name.toLowerCase().includes('none');
        } else if (filters.categoryFilter === 'special') {
          return item.name.toLowerCase().includes('special');
        } else if (filters.categoryFilter === 'none') {
          return item.name.toLowerCase().includes('none');
        }
        return true;
      });
    }

    // SPECIAL만 표시
    if (filters.showOnlySpecial) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes('special')
      );
    }

    return filtered;
  }, [masterData, filters]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'body' | 'trim' | 'act' | 'acc');
    setSearchFilter(''); // 탭 변경 시 검색어 초기화
    setNewItem(prev => ({ ...prev, category: tabId }));
    
    // 탭 변경 시 기본 섹션 설정
    if (tabId === 'body') {
      setSelectedBodySection('bonnet');
    } else if (tabId === 'acc') {
      setSelectedAccSection('type');
    } else if (tabId === 'trim') {
      setSelectedTrimSection('type');
    } else if (tabId === 'act') {
      setSelectedActSection('type'); // ACT 탭에서는 type을 기본으로 선택
    }
  };

  // Acc 섹션 변경 핸들러
  const handleAccSectionChange = (section: string) => {
    setSelectedAccSection(section);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.target.value);
  };

  const handleAddItem = async () => {
    if (newItem.code && newItem.name) {
      try {
        let endpoint;
        let requestBody;
        
        if (activeTab === 'body') {
          // Body 섹션의 경우 특별한 엔드포인트와 요청 본문 사용
          endpoint = `http://localhost:5135/api/masterdata/body/${selectedBodySection}`;
          
          // Body 섹션별로 다른 요청 본문 구조 사용
          switch (selectedBodySection) {
            case 'size':
              requestBody = {
                unit: newItem.unit || 'INCH', // unit 필드 사용
                code: newItem.code,
                name: newItem.name
              };
              break;
            case 'rating':
              requestBody = {
                code: newItem.code,
                name: newItem.name,
                unit: newItem.unit || 'PSI' // unit 필드 사용
              };
              break;
            default:
              requestBody = {
                code: newItem.code,
                name: newItem.name
              };
              break;
          }
        } else if (activeTab === 'act' && selectedActSection === 'series-size') {
          // ACT Series-size 섹션의 경우 새로운 Series + Size 추가
          // 1. Series가 존재하는지 확인
          // 2. 없으면 Series 먼저 생성
          // 3. Size 추가
          
          if (!newItem.series || !newItem.name || !newItem.code || !newItem.unit) {
            setError('모든 필드를 입력해주세요.');
            return;
          }
          
          try {
            // 1단계: Series 존재 여부 확인 및 생성
            const seriesEndpoint = 'http://localhost:5135/api/masterdata/act/series';
            const seriesResponse = await fetch(seriesEndpoint);
            
            if (seriesResponse.ok) {
              const existingSeries = await seriesResponse.json();
              const seriesExists = existingSeries.some((s: any) => s.actSeriesCode === newItem.series);
              
              if (!seriesExists) {
                // Series가 없으면 먼저 생성
                const createSeriesResponse = await fetch(seriesEndpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    actSeriesCode: newItem.series,
                    actSeries: newItem.name
                  })
                });
                
                if (!createSeriesResponse.ok) {
                  throw new Error('Series 생성에 실패했습니다.');
                }
                console.log('새로운 Series 생성 완료:', newItem.series);
              }
            }
            
            // 2단계: Size 추가
            endpoint = getActApiEndpoint('series-size');
            if (!endpoint) {
              throw new Error('잘못된 Act 섹션입니다.');
            }
            
            requestBody = {
              actSeriesCode: newItem.series,
              actSizeCode: newItem.code,
              actSize: newItem.unit
            };
          } catch (error) {
            console.error('Series/Size 추가 실패:', error);
            setError(error instanceof Error ? error.message : 'Series/Size 추가에 실패했습니다.');
            return;
          }
        } else {
          // 다른 카테고리의 경우 기존 로직 사용
          endpoint = getApiEndpoint(activeTab);
          if (!endpoint) {
            throw new Error('잘못된 카테고리입니다.');
          }
          
          requestBody = {
            code: newItem.code,
            name: newItem.name
          };
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error('추가 실패');
        }

        // 성공 시 모달 닫기 및 데이터 새로고침
        setIsAddModalOpen(false);
        setNewItem({ code: '', name: '', unit: '', series: '' });
        
        if (activeTab === 'body') {
          loadBodySectionData(selectedBodySection);
        } else if (activeTab === 'act' && selectedActSection === 'series-size') {
          loadActSectionData('series-size');
        } else {
          loadMasterData(activeTab);
        }
      } catch (error) {
        console.error('추가 실패:', error);
        setError(error instanceof Error ? error.message : '추가 중 오류가 발생했습니다.');
      }
    }
  };

  const handleEditItem = (item: MasterDataItem) => {
    setSelectedItem(item);
    setNewItem({ 
      ...item, 
      unit: (item as any).unit || '',
      series: (item as any).series || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async () => {
    if (selectedItem && newItem.code && newItem.name) {
      try {
        let endpoint;
        let requestBody;
        
        if (activeTab === 'body') {
          // Body 섹션의 경우 특별한 엔드포인트와 요청 본문 사용
          endpoint = `http://localhost:5135/api/masterdata/body/${selectedBodySection}/${selectedItem.code}`;
          
          // Body 섹션별로 다른 요청 본문 구조 사용
          switch (selectedBodySection) {
            case 'size':
              requestBody = {
                unit: newItem.unit || 'INCH', // unit 필드 사용
                code: newItem.code,
                name: newItem.name
              };
              break;
            case 'rating':
              requestBody = {
                code: newItem.code,
                name: newItem.name,
                unit: newItem.unit || 'PSI' // unit 필드 사용
              };
              break;
            default:
              requestBody = {
                code: newItem.code,
                name: newItem.name
              };
              break;
          }
        } else if (activeTab === 'act' && selectedActSection === 'series-size') {
          // ACT Series-size 섹션의 경우 Size만 수정 가능 (Series는 수정 불가)
          endpoint = getActApiEndpoint('series-size');
          if (!endpoint) {
            throw new Error('잘못된 Act 섹션입니다.');
          }
          
          // Size 수정 시에는 기존 Series Code를 유지하고 Size만 수정
          requestBody = {
            actSeriesCode: selectedItem.series || '', // 기존 Series Code 유지
            actSizeCode: newItem.code,               // 새로운 Size Code
            actSize: newItem.unit                    // 새로운 Size Name
          };
        } else {
          // 다른 카테고리의 경우 기존 로직 사용
          endpoint = getApiEndpoint(activeTab);
          endpoint = `${endpoint}/${selectedItem.code}`;
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: newItem.code,
              name: newItem.name
            })
          });

          if (!response.ok) {
            throw new Error('수정 실패');
          }

          // 성공 시 데이터 다시 로드
          const currentTab = activeTab as 'body' | 'trim' | 'act' | 'acc';
          if (currentTab === 'body') {
            await loadBodySectionData(selectedBodySection);
          } else if (currentTab === 'act' && selectedActSection === 'series-size') {
            await loadActSectionData('series-size');
          } else if (currentTab === 'act') {
            await loadActSectionData(selectedActSection);
          } else if (currentTab === 'trim') {
            await loadTrimSectionData(selectedTrimSection);
          } else if (currentTab === 'acc') {
            await loadAccSectionData(selectedAccSection);
          }
          setIsEditModalOpen(false);
          setSelectedItem(null);
          setNewItem({ code: '', name: '', unit: '', series: '' });
          return;
        }
        
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          throw new Error('수정 실패');
        }

        // 성공 시 데이터 다시 로드
        const currentTab = activeTab as 'body' | 'trim' | 'act' | 'acc';
        if (currentTab === 'body') {
          await loadBodySectionData(selectedBodySection);
        } else if (currentTab === 'act' && selectedActSection === 'series-size') {
          await loadActSectionData('series-size');
        } else if (currentTab === 'act') {
          await loadActSectionData(selectedActSection);
        } else if (currentTab === 'trim') {
          await loadTrimSectionData(selectedTrimSection);
        } else if (currentTab === 'acc') {
          await loadAccSectionData(selectedAccSection);
        }
        setIsEditModalOpen(false);
        setSelectedItem(null);
        setNewItem({ code: '', name: '', unit: '', series: '' });
      } catch (err) {
        console.error('항목 수정 실패:', err);
        setError(err instanceof Error ? err.message : '수정에 실패했습니다.');
      }
    }
  };

  const handleDeleteItem = async (item: MasterDataItem) => {
    if (window.confirm(`정말로 "${item.name}" 항목을 삭제하시겠습니까?`)) {
      try {
        console.log('삭제 시작 - activeTab:', activeTab);
        console.log('삭제 시작 - selectedBodySection:', selectedBodySection);
        console.log('삭제 시작 - selectedActSection:', selectedActSection);
        console.log('삭제 시작 - selectedTrimSection:', selectedTrimSection);
        console.log('삭제 시작 - selectedAccSection:', selectedAccSection);
        
        let endpoint;
        
        if (activeTab === 'body') {
          // Body 섹션의 경우 특별한 엔드포인트 사용
          if (selectedBodySection === 'size') {
            // Size는 복합 PK이므로 unit과 code 모두 필요
            console.log('Size 삭제 - item:', item);
            console.log('Size 삭제 - item.unit:', item.unit);
            console.log('Size 삭제 - item.code:', item.code);
            
            if (!item.unit || item.unit === '') {
              setError('Size 항목의 Unit이 필요합니다.');
              return;
            }
            endpoint = `http://localhost:5135/api/masterdata/body/size/${item.unit}/${item.code}`;
            console.log('Size 삭제 - endpoint:', endpoint);
          } else {
            if (!selectedBodySection) {
              setError('Body 섹션이 선택되지 않았습니다.');
              return;
            }
            endpoint = `http://localhost:5135/api/masterdata/body/${selectedBodySection}/${item.code}`;
          }
        } else if (activeTab === 'act' && selectedActSection === 'series-size') {
          // ACT Series-size 섹션에서는 Size만 삭제 가능 (Series는 삭제 불가)
          // item.code는 Size Code, item.name은 Size Name
          if (!item.code || item.code === '') {
            setError('Size Code가 필요합니다.');
            return;
          }
          
          endpoint = getActApiEndpoint('series-size');
          if (!endpoint) {
            throw new Error('잘못된 Act 섹션입니다.');
          }
          endpoint = `${endpoint}/${item.code}`;
        } else if (activeTab === 'act') {
          // ACT의 다른 섹션들 (type, series, hw)
          if (!selectedActSection) {
            setError('Act 섹션이 선택되지 않았습니다.');
            return;
          }
          endpoint = getActApiEndpoint(selectedActSection);
          if (!endpoint) {
            throw new Error('잘못된 Act 섹션입니다.');
          }
          endpoint = `${endpoint}/${item.code}`;
        } else if (activeTab === 'trim') {
          // Trim 섹션들
          if (!selectedTrimSection) {
            setError('Trim 섹션이 선택되지 않았습니다.');
            return;
          }
          endpoint = getTrimApiEndpoint(selectedTrimSection);
          if (!endpoint) {
            throw new Error('잘못된 Trim 섹션입니다.');
          }
          endpoint = `${endpoint}/${item.code}`;
        } else if (activeTab === 'acc') {
          // Acc 섹션들
          if (!selectedAccSection) {
            setError('Acc 섹션이 선택되지 않았습니다.');
            return;
          }
          endpoint = getAccApiEndpoint(selectedAccSection);
          if (!endpoint) {
            throw new Error('잘못된 Acc 섹션입니다.');
          }
          endpoint = `${endpoint}/${item.code}`;
        } else {
          // 다른 카테고리의 경우 기존 로직 사용
          endpoint = getApiEndpoint(activeTab);
          endpoint = `${endpoint}/${item.code}`;
        }
        
        console.log('삭제 요청 - endpoint:', endpoint);
        console.log('삭제 요청 - item:', item);
        
        const response = await fetch(endpoint, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('삭제 실패 - status:', response.status);
          console.error('삭제 실패 - response:', errorText);
          throw new Error(`삭제 실패: ${response.status} - ${errorText}`);
        }

        // 성공 시 데이터 다시 로드
        try {
          const currentTab = activeTab as 'body' | 'trim' | 'act' | 'acc';
          if (currentTab === 'body') {
            await loadBodySectionData(selectedBodySection);
          } else if (currentTab === 'act' && selectedActSection === 'series-size') {
            await loadActSectionData('series-size');
          } else if (currentTab === 'acc') {
            await loadAccSectionData(selectedAccSection);
          } else if (currentTab === 'trim') {
            await loadTrimSectionData(selectedTrimSection);
          } else if (currentTab === 'act') {
            await loadActSectionData(selectedActSection);
          }
        } catch (reloadError) {
          console.error('데이터 재로드 실패:', reloadError);
          // 재로드 실패는 사용자에게 알리지 않음 (삭제는 성공했으므로)
        }
      } catch (err) {
        console.error('항목 삭제 실패:', err);
        setError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
      }
    }
  };

  const getCategoryTitle = () => {
    if (activeTab === 'acc') {
      const sectionNames: { [key: string]: string } = {
        'type': 'Acc Type',
        'maker': 'Acc Maker',
        'model': 'Acc Model'
      };
      return sectionNames[selectedAccSection] || 'Accessory';
    } else if (activeTab === 'trim') {
      const sectionNames: { [key: string]: string } = {
        'type': 'Trim Type',
        'series': 'Trim Series',
        'portSize': 'Port Size',
        'form': 'Trim Form',
        'material': 'Trim Material',
        'option': 'Trim Option'
      };
      return sectionNames[selectedTrimSection] || 'Trim';
    } else if (activeTab === 'act') {
      const sectionNames: { [key: string]: string } = {
        'type': 'Act Type',
        'series': 'Act Series',
        'series-size': 'Act Series & Size',
        'hw': 'H.W.'
      };
      return sectionNames[selectedActSection] || 'Act';
    }
    const tab = tabs.find(t => t.id === activeTab);
    return tab ? tab.name : 'Unknown';
  };

  const getCategoryColor = () => {
    const tab = tabs.find(t => t.id === activeTab);
    return tab ? tab.color : '#666';
  };

  const refreshData = () => {
    loadMasterData(activeTab);
  };

  return (
    <div className="accessory-management-page">
      <div className="page-header">
        <h1>악세사리 관리</h1>
        <p>BODY, TRIM, ACT, ACC 마스터 데이터 관리</p>
      </div>

      {/* 카테고리 탭 */}
      <div className="category-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            style={{ '--tab-color': tab.color } as React.CSSProperties}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Body 하위 섹션 선택 */}
      {activeTab === 'body' && (
        <div className="body-section-selector">
          <h3>Body 섹션 선택</h3>
          <div className="section-buttons">
            {bodySections.map(section => (
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
      )}

      {/* 고급 필터 섹션 추가 */}
      <div className="advanced-filters">
        <h3>고급 필터</h3>
        <div className="filter-row">
          <div className="filter-group">
            <label>코드 범위:</label>
            <input
              type="text"
              placeholder="시작 코드"
              value={filters.codeRange.start}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                codeRange: { ...prev.codeRange, start: e.target.value }
              }))}
              className="filter-input"
            />
            <span>~</span>
            <input
              type="text"
              placeholder="끝 코드"
              value={filters.codeRange.end}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                codeRange: { ...prev.codeRange, end: e.target.value }
              }))}
              className="filter-input"
            />
          </div>
          
          <div className="filter-group">
            <label>이름 검색:</label>
            <input
              type="text"
              placeholder="이름으로 검색..."
              value={filters.nameSearch}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                nameSearch: e.target.value
              }))}
              className="filter-input"
            />
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>카테고리:</label>
            <select
              value={filters.categoryFilter}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                categoryFilter: e.target.value
              }))}
              className="filter-select"
            >
              <option value="">전체</option>
              <option value="standard">일반</option>
              <option value="special">특수</option>
              <option value="none">None</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.showOnlySpecial}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  showOnlySpecial: e.target.checked
                }))}
              />
              SPECIAL만 표시
            </label>
          </div>
          
          <button
            className="clear-filters-button"
            onClick={() => setFilters({
              codeRange: { start: '', end: '' },
              nameSearch: '',
              categoryFilter: '',
              showOnlySpecial: false
            })}
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 섹션 선택 UI */}
      {activeTab === 'body' && (
        <div className="body-section-selector">
          <h3>Body 섹션 선택</h3>
          <div className="section-buttons">
            {bodySections.map(section => (
              <button
                key={section.id}
                className={`section-button ${selectedBodySection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedBodySection(section.id);
                  loadBodySectionData(section.id);
                }}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'trim' && (
        <div className="body-section-selector">
          <h3>Trim 섹션 선택</h3>
          <div className="section-buttons">
            {trimSections.map(section => (
              <button
                key={section.id}
                className={`section-button ${selectedTrimSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedTrimSection(section.id);
                  loadTrimSectionData(section.id);
                }}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'act' && (
        <div className="body-section-selector">
          <h3>Act 섹션 선택</h3>
          <div className="section-buttons">
            {actSections.map(section => (
              <button
                key={section.id}
                className={`section-button ${selectedActSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedActSection(section.id);
                  loadActSectionData(section.id);
                }}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'acc' && (
        <div className="body-section-selector">
          <h3>Acc 섹션 선택</h3>
          <div className="section-buttons">
            {accSections.map(section => (
              <button
                key={section.id}
                className={`section-button ${selectedAccSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAccSection(section.id);
                  loadAccSectionData(section.id);
                }}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>닫기</button>
        </div>
      )}

      {/* 검색 및 추가 버튼 */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder={`${getCategoryTitle()} 검색...`}
            value={searchFilter}
            onChange={handleSearchChange}
            className="search-input"
          />
          <i className="search-icon">🔍</i>
        </div>
        <div className="control-buttons">
          <button 
            className="refresh-button"
            onClick={() => {
              if (activeTab === 'body') {
                loadBodySectionData(selectedBodySection);
              } else if (activeTab === 'trim') {
                loadTrimSectionData(selectedTrimSection);
              } else if (activeTab === 'act') {
                loadActSectionData(selectedActSection);
              } else if (activeTab === 'acc') {
                loadAccSectionData(selectedAccSection);
              } else {
                refreshData();
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? '로딩 중...' : '🔄 새로고침'}
          </button>
          <button 
            className="add-button"
            onClick={() => setIsAddModalOpen(true)}
            style={{ backgroundColor: getCategoryColor() }}
          >
            + 새 항목 추가
          </button>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="data-table-container">
        {isLoading ? (
          <div className="loading">
            <p>데이터를 불러오는 중...</p>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  {getTableHeaders().map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={`${item.category}-${item.code}-${index}`}>
                    <td className="code-cell">
                      <span className="code-badge" style={{ backgroundColor: getCategoryColor() }}>
                        {item.code}
                      </span>
                    </td>
                    {/* ACT Series-size 섹션에서만 4개 컬럼 표시 */}
                    {activeTab === 'act' && selectedActSection === 'series-size' ? (
                      <>
                        <td className="series-cell">{item.series || '-'}</td>
                        <td className="name-cell">{item.name}</td>
                        <td className="unit-cell">{item.unit || '-'}</td>
                      </>
                    ) : (
                      <>
                        <td className="name-cell">{item.name}</td>
                        {/* Unit 컬럼 표시 (Body의 size와 rating, Trim의 portSize와 material에서만) */}
                        {((activeTab === 'body' && (selectedBodySection === 'size' || selectedBodySection === 'rating')) ||
                          (activeTab === 'trim' && (selectedTrimSection === 'portSize' || selectedTrimSection === 'material'))) && (
                          <td className="unit-cell">{item.unit || '-'}</td>
                        )}
                      </>
                    )}
                    <td className="actions-cell">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditItem(item)}
                      >
                        수정
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteItem(item)}
                      >
                        삭제
                      </button>
                    </td>
                    {/* ACC Maker/Model 섹션에서 추가 컬럼 표시 */}
                    {activeTab === 'acc' && (selectedAccSection === 'maker' || selectedAccSection === 'model') ? (
                      <td className="series-cell">{item.series || '-'}</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length === 0 && !isLoading && (
              <div className="no-data">
                <p>검색 결과가 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 추가 모달 */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>새 항목 추가</h3>
              <button 
                className="close-button"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            <div className="form-group">
                <label>{getColumnLabels().code} *</label>
                <div className="input-with-dropdown">
                  <input
                    type="text"
                    value={newItem.code}
                    onChange={(e) => setNewItem(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="코드를 입력하세요"
                  />
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedItem = masterData.find(item => item.code === e.target.value);
                        if (selectedItem) {
                          setNewItem(prev => ({ 
                            ...prev, 
                            code: selectedItem.code, 
                            name: selectedItem.name
                          }));
                        }
                      }
                    }}
                  >
                    <option value="">기존 코드 선택</option>
                    {masterData.map((item, index) => (
                      <option key={index} value={item.code}>
                        {item.code} - {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>{getColumnLabels().name} *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="이름을 입력하세요"
                />
              </div>
              {/* Unit 입력 필드 - Body, Trim, Act, Acc의 특정 섹션에서만 표시 */}
              {((activeTab === 'body' && (selectedBodySection === 'size' || selectedBodySection === 'rating')) ||
                (activeTab === 'trim' && (selectedTrimSection === 'portSize' || selectedTrimSection === 'material'))) && (
                <div className="form-group">
                  <label>Unit *</label>
                  <div className="input-with-dropdown">
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="새로운 Unit을 입력하거나 기존 Unit을 선택하세요"
                    />
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          setNewItem(prev => ({ ...prev, unit: e.target.value }));
                        }
                      }}
                    >
                      <option value="">기존 Unit 선택</option>
                      {(() => {
                        if (activeTab === 'body') {
                          return (selectedBodySection === 'size' ? sizeUnits : ratingUnits);
                        } else if (activeTab === 'trim') {
                          return (selectedTrimSection === 'portSize' ? sizeUnits : []);
                        }
                        return [];
                      })().map((unit, index) => (
                        <option key={index} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {/* ACT Series-size 섹션 수정 필드 */}
              {activeTab === 'act' && selectedActSection === 'series-size' && (
                <>
                  <div className="form-group">
                    <label>Series Code (읽기 전용)</label>
                    <input
                      type="text"
                      value={newItem.series || ''}
                      disabled
                      placeholder="Series 코드는 수정할 수 없습니다"
                    />
                  </div>
                  <div className="form-group">
                    <label>Series Name (읽기 전용)</label>
                    <input
                      type="text"
                      value={newItem.name || ''}
                      disabled
                      placeholder="Series 이름은 수정할 수 없습니다"
                    />
                  </div>
                  <div className="form-group">
                    <label>Size Code *</label>
                    <input
                      type="text"
                      value={newItem.code}
                      onChange={(e) => setNewItem(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="Size 코드를 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>Size Name *</label>
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="Size 이름을 입력하세요"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setIsAddModalOpen(false)}
              >
                취소
              </button>
              <button 
                className="save-button"
                onClick={handleAddItem}
                style={{ backgroundColor: getCategoryColor() }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
      

      {/* 수정 모달 */}
      {isEditModalOpen && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>항목 수정</h3>
              <button 
                className="close-button"
                onClick={() => setIsEditModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
            <div className="form-group">
                <label>{getColumnLabels().code} *</label>
                <div className="input-with-dropdown">
                  <input
                    type="text"
                    value={newItem.code}
                    onChange={(e) => setNewItem(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="코드를 입력하세요"
                  />
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedItem = masterData.find(item => item.code === e.target.value);
                        if (selectedItem) {
                          setNewItem(prev => ({ 
                            ...prev, 
                            code: selectedItem.code, 
                            name: selectedItem.name,
                          }));
                        }
                      }
                    }}
                  >
                    <option value="">기존 코드 선택</option>
                    {masterData.map((item, index) => (
                      <option key={index} value={item.code}>
                        {item.code} - {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>{getColumnLabels().name} *</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="이름을 입력하세요"
                />
              </div>
              {/* Unit 입력 필드 - Body, Trim, Act, Acc의 특정 섹션에서만 표시 */}
              {((activeTab === 'body' && (selectedBodySection === 'size' || selectedBodySection === 'rating')) ||
                (activeTab === 'trim' && (selectedTrimSection === 'portSize' || selectedTrimSection === 'material'))) && (
                <div className="form-group">
                  <label>Unit *</label>
                  <div className="input-with-dropdown">
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="새로운 Unit을 입력하거나 기존 Unit을 선택하세요"
                    />
                    <select 
                      onChange={(e) => {
                        if (e.target.value) {
                          setNewItem(prev => ({ ...prev, unit: e.target.value }));
                        }
                      }}
                    >
                      <option value="">기존 Unit 선택</option>
                      {(() => {
                        if (activeTab === 'body') {
                          return (selectedBodySection === 'size' ? sizeUnits : ratingUnits);
                        } else if (activeTab === 'trim') {
                          return (selectedTrimSection === 'portSize' ? sizeUnits : []);
                        }
                        return [];
                      })().map((unit, index) => (
                        <option key={index} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="cancel-button"
                onClick={() => setIsEditModalOpen(false)}
              >
                취소
              </button>
              <button 
                className="save-button"
                onClick={handleUpdateItem}
                style={{ backgroundColor: getCategoryColor() }}
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessoryManagementPage;

// CSS 스타일
const styles = `
  .unit-cell {
    text-align: center;
    font-weight: 500;
    color: #6c757d;
  }

  .unit-cell:empty::before {
    content: '-';
    color: #adb5bd;
  }

  .data-table th:nth-child(3) {
    min-width: 100px;
  }

  .data-table td:nth-child(3) {
    text-align: center;
  }
`;

// 스타일을 head에 추가
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 