import React, { useEffect, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/common/Modal";

interface UserInfo {
  userID: string;
  password: string;
  email: string;
  name: string;
  phoneNumber: string;
  department: string;
  position: string;
  companyName: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
}

const ClientInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUserInfo(JSON.parse(userStr));
    }
  }, []);

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    // ✅ 회원탈퇴 로직 추가
    console.log("회원탈퇴 처리");
    setIsDeleteModalOpen(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!userInfo) {
    return <div className="p-5">회원 정보를 불러오는 중...</div>;
  }

  return (
  <div className="p-5 max-w-[1200px] mx-auto">
    {/* 헤더 */}
    <div className="flex items-center mb-6 gap-3 mt-7">
      <button className="text-xl text-black p-1" onClick={() => navigate(-1)}>
        <IoIosArrowBack />
      </button>
      <h1 className="text-2xl font-bold text-black">회원 정보</h1>
    </div>

    {/* 표 (넓이 따로 조절 가능) */}
    <div className="overflow-hidden rounded-lg border border-[#CDCDCD] bg-white shadow max-w-[800px] mx-auto">
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <th className="w-1/3 bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">아이디</th>
            <td className="p-3 font-semibold">{userInfo.userID}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">비밀번호</th>
            <td className="p-3 font-semibold">{userInfo.password}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">이메일</th>
            <td className="p-3 font-semibold">{userInfo.email}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 성함</th>
            <td className="p-3 font-semibold">{userInfo.name}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 연락처</th>
            <td className="p-3 font-semibold">{userInfo.phoneNumber}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">부서</th>
            <td className="p-3 font-semibold">{userInfo.department}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">직책</th>
            <td className="p-3 font-semibold">{userInfo.position}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">회사명</th>
            <td className="p-3 font-semibold">{userInfo.companyName}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">사업자등록번호</th>
            <td className="p-3 font-semibold">{userInfo.businessNumber}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">주소</th>
            <td className="p-3 font-semibold">{userInfo.address}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">회사 연락처</th>
            <td className="p-3 font-semibold">{userInfo.companyPhone}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* 버튼 */}
    <div className="flex justify-center gap-20 mt-10">
      <button
        onClick={handleEdit}
        className="px-20 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
      >
        수정
      </button>
      <button
        onClick={handleDelete}
        className="px-20 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
      >
        탈퇴
      </button>
    </div>

    {/* 수정 팝업 */}
    <Modal
      isOpen={isEditModalOpen}
      title="수정하시겠습니까?"
      message="회원 정보를 수정하시겠습니까?"
      confirmText="수정"
      cancelText="취소"
      confirmColor="green"
      onConfirm={() => {
        setIsEditModalOpen(false);
        console.log("수정 페이지 이동 or 수정 로직 실행");
      }}
      onCancel={() => setIsEditModalOpen(false)}
    />

    {/* 삭제 팝업 */}
    <Modal
      isOpen={isDeleteModalOpen}
      title="삭제하시겠습니까?"
      message="계정을 삭제하시겠습니까?"
      confirmText="삭제"
      cancelText="취소"
      confirmColor="red"
      onConfirm={confirmDelete}
      onCancel={() => setIsDeleteModalOpen(false)}
    />
  </div>
);

};

export default ClientInfoPage;
