import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import ConvalDataDisplay from './components/ConvalDataDisplay';
import CustomerDataDisplay from './components/CustomerDataDisplay';
import { fetchCustomerData, fetchConvalData, recalculateConval, retryConval } from './services/api';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasAutoExecuted, setHasAutoExecuted] = useState(false); // 자동 실행 여부 추적

  // 상태 폴링
  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(async () => {
        try {
          // 상태 조회 API 호출
          // const status = await fetchStatus();
          if (!isProcessing) { // isProcessing가 false일 때만 폴링 중단
            setIsProcessing(false);
            // 처리 완료 후 데이터 새로고침
            if (estimateNo) {
              await loadData();
            }
          }
        } catch (error) {
          console.error('상태 조회 실패:', error);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isProcessing, estimateNo]);

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
    setError('');
    setSuccess('');
    
    // 60초 후 자동으로 false로 설정 (안전장치)
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      console.log('[UI] Processing timeout - automatically setting isProcessing to false');
    }, 60000);
    
    try {
      // ConvalDataDisplay에서 전달받은 업데이트된 데이터 사용
      const convalDataToSend = updatedConvalData || convalData;
      console.log('[UI] calling retryConval', {
        url: 'http://192.168.0.59:44340/api/conval/retry',
        body: { SomeParam: estimateNo, SheetId: sheetId, ConvalData: convalDataToSend }
      });
      const result = await retryConval({ SomeParam: estimateNo, SheetId: sheetId, ConvalData: convalDataToSend });
      console.log('[UI] retryConval success', result);
      clearTimeout(timeoutId); // 성공 시 타임아웃 제거
      setIsProcessing(false); // 성공 시에도 false로 설정
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
      
      return result; // 반드시 반환
    } catch (error) {
      console.error('[UI] retryConval error', error);
      clearTimeout(timeoutId); // 에러 시 타임아웃 제거
      setIsProcessing(false);
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
              style={{ cursor: 'pointer', fontSize: '1.8rem', fontWeight: '1200' }}
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
            onFileStatusRefresh={refreshFileStatus}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App; 