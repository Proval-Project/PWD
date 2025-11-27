import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CustomerDetail.css'; // 고객/담당자 상세 CSS 재활용
import { IoIosArrowBack } from "react-icons/io";
import Modal from "../../components/common/Modal";
import { getPendingApprovals, approveUser, rejectUser } from '../../api/userManagement';

interface MembershipRequestDetail {
  userID: string;
  companyName: string;
  name: string;
  email: string;
  roleID: number;
  roleName: string;
  businessNumber: string;
  address: string;
  companyPhone: string;
  department: string;
  position: string;
  phoneNumber: string;
}

const MembershipRequestDetailPage: React.FC = () => {
  const { userID } = useParams<{ userID: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MembershipRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const list = await getPendingApprovals();
        const found = list.find((r: any) => r.userID === userID);
        if (found) {
          setDetail({
            userID: found.userID,
            companyName: found.companyName,
            name: found.name,
            email: found.email,
            roleID: found.roleID,
            roleName: found.roleName,
            businessNumber: found.businessNumber,
            address: found.address,
            companyPhone: found.companyPhone,
            department: found.department,
            position: found.position,
            phoneNumber: found.phoneNumber,
          });
        } else {
          setDetail(null);
        }
      } catch (err) {
        console.error("상세 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [userID]);

  const getRoleDisplayName = (roleID: number, roleName: string) => {
    if (roleName) {
      switch (roleName) {
        case 'Admin': return '관리자';
        case 'Sales': return '담당자';
        case 'Customer': return '고객';
      }
    }
    switch (roleID) {
      case 1: return '관리자';
      case 2: return '담당자';
      case 3: return '고객';
      default: return roleName || `역할(${roleID})`;
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (!detail) return <div>요청을 찾을 수 없습니다.</div>;

  const confirmApprove = async () => {
    await approveUser(detail.userID);
    setIsApproveModalOpen(false);
    navigate("/membership-requests");
  };

  const confirmReject = async () => {
    try {
      await rejectUser(detail.userID);
      setIsRejectModalOpen(false);
      navigate("/membership-requests");
    } catch (error) {
      console.error("거절 처리 실패:", error);
      alert("거절 처리에 실패했습니다.");
    }
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
        <h1 className="text-2xl font-bold text-black">회원가입 요청 상세 정보</h1>
      </div>

      {/* 상세 테이블 */}
      <div className="overflow-hidden rounded-lg border border-[#CDCDCD] bg-white shadow max-w-[800px] mx-auto mt-10">
        <table className="w-full border-collapse">
          <tbody>
            <tr><th className="w-1/3 bg-[#DFDFDF] border p-3 text-left font-semibold">아이디</th><td className="p-3 font-semibold">{detail.userID}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">회사명</th><td className="p-3 font-semibold">{detail.companyName}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">역할</th><td className="p-3 font-semibold">{getRoleDisplayName(detail.roleID, detail.roleName)}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">사업자등록번호</th><td className="p-3 font-semibold">{detail.businessNumber}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">주소</th><td className="p-3 font-semibold">{detail.address}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">대표번호</th><td className="p-3 font-semibold">{detail.companyPhone}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">담당자 성함</th><td className="p-3 font-semibold">{detail.name}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">담당자 부서</th><td className="p-3 font-semibold">{detail.department}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">담당자 직급</th><td className="p-3 font-semibold">{detail.position}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">담당자 연락처</th><td className="p-3 font-semibold">{detail.phoneNumber}</td></tr>
            <tr><th className="bg-[#DFDFDF] border p-3 text-left font-semibold">담당자 이메일</th><td className="p-3 font-semibold">{detail.email}</td></tr>
          </tbody>
        </table>
      </div>

      {/* 버튼 */}
      <div className="flex justify-center gap-20 mt-10">
        <button
          onClick={() => setIsApproveModalOpen(true)}
          className="px-20 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
        >
          승인
        </button>
        <button
          onClick={() => setIsRejectModalOpen(true)}
          className="px-20 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
        >
          거절
        </button>
      </div>

      {/* 승인 모달 */}
      <Modal
        isOpen={isApproveModalOpen}
        title="승인하시겠습니까?"
        message="해당 요청을 승인하시겠습니까?"
        confirmText="승인"
        cancelText="취소"
        confirmColor="green"
        onConfirm={confirmApprove}
        onCancel={() => setIsApproveModalOpen(false)}
      />

      {/* 거절 모달 */}
      <Modal
        isOpen={isRejectModalOpen}
        title="거절하시겠습니까?"
        message="해당 요청을 거절하시겠습니까?"
        confirmText="거절"
        cancelText="취소"
        confirmColor="red"
        onConfirm={confirmReject}
        onCancel={() => setIsRejectModalOpen(false)}
      />
    </div>
  );
};

export default MembershipRequestDetailPage;
