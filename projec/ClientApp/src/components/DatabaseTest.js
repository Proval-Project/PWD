import React, { useState } from 'react';
import { testDatabaseConnection, fetchCustomerData, fetchConvalData } from '../services/api';

const DatabaseTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [estimateNo, setEstimateNo] = useState('');
  const [sheetId, setSheetId] = useState(1);
  const [customerData, setCustomerData] = useState(null);
  const [convalData, setConvalData] = useState(null);

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const result = await testDatabaseConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestCustomerData = async () => {
    if (!estimateNo) {
      alert('견적번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchCustomerData(estimateNo, sheetId);
      setCustomerData(result);
    } catch (error) {
      setCustomerData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConvalData = async () => {
    if (!estimateNo) {
      alert('견적번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await fetchConvalData(estimateNo, sheetId);
      setConvalData(result);
    } catch (error) {
      setConvalData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>데이터베이스 연결 테스트</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleTestConnection}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '테스트 중...' : '데이터베이스 연결 테스트'}
        </button>
      </div>

      {testResult && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>{testResult.success ? '✅ 연결 성공' : '❌ 연결 실패'}</h3>
          <p><strong>메시지:</strong> {testResult.message}</p>
          {testResult.error && <p><strong>오류:</strong> {testResult.error}</p>}
          {testResult.connectionString && (
            <p><strong>연결 문자열:</strong> {testResult.connectionString}</p>
          )}
          {testResult.tables && (
            <div>
              <strong>테이블 상태:</strong>
              <ul>
                {Object.entries(testResult.tables).map(([table, exists]) => (
                  <li key={table}>
                    {table}: {exists ? '✅ 존재' : '❌ 없음'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>데이터 조회 테스트</h3>
        <div style={{ marginBottom: '10px' }}>
          <label>
            견적번호: 
            <input 
              type="text" 
              value={estimateNo} 
              onChange={(e) => setEstimateNo(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
              placeholder="예: test_valve_001"
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            시트ID: 
            <input 
              type="number" 
              value={sheetId} 
              onChange={(e) => setSheetId(parseInt(e.target.value) || 1)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={handleTestCustomerData}
            disabled={loading || !estimateNo}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              marginRight: '10px',
              cursor: (loading || !estimateNo) ? 'not-allowed' : 'pointer'
            }}
          >
            고객 데이터 조회 테스트
          </button>
          <button 
            onClick={handleTestConvalData}
            disabled={loading || !estimateNo}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: (loading || !estimateNo) ? 'not-allowed' : 'pointer'
            }}
          >
            CONVAL 데이터 조회 테스트
          </button>
        </div>
      </div>

      {customerData && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: customerData.error ? '#f8d7da' : '#d4edda',
          border: `1px solid ${customerData.error ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>고객 데이터 결과</h3>
          {customerData.error ? (
            <p><strong>오류:</strong> {customerData.error}</p>
          ) : (
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
              {JSON.stringify(customerData, null, 2)}
            </pre>
          )}
        </div>
      )}

      {convalData && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: convalData.error ? '#f8d7da' : '#d4edda',
          border: `1px solid ${convalData.error ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>CONVAL 데이터 결과</h3>
          {convalData.error ? (
            <p><strong>오류:</strong> {convalData.error}</p>
          ) : (
            <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px' }}>
              {JSON.stringify(convalData, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseTest; 