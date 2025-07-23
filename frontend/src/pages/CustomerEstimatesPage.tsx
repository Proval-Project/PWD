import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';

interface Estimate {
  curEstimateNo: string;
  curEstPrice: number;
  prevEstimateNo?: string;
  status: number;
  customerID: string;
  managerUserID: string;
}

const CustomerEstimatesPage: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sheetInputs, setSheetInputs] = useState<number[]>([]);
  const [submitMsg, setSubmitMsg] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEstimate, setEditEstimate] = useState<Estimate | null>(null);
  const [editForm, setEditForm] = useState({ tagNo: '', curEstPrice: 0 });
  const [sheetModalOpen, setSheetModalOpen] = useState(false);
  const [selectedEstimateNo, setSelectedEstimateNo] = useState<string | null>(null);
  const [sheetList, setSheetList] = useState<number[]>([]);

  // 본인 견적 리스트만 조회
  const fetchEstimates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/data/estimates', {
        baseURL: 'http://localhost:5162',
        params: { customerId: user.userId }
      });
      setEstimates(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '견적 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimates();
  }, []);

  // SheetNo 입력 행 추가
  const handleAddSheetInput = () => {
    setSheetInputs([...sheetInputs, 0]);
  };
  // SheetNo 입력 행 삭제
  const handleRemoveSheetInput = (idx: number) => {
    if (sheetInputs.length === 1) return;
    setSheetInputs(sheetInputs.filter((_, i) => i !== idx));
  };
  // SheetNo 값 변경
  const handleSheetInputChange = (idx: number, value: number) => {
    setSheetInputs(sheetInputs.map((v, i) => (i === idx ? value : v)));
  };

  // 여러 SheetNo 한 번에 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');
    try {
      // 빈 값 제외
      const validSheets = sheetInputs.filter(s => s > 0);
      if (validSheets.length === 0) {
        setSubmitMsg('SheetNo를 하나 이상 입력하세요.');
        return;
      }
      // sheetNos 배열로 한 번에 API 요청
      await axios.post('/api/data/customer-estimate', {
        sheetNos: validSheets,
        customerID: user.userId
      }, { baseURL: 'http://localhost:5162' });
      setSubmitMsg('견적 생성 완료!');
      setSheetInputs([]);
      fetchEstimates();
    } catch (err: any) {
      setSubmitMsg(err.response?.data?.message || '견적 생성에 실패했습니다.');
    }
  };

  // 행 클릭 시 SheetNo 리스트 모달 오픈
  const handleRowClick = async (est: Estimate) => {
    setSelectedEstimateNo(est.curEstimateNo);
    setSheetList([]);
    setSheetModalOpen(true);
    try {
      const res = await axios.get(`/api/data/estimates/${est.curEstimateNo}/sheets`, { baseURL: 'http://localhost:5162' });
      setSheetList(res.data);
    } catch (err) {
      setSheetList([]);
    }
  };

  // 수정 폼 입력 변경
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // 수정 저장
  const handleEditSave = async () => {
    if (!editEstimate) return;
    try {
      await axios.put(`/api/data/estimates/${editEstimate.curEstimateNo}`, {
        tagNo: editForm.tagNo,
        curEstPrice: Number(editForm.curEstPrice)
      }, { baseURL: 'http://localhost:5162' });
      setEditModalOpen(false);
      fetchEstimates();
      setSubmitMsg('수정 완료!');
    } catch (err: any) {
      setSubmitMsg(err.response?.data?.message || '수정에 실패했습니다.');
    }
  };

  return (
    <div className="page-container">
      <h2>내 견적 관리 (고객)</h2>
      <form onSubmit={handleSubmit} className="estimate-form">
        <label>SheetNo 입력 (여러 개 입력 가능)</label>
        {sheetInputs.map((sheet, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <input
              type="number"
              name={`sheetNo${idx}`}
              value={sheet}
              onChange={e => handleSheetInputChange(idx, parseInt(e.target.value) || 0)}
              required
              className="form-input"
              style={{ marginRight: 8 }}
            />
            <button type="button" onClick={() => handleRemoveSheetInput(idx)} disabled={sheetInputs.length === 1}>-</button>
            {idx === sheetInputs.length - 1 && (
              <button type="button" onClick={handleAddSheetInput} style={{ marginLeft: 4 }}>+</button>
            )}
          </div>
        ))}
        <button type="submit" className="submit-button">견적 생성</button>
      </form>
      {submitMsg && <div className="success-message">{submitMsg}</div>}
      <h3>내 견적 리스트</h3>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <table className="estimate-table">
          <thead>
            <tr>
              <th>견적번호</th>
              <th>견적가격</th>
              <th>이전견적</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {estimates.length === 0 ? (
              <tr><td colSpan={4}>견적이 없습니다.</td></tr>
            ) : (
              estimates.map(est => (
                <tr key={est.curEstimateNo} onClick={() => handleRowClick(est)} style={{ cursor: 'pointer' }}>
                  <td>{est.curEstimateNo}</td>
                  <td>{est.curEstPrice}</td>
                  <td>{est.prevEstimateNo}</td>
                  <td>{est.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      <Modal
        isOpen={sheetModalOpen}
        onRequestClose={() => setSheetModalOpen(false)}
        contentLabel="SheetNo 리스트"
        ariaHideApp={false}
      >
        <h2>SheetNo 리스트 (견적번호: {selectedEstimateNo})</h2>
        {sheetList.length === 0 ? (
          <div>SheetNo가 없습니다.</div>
        ) : (
          <ul>
            {sheetList.map((sheet, idx) => (
              <li key={idx}>{sheet}</li>
            ))}
          </ul>
        )}
        <button onClick={() => setSheetModalOpen(false)} style={{ marginTop: 8 }}>닫기</button>
      </Modal>
    </div>
  );
};

export default CustomerEstimatesPage; 