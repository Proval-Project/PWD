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
  const [tagInputs, setTagInputs] = useState<string[]>(['']);
  const [submitMsg, setSubmitMsg] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEstimate, setEditEstimate] = useState<Estimate | null>(null);
  const [editForm, setEditForm] = useState({ tagNo: '', curEstPrice: 0 });
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedEstimateNo, setSelectedEstimateNo] = useState<string | null>(null);
  const [tagList, setTagList] = useState<string[]>([]);

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

  // TagNo 입력 행 추가
  const handleAddTagInput = () => {
    setTagInputs([...tagInputs, '']);
  };
  // TagNo 입력 행 삭제
  const handleRemoveTagInput = (idx: number) => {
    if (tagInputs.length === 1) return;
    setTagInputs(tagInputs.filter((_, i) => i !== idx));
  };
  // TagNo 값 변경
  const handleTagInputChange = (idx: number, value: string) => {
    setTagInputs(tagInputs.map((v, i) => (i === idx ? value : v)));
  };

  // 여러 TagNo 한 번에 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');
    try {
      // 빈 값 제외
      const validTags = tagInputs.map(t => t.trim()).filter(t => t);
      if (validTags.length === 0) {
        setSubmitMsg('TagNo를 하나 이상 입력하세요.');
        return;
      }
      // tagNos 배열로 한 번에 API 요청
      await axios.post('/api/data/customer-estimate', {
        tagNos: validTags,
        customerID: user.userId
      }, { baseURL: 'http://localhost:5162' });
      setSubmitMsg('견적 생성 완료!');
      setTagInputs(['']);
      fetchEstimates();
    } catch (err: any) {
      setSubmitMsg(err.response?.data?.message || '견적 생성에 실패했습니다.');
    }
  };

  // 행 클릭 시 TagNo 리스트 모달 오픈
  const handleRowClick = async (est: Estimate) => {
    setSelectedEstimateNo(est.curEstimateNo);
    setTagList([]);
    setTagModalOpen(true);
    try {
      const res = await axios.get(`/api/data/estimates/${est.curEstimateNo}/tags`, { baseURL: 'http://localhost:5162' });
      setTagList(res.data);
    } catch (err) {
      setTagList([]);
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
        <label>TagNo 입력 (여러 개 입력 가능)</label>
        {tagInputs.map((tag, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <input
              type="text"
              name={`tagNo${idx}`}
              value={tag}
              onChange={e => handleTagInputChange(idx, e.target.value)}
              required
              className="form-input"
              style={{ marginRight: 8 }}
            />
            <button type="button" onClick={() => handleRemoveTagInput(idx)} disabled={tagInputs.length === 1}>-</button>
            {idx === tagInputs.length - 1 && (
              <button type="button" onClick={handleAddTagInput} style={{ marginLeft: 4 }}>+</button>
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
        isOpen={tagModalOpen}
        onRequestClose={() => setTagModalOpen(false)}
        contentLabel="TagNo 리스트"
        ariaHideApp={false}
      >
        <h2>TagNo 리스트 (견적번호: {selectedEstimateNo})</h2>
        {tagList.length === 0 ? (
          <div>TagNo가 없습니다.</div>
        ) : (
          <ul>
            {tagList.map((tag, idx) => (
              <li key={idx}>{tag}</li>
            ))}
          </ul>
        )}
        <button onClick={() => setTagModalOpen(false)} style={{ marginTop: 8 }}>닫기</button>
      </Modal>
    </div>
  );
};

export default CustomerEstimatesPage; 