import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDetail.css';
import { IoIosArrowBack } from "react-icons/io";
import Modal from "../../components/common/Modal";
import { getCustomerById, deleteCustomer, updateCustomer, UserResponseDto } from "../../api/userManagement";

interface User {
  userID: string;
  name: string;
  email: string;
  roleId: number;
  companyName: string;
  department: string;
  position: string;
  phoneNumber: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  isApproved: boolean;
}

const CustomerDetailPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        if (!customerId) {
          alert("사용자 ID가 없습니다.");
          navigate("/customer-management");
          return;
        }
        
        const data = await getCustomerById(customerId);
        setUser({
          userID: data.userID,
          name: data.name,
          email: data.email,
          roleId: data.roleID,
          companyName: data.companyName || '',
          department: data.department || '',
          position: data.position || '',
          phoneNumber: data.phoneNumber || '',
          businessNumber: data.businessNumber || '',
          address: data.address || '',
          companyPhone: data.companyPhone || '',
          isApproved: data.isApproved,
        });
      } catch (err) {
        console.error("고객 정보 로드 실패:", err);
        alert("고객 정보를 불러오는데 실패했습니다.");
        navigate("/customer-management");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomer();
  }, [customerId, navigate]);

  if (loading) {
    return <div>로딩 중...</div>;
  }

  if (!user) {
    return <div>사용자를 찾을 수 없습니다.</div>;
  }

  const confirmDelete = async () => {
    try {
      if (!user?.userID) {
        alert("사용자 정보를 찾을 수 없습니다.");
        return;
      }
      await deleteCustomer(user.userID);
      setIsDeleteModalOpen(false);
      alert("고객이 삭제되었습니다.");
      navigate("/customer-management");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("고객 삭제에 실패했습니다.");
    }
  };

  const handleEdit = () => {
    setEditedUser({ ...user! });
    setIsEditMode(true);
    setIsEditModalOpen(false);
  };

  const handleSave = async () => {
    if (!editedUser || !user) return;
    
    try {
      await updateCustomer(user.userID, {
        name: editedUser.name,
        email: editedUser.email,
        companyName: editedUser.companyName,
        businessNumber: editedUser.businessNumber,
        address: editedUser.address,
        companyPhone: editedUser.companyPhone,
        department: editedUser.department,
        position: editedUser.position,
        phoneNumber: editedUser.phoneNumber,
      });
      
      setUser(editedUser);
      setIsEditMode(false);
      alert("수정이 완료되었습니다.");
    } catch (err: any) {
      console.error("수정 실패:", err);
      alert(err.response?.data?.message || "수정에 실패했습니다.");
    }
  };

  const handleCancel = () => {
    setEditedUser(null);
    setIsEditMode(false);
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      <div className="flex items-center mb-1 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">고객 상세 정보</h1>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#CDCDCD] bg-white shadow max-w-[800px] mx-auto mt-8">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <th className="w-1/3 bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">아이디</th>
              <td className="p-3 font-semibold">{user.userID || '-'}</td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">이메일</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="email"
                    value={editedUser?.email || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, email: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.email || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">회사명</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.companyName || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, companyName: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.companyName || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">사업자등록번호</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.businessNumber || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, businessNumber: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.businessNumber || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">주소</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.address || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, address: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.address || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">회사 연락처</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.companyPhone || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, companyPhone: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.companyPhone || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 성함</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.name || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, name: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.name || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 부서</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.department || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, department: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.department || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 직급</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.position || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, position: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.position || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 연락처</th>
              <td className="p-3 font-semibold">
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedUser?.phoneNumber || ''}
                    onChange={(e) => setEditedUser({ ...editedUser!, phoneNumber: e.target.value })}
                    className="w-full px-2 py-1 border rounded"
                  />
                ) : (
                  user.phoneNumber || '-'
                )}
              </td>
            </tr>
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">승인 상태</th>
              <td className="p-3 font-semibold">{user.isApproved ? '승인됨' : '대기중'}</td>
            </tr>
          </tbody>
        </table>
      </div>

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

      <Modal
        isOpen={isEditModalOpen}
        title="수정하시겠습니까?"
        message="해당 고객의 정보를 수정하시겠습니까?"
        confirmText="수정"
        cancelText="취소"
        confirmColor="green"
        onConfirm={handleEdit}
        onCancel={() => setIsEditModalOpen(false)}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        title="삭제하시겠습니까?"
        message="해당 고객의 정보를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        confirmColor="red"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

export default CustomerDetailPage;
