import React, { useEffect, useState } from "react";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/common/Modal";
import { deleteCustomer, getCustomerById, getUserById, UserResponseDto } from "../../api/userManagement";

interface UserInfo {
  userID: string;
  email: string;
  name: string;
  phoneNumber: string;
  department: string;
  position: string;
  companyName: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  roleID?: number;
  roleName?: string;
  isApproved?: boolean;
}

const ClientInfoPage: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          alert("로그인 정보를 찾을 수 없습니다.");
          navigate("/login");
          return;
        }

        const localUser = JSON.parse(userStr);
        const userID = localUser.userID || localUser.userId;
        
        if (!userID) {
          alert("사용자 ID를 찾을 수 없습니다.");
          navigate("/login");
          return;
        }

        // 역할과 무관하게 공통 사용자 정보 조회
        const userData: UserResponseDto = await getUserById(userID);
        
        // UserResponseDto를 UserInfo로 변환
        setUserInfo({
          userID: userData.userID,
          email: userData.email,
          name: userData.name,
          phoneNumber: userData.phoneNumber || '',
          department: userData.department || '',
          position: userData.position || '',
          companyName: userData.companyName || '',
          businessNumber: userData.businessNumber || '',
          address: userData.address || '',
          companyPhone: userData.companyPhone || '',
          roleID: userData.roleID,
          roleName: userData.roleName || '',
          isApproved: userData.isApproved,
        });
      } catch (error) {
        console.error("사용자 정보를 불러오는 중 오류가 발생했습니다:", error);
        alert("사용자 정보를 불러오는데 실패했습니다.");
        // 에러 발생 시에도 localStorage의 정보를 사용 (fallback)
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const localUser = JSON.parse(userStr);
          setUserInfo({
            userID: localUser.userID || localUser.userId || '',
            email: localUser.email || '',
            name: localUser.name || localUser.userName || '',
            phoneNumber: localUser.phoneNumber || '',
            department: localUser.department || '',
            position: localUser.position || '',
            companyName: localUser.companyName || '',
            businessNumber: localUser.businessNumber || '',
            address: localUser.address || '',
            companyPhone: localUser.companyPhone || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [navigate]);

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!userInfo?.userID) {
        alert("사용자 정보를 찾을 수 없습니다.");
        return;
      }
      // 현재는 고객만 탈퇴 허용 (RoleID 3)
      if (userInfo.roleID !== 3) {
        alert("담당자/관리자는 이 화면에서 탈퇴할 수 없습니다. 관리자에게 문의해주세요.");
        return;
      }
      await deleteCustomer(userInfo.userID);
      setIsDeleteModalOpen(false);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    } catch (error) {
      console.error("회원탈퇴 처리 실패:", error);
      alert("회원탈퇴 처리에 실패했습니다.");
    }
  };

  if (loading || !userInfo) {
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
            <td className="p-3 font-semibold">{userInfo.userID || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">이메일</th>
            <td className="p-3 font-semibold">{userInfo.email || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 성함</th>
            <td className="p-3 font-semibold">{userInfo.name || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 연락처</th>
            <td className="p-3 font-semibold">{userInfo.phoneNumber || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">부서</th>
            <td className="p-3 font-semibold">{userInfo.department || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">직책</th>
            <td className="p-3 font-semibold">{userInfo.position || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">회사명</th>
            <td className="p-3 font-semibold">{userInfo.companyName || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">사업자등록번호</th>
            <td className="p-3 font-semibold">{userInfo.businessNumber || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">주소</th>
            <td className="p-3 font-semibold">{userInfo.address || '-'}</td>
          </tr>
          <tr>
            <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">회사 연락처</th>
            <td className="p-3 font-semibold">{userInfo.companyPhone || '-'}</td>
          </tr>
          {userInfo.roleName && (
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">역할</th>
              <td className="p-3 font-semibold">{userInfo.roleName || '-'}</td>
            </tr>
          )}
          {userInfo.isApproved !== undefined && (
            <tr>
              <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">승인 상태</th>
              <td className="p-3 font-semibold">{userInfo.isApproved ? '승인됨' : '대기중'}</td>
            </tr>
          )}
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
      message="회원 정보를 수정 화면에서 변경하시겠습니까?"
      confirmText="수정"
      cancelText="취소"
      confirmColor="green"
      onConfirm={() => {
        setIsEditModalOpen(false);
        if (!userInfo) return;
        // 역할별 상세 수정 페이지로 이동
        if (userInfo.roleID === 3) {
          // 고객: 고객 상세/수정 화면
          navigate(`/customer-detail/${userInfo.userID}`);
        } else if (userInfo.roleID === 2 || userInfo.roleID === 1) {
          // 담당자 / 관리자: 담당자 상세/수정 화면 재사용
          navigate(`/staff-detail/${userInfo.userID}`);
        }
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
