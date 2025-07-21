import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Estimate {
  curEstimateNo: string;
  curEstPrice: number;
  prevEstimateNo?: string;
  status: number;
  customerID: string;
  managerUserID: string;
}

const AdminEstimatesPage: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ curEstPrice: 0, prevEstimateNo: '', status: 1, customerID: '', managerUserID: '' });
  const [submitMsg, setSubmitMsg] = useState('');

  const fetchEstimates = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/data/estimates', { baseURL: 'http://localhost:5162' });
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');
    try {
      await axios.post('/api/data/estimates', {
        curEstPrice: Number(form.curEstPrice),
        prevEstimateNo: form.prevEstimateNo,
        status: Number(form.status),
        customerID: form.customerID,
        managerUserID: form.managerUserID
      }, { baseURL: 'http://localhost:5162' });
      setSubmitMsg('견적 생성 완료!');
      setForm({ curEstPrice: 0, prevEstimateNo: '', status: 1, customerID: '', managerUserID: '' });
      fetchEstimates();
    } catch (err: any) {
      setSubmitMsg(err.response?.data?.message || '견적 생성에 실패했습니다.');
    }
  };

  const handleEdit = (curEstimateNo: string) => {
    alert(`수정 폼으로 이동: ${curEstimateNo}`);
  };

  return (
    <div className="page-container">
      <h2>전체 견적 관리 (관리자/담당자)</h2>
      <form onSubmit={handleSubmit} className="estimate-form">
        <div className="form-group">
          <label htmlFor="curEstPrice">견적 가격</label>
          <input type="number" id="curEstPrice" name="curEstPrice" value={form.curEstPrice} onChange={handleChange} required className="form-input" />
        </div>
        <div className="form-group">
          <label htmlFor="prevEstimateNo">이전 견적번호</label>
          <input type="text" id="prevEstimateNo" name="prevEstimateNo" value={form.prevEstimateNo} onChange={handleChange} className="form-input" />
        </div>
        <div className="form-group">
          <label htmlFor="status">상태</label>
          <select id="status" name="status" value={form.status} onChange={handleChange} className="form-input">
            <option value={1}>견적입력</option>
            <option value={2}>접수대기</option>
            <option value={3}>견적완료</option>
            <option value={4}>주문</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="customerID">고객ID</label>
          <input type="text" id="customerID" name="customerID" value={form.customerID} onChange={handleChange} required className="form-input" />
        </div>
        <div className="form-group">
          <label htmlFor="managerUserID">담당자ID</label>
          <input type="text" id="managerUserID" name="managerUserID" value={form.managerUserID} onChange={handleChange} required className="form-input" />
        </div>
        <button type="submit" className="submit-button">견적 생성</button>
      </form>
      {submitMsg && <div className="success-message">{submitMsg}</div>}
      <h3>견적 리스트</h3>
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
              <th>고객ID</th>
              <th>담당자ID</th>
              <th>수정</th>
            </tr>
          </thead>
          <tbody>
            {estimates.length === 0 ? (
              <tr><td colSpan={7}>견적이 없습니다.</td></tr>
            ) : (
              estimates.map(est => (
                <tr key={est.curEstimateNo}>
                  <td>{est.curEstimateNo}</td>
                  <td>{est.curEstPrice}</td>
                  <td>{est.prevEstimateNo}</td>
                  <td>{est.status}</td>
                  <td>{est.customerID}</td>
                  <td>{est.managerUserID}</td>
                  <td><button onClick={() => handleEdit(est.curEstimateNo)}>수정</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminEstimatesPage; 