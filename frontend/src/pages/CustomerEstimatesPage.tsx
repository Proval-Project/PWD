import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { useNavigate } from 'react-router-dom';

interface Estimate {
  curEstimateNo: string;
  curEstPrice: number;
  prevEstimateNo?: string;
  status: number;
  customerID: string;
  managerUserID: string;
}

interface ItemInput {
  itemCode: string;
  tagNos: string[];
}

const CustomerEstimatesPage: React.FC = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemInputs, setItemInputs] = useState<ItemInput[]>([
    { itemCode: '1', tagNos: [''] }
  ]);
  const [submitMsg, setSubmitMsg] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEstimate, setEditEstimate] = useState<Estimate | null>(null);
  const [editForm, setEditForm] = useState({ tagNo: '', curEstPrice: 0 });
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedEstimateNo, setSelectedEstimateNo] = useState<string | null>(null);
  const [tagList, setTagList] = useState<string[]>([]);

  const navigate = useNavigate();

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

  // ItemCode 입력 행 추가
  const handleAddItemInput = () => {
    setItemInputs([...itemInputs, { itemCode: '', tagNos: [''] }]);
  };
  // ItemCode 입력 행 삭제
  const handleRemoveItemInput = (idx: number) => {
    if (itemInputs.length === 1) return;
    setItemInputs(itemInputs.filter((_, i) => i !== idx));
  };
  // ItemCode 값 변경
  const handleItemCodeChange = (idx: number, value: string) => {
    setItemInputs(itemInputs.map((item, i) => i === idx ? { ...item, itemCode: value } : item));
  };
  // TagNo 입력 행 추가 (특정 ItemCode)
  const handleAddTagInput = (itemIdx: number) => {
    setItemInputs(itemInputs.map((item, i) =>
      i === itemIdx ? { ...item, tagNos: [...item.tagNos, ''] } : item
    ));
  };
  // TagNo 입력 행 삭제 (특정 ItemCode)
  const handleRemoveTagInput = (itemIdx: number, tagIdx: number) => {
    setItemInputs(itemInputs.map((item, i) => {
      if (i !== itemIdx) return item;
      if (item.tagNos.length === 1) return item;
      return { ...item, tagNos: item.tagNos.filter((_, j) => j !== tagIdx) };
    }));
  };
  // TagNo 값 변경 (특정 ItemCode)
  const handleTagInputChange = (itemIdx: number, tagIdx: number, value: string) => {
    setItemInputs(itemInputs.map((item, i) =>
      i === itemIdx ? { ...item, tagNos: item.tagNos.map((t, j) => j === tagIdx ? value : t) } : item
    ));
  };

  // 여러 ItemCode/TagNo 한 번에 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg('');
    try {
      // 빈 값 자동 제거
      const cleanedInputs = itemInputs
        .map(item => ({
          itemCode: item.itemCode.trim(),
          tagNos: item.tagNos.map(t => t.trim()).filter(t => t)
        }))
        .filter(item => item.itemCode && item.tagNos.length > 0);
      if (cleanedInputs.length === 0) {
        setSubmitMsg('ItemCode와 TagNo를 하나 이상 입력하세요.');
        return;
      }
      // API 요청 (예시: /api/data/customer-estimate)
      const flatItems = cleanedInputs.flatMap(item =>
        item.tagNos.map(tagNo => ({
          ItemCode: item.itemCode,
          TagNo: tagNo
        }))
      );
      await axios.post('/api/data/customer-estimate', {
        items: flatItems,
        customerID: user.userId
      }, { baseURL: 'http://localhost:5162' });
      setSubmitMsg('견적 생성 완료!');
      setItemInputs([{ itemCode: '1', tagNos: [''] }]);
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

  // 상세 페이지 이동
  const handleEstimateClick = (est: Estimate) => {
    navigate(`/estimates/${est.curEstimateNo}`);
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
        <label>ItemCode/TagNo 입력 (여러 개 입력 가능)</label>
        {itemInputs.map((item, itemIdx) => (
          <div key={itemIdx} style={{ border: '1px solid #eee', padding: 12, marginBottom: 8, borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ marginRight: 8 }}>ItemCode</label>
              <input
                type="text"
                name={`itemCode${itemIdx}`}
                value={item.itemCode}
                onChange={e => handleItemCodeChange(itemIdx, e.target.value)}
                required
                className="form-input"
                style={{ marginRight: 8, width: 80 }}
              />
              <button type="button" onClick={() => handleRemoveItemInput(itemIdx)} disabled={itemInputs.length === 1}>-</button>
              {itemIdx === itemInputs.length - 1 && (
                <button type="button" onClick={handleAddItemInput} style={{ marginLeft: 4 }}>+</button>
              )}
            </div>
            <div style={{ marginLeft: 24 }}>
              {item.tagNos.map((tag, tagIdx) => (
                <div key={tagIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <input
                    type="text"
                    name={`tagNo${itemIdx}_${tagIdx}`}
                    value={tag}
                    onChange={e => handleTagInputChange(itemIdx, tagIdx, e.target.value)}
                    required
                    className="form-input"
                    style={{ marginRight: 8 }}
                  />
                  <button type="button" onClick={() => handleRemoveTagInput(itemIdx, tagIdx)} disabled={item.tagNos.length === 1}>-</button>
                  {tagIdx === item.tagNos.length - 1 && (
                    <button type="button" onClick={() => handleAddTagInput(itemIdx)} style={{ marginLeft: 4 }}>+</button>
                  )}
                </div>
              ))}
            </div>
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
                <tr key={est.curEstimateNo} onClick={() => handleEstimateClick(est)} style={{ cursor: 'pointer' }}>
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