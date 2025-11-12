import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDetail.css'; // 고객 상세와 동일 CSS 재활용
import { IoIosArrowBack } from "react-icons/io";
import Modal from "../../components/common/Modal";
import { getStaffById, updateStaff, deleteStaff } from '../../api/userManagement';

interface Staff {
  userID: string;
  name: string;
  email: string;
  department: string;
  position: string;
  phoneNumber: string;
}

const StaffDetailPage: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedStaff, setEditedStaff] = useState<Staff | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 더미 데이터 or API 호출
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        if (!staffId) return;
        const data = await getStaffById(staffId);
        setStaff({
          userID: data.userID,
          name: data.name,
          email: data.email,
          department: data.department,
          position: data.position,
          phoneNumber: data.phoneNumber,
        });
      } catch (err) {
        console.error("담당자 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [staffId]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!staff) {
    return <div>담당자를 찾을 수 없습니다.</div>;
  }

  const confirmDelete = async () => {
    try {
      await deleteStaff(staff.userID);
      setIsDeleteModalOpen(false);
      navigate("/staff-management");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleEdit = () => {
    setEditedStaff({ ...staff! });
    setIsEditMode(true);
    setIsEditModalOpen(false);
  };

  const handleSave = async () => {
    if (!editedStaff || !staff) return;
    
    try {
      await updateStaff(staff.userID, {
        name: editedStaff.name,
        email: editedStaff.email,
        department: editedStaff.department,
        position: editedStaff.position,
        phoneNumber: editedStaff.phoneNumber,
      });
      
      setStaff(editedStaff);
      setIsEditMode(false);
      alert("수정이 완료되었습니다.");
    } catch (err: any) {
      console.error("수정 실패:", err);
      alert(err.response?.data?.message || "수정에 실패했습니다.");
    }
  };

  const handleCancel = () => {
    setEditedStaff(null);
    setIsEditMode(false);
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">담당자 상세 정보</h1>
      </div>

      {/* 상세 테이블 */}
      <div className="overflow-hidden rounded-lg border border-[#CDCDCD] bg-white shadow max-w-[800px] mx-auto mt-20">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <th className="w-1/3 bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">아이디</th>
              <td className="p-3 font-semibold">{staff.userID}</td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 성함</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedStaff?.name || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff!, name: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  staff.name
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 부서</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedStaff?.department || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff!, department: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  staff.department
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 직급</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedStaff?.position || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff!, position: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  staff.position
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 연락처</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedStaff?.phoneNumber || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff!, phoneNumber: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  staff.phoneNumber
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 이메일</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="email"
                    value={editedStaff?.email || ''}
                    onChange={(e) => setEditedStaff({ ...editedStaff!, email: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  staff.email
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 버튼 */}
      <div className="flex justify-center gap-20 mt-10">
        {isEditMode ? (
          <>
            <button
              onClick={handleSave}
              className="px-20 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              저장
            </button>
            <button
              onClick={handleCancel}
              className="px-20 py-2 rounded bg-gray-600 text-white font-semibold hover:bg-gray-700"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-20 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              수정
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-20 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
            >
              삭제
            </button>
          </>
        )}
      </div>

      {/* 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        title="수정하시겠습니까?"
        message="해당 담당자의 정보를 수정하시겠습니까?"
        confirmText="수정"
        cancelText="취소"
        confirmColor="green"
        onConfirm={handleEdit}
        onCancel={() => setIsEditModalOpen(false)}
      />

      {/* 삭제 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        title="삭제하시겠습니까?"
        message="해당 담당자의 정보를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default StaffDetailPage;
