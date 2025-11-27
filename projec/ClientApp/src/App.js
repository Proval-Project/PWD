import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import ConvalDataDisplay from './components/ConvalDataDisplay';
import CustomerDataDisplay from './components/CustomerDataDisplay';
import { fetchCustomerData, fetchConvalData, recalculateConval, retryConval, getQueueStatus } from './services/api';

function App() {
  const [estimateNo, setEstimateNo] = useState(''); // TempEstimateNo (API 호출용)
  const [displayEstimateNo, setDisplayEstimateNo] = useState(''); // CurEstimateNo (표시용)
  const [sheetId, setSheetId] = useState(1);

  // URL 파라미터에서 견적번호와 sheetID 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const estimateNoFromUrl = urlParams.get('estimateNo');
    const sheetIdFromUrl = urlParams.get('sheetId');
    
    if (estimateNoFromUrl) {
      setEstimateNo(estimateNoFromUrl);
      setDisplayEstimateNo(estimateNoFromUrl); // 초기값은 TempEstimateNo
    }
    if (sheetIdFromUrl) {
      setSheetId(parseInt(sheetIdFromUrl) || 1);
    }
  }, []);

  const [customerData, setCustomerData] = useState(null);
  const [convalData, setConvalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQueued, setIsQueued] = useState(false); // 큐에 대기 중인지 여부
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasAutoExecuted, setHasAutoExecuted] = useState(false); // 자동 실행 여부 추적
  const timeoutRef = useRef(null); // 타임아웃 ID 저장용

  // 상태 폴링 - 큐 상태 확인
  useEffect(() => {
    if (isProcessing || isQueued) {
      const interval = setInterval(async () => {
        try {
          const status = await getQueueStatus();
          console.log('[UI] 큐 상태 확인:', status);
          
          // 큐에 항목이 있거나 처리 중이면 계속 대기
          if (status.isProcessing || status.queueCount > 0) {
            setIsProcessing(true);
            setIsQueued(status.queueCount > 0);
          } else {
            // 큐가 비어있고 처리 중이 아니면 완료
            // 타임아웃 정리
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            setIsProcessing(false);
            setIsQueued(false);
            // 처리 완료 후 데이터 새로고침
            if (estimateNo) {
              await loadData();
            }
          }
        } catch (error) {
          console.error('상태 조회 실패:', error);
          // 에러 발생 시에도 일정 시간 후 자동으로 false로 설정
          setTimeout(() => {
            setIsProcessing(false);
            setIsQueued(false);
          }, 5000);
        }
      }, 2000); // 2초마다 확인

      return () => clearInterval(interval);
    }
  }, [isProcessing, isQueued, estimateNo]);

  const loadData = async (autoExecuteConval = false) => {
    if (!estimateNo) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const [customerResult, convalResult] = await Promise.all([
        fetchCustomerData(estimateNo, sheetId),
        fetchConvalData(estimateNo, sheetId)
      ]);

      setCustomerData(customerResult);
      setConvalData(convalResult);
      
      // CurEstimateNo가 있으면 표시용 견적번호 업데이트
      if (customerResult?.CurEstimateNo) {
        setDisplayEstimateNo(customerResult.CurEstimateNo);
      } else if (customerResult?.EstimateNo) {
        setDisplayEstimateNo(customerResult.EstimateNo);
      }
      
      setSuccess('데이터를 성공적으로 로드했습니다.');
      
      // 자동 CONVAL 재호출이 요청된 경우 실행
      if (autoExecuteConval && !hasAutoExecuted) {
        console.log('[UI] 자동 CONVAL 재호출 시작');
        setHasAutoExecuted(true); // 자동 실행 완료 표시
        // 잠시 대기 후 CONVAL 재호출 실행
        setTimeout(() => {
          handleRecalculate(convalResult);
        }, 1000);
      }
    } catch (error) {
      setError('데이터 로드 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 견적번호가 설정되면 자동으로 데이터 로드 및 CONVAL 재호출
  useEffect(() => {
    if (estimateNo) {
      loadData(true); // 자동 CONVAL 재호출 활성화
    }
  }, [estimateNo]);

  const handleRecalculate = async (updatedConvalData) => {
    if (!estimateNo) {
      setError('견적 번호를 입력해주세요.');
      return;
    }
    console.log('[UI] handleRecalculate start', { estimateNo, sheetId });
    setIsProcessing(true);
    setIsQueued(false);
    setError('');
    setSuccess('');
    
    try {
      // ConvalDataDisplay에서 전달받은 업데이트된 데이터 사용
      const convalDataToSend = updatedConvalData || convalData;
      console.log('[UI] calling retryConval', {
        url: 'http://192.168.0.59:44340/api/conval/retry',
        body: { SomeParam: estimateNo, SheetId: sheetId, ConvalData: convalDataToSend }
      });
      const result = await retryConval({ SomeParam: estimateNo, SheetId: sheetId, ConvalData: convalDataToSend });
      console.log('[UI] retryConval success', result);
      
      // 큐 상태 확인
      if (result.isQueued || result.queueCount > 0 || result.isProcessing) {
        // 큐에 추가되었거나 처리 중이면 대기 상태 유지
        setIsProcessing(true);
        setIsQueued(result.isQueued || result.queueCount > 0);
        setSuccess(result.message || '큐에 추가되었습니다. 대기 중...');
        
        // 동적 타임아웃 설정: 큐 개수 * 50초(작업당 소요시간) + 30초(여유시간)
        // 최대 10개 작업까지 고려 (약 8분)
        const queueCount = result.queueCount || 1;
        const estimatedTime = (queueCount * 50000) + 30000; // 밀리초 단위
        const maxTimeout = 600000; // 최대 10분
        const timeoutDuration = Math.min(estimatedTime, maxTimeout);
        
        console.log(`[UI] 큐 상태: ${queueCount}개 작업, 예상 시간: ${timeoutDuration/1000}초`);
        
        // 기존 타임아웃이 있으면 정리
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // 안전장치 타임아웃 설정 (큐 폴링이 실패할 경우를 대비)
        // 실제로는 큐 폴링이 2초마다 실행되어 큐가 비어있으면 자동으로 false가 되므로
        // 이 타임아웃은 네트워크 오류 등으로 폴링이 실패할 경우를 위한 안전장치입니다
        timeoutRef.current = setTimeout(() => {
          console.log('[UI] Processing timeout - automatically setting isProcessing to false');
          setIsProcessing(false);
          setIsQueued(false);
          timeoutRef.current = null;
        }, timeoutDuration);
      } else {
        // 즉시 처리 완료된 경우
        // 타임아웃 정리
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsProcessing(false);
        setIsQueued(false);
        setSuccess(result.message + ' - 데이터 자동 업데이트 중...');
        
        // CONVAL 재호출 완료 후 자동으로 데이터베이스에서 최신 데이터 가져오기
        try {
          // 잠시 대기 후 데이터 새로고침 (CONVAL 엔진 처리 시간 고려)
          await new Promise(resolve => setTimeout(resolve, 3000));
          console.log('[UI] CONVAL 재호출 완료, 데이터베이스에서 최신 데이터 가져오기 시작');
          await loadData();
          setSuccess('CONVAL 재호출 완료 후 데이터가 자동으로 업데이트되었습니다.');
        } catch (refreshError) {
          console.error('[UI] 데이터 자동 업데이트 실패:', refreshError);
          setError('데이터 자동 업데이트 중 오류가 발생했습니다: ' + refreshError.message);
        }
      }
      
      return result; // 반드시 반환
    } catch (error) {
      console.error('[UI] retryConval error', error);
      // 타임아웃 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsProcessing(false);
      setIsQueued(false);
      setError('CONVAL 재호출 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 파일 상태 새로고침 함수
  const refreshFileStatus = useCallback(() => {
    // ConvalDataDisplay 컴포넌트에서 파일 상태를 새로고침하도록 트리거
    if (convalData?.TempEstimateNo) {
      // 강제로 파일 상태 확인을 트리거하기 위해 key를 변경
      setConvalData({ ...convalData });
    }
  }, [convalData]);

  return (
    <Container fluid className="px-4 py-3" style={{ backgroundColor: '#EFEFEF', minHeight: '100vh' }}>
      <Row className="mb-3">
        <Col>
          <div className="d-flex align-items-center">
            <span 
              style={{ cursor: 'pointer', fontSize: '1.8rem', fontWeight: '900' }}
              onClick={() => {
                const url = `http://192.168.0.59:3000/dashboard/estimate-detail/${estimateNo}`;
                window.open(url, '_self');
              }}
            >
              &lt;  CONVAL 결과
            </span>
          </div>
        </Col>
      </Row>

      {/* 알림 메시지 */}
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}

      {/* 2컬럼 레이아웃: CUSTOMER DATA (왼쪽) | CONVAL DATA (오른쪽) */}
      <Row>
        {/* 왼쪽: CUSTOMER DATA */}
        <Col md={5} style={{ borderRight: '1px solid #CDCDCD', paddingRight: '20px' }}>
          <CustomerDataDisplay 
            data={customerData} 
            isLoading={isLoading}
          />
        </Col>

        {/* 오른쪽: CONVAL DATA */}
        <Col md={7} style={{ paddingLeft: '20px' }}>
          <ConvalDataDisplay 
            data={convalData} 
            isLoading={isLoading}
            onRecalculate={handleRecalculate}
            isProcessing={isProcessing}
            isQueued={isQueued}
            onFileStatusRefresh={refreshFileStatus}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App; 