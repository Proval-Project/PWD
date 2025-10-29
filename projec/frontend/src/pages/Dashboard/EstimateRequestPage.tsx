import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerSearchModal from '../../components/CustomerSearchModal';
import { IoIosArrowBack } from "react-icons/io";

const EstimateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 현재 로그인한 사용자 정보
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isCustomer = currentUser.roleId === 3;

  // 관리자/직원용 상태
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  const handleNewEstimate = () => {
    if (isCustomer) {
      navigate('/estimate-request/new');
    } else {
      if (!selectedCustomer) {
        alert('고객을 먼저 선택해주세요.');
        return;
      }
      localStorage.setItem('selectedCustomer', JSON.stringify(selectedCustomer));
      navigate('/estimate-request/new');
    }
  };

  const handleLoadTemporary = () => {
  if (isCustomer) {
    localStorage.setItem("selectedCustomerForTempStorage", JSON.stringify(currentUser));
    navigate('/estimate-request/temporary');
  } else {
    if (!selectedCustomer) {
      alert('고객을 먼저 선택해주세요.');
      return;
    }
    localStorage.setItem('selectedCustomerForTempStorage', JSON.stringify(selectedCustomer));
    navigate('/estimate-request/temporary');
  }
};


  const handleReInquiry = () => {
    if (!isCustomer && !selectedCustomer) {
      alert('고객을 먼저 선택해주세요.');
      return;
    }
    if (!isCustomer && selectedCustomer) {
      localStorage.setItem('selectedCustomerForReInquiry', JSON.stringify(selectedCustomer));
    }
    navigate('/existing-estimate-reinquiry');
  };

  const handleCustomerSelect = (user: any) => {
    setSelectedCustomer(user);
    setShowCustomerSearch(false);
  };

  return (
    <div className="p-5 max-w-[1200px] mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-20 gap-3 mt-7">
        <button
          className="text-xl text-black p-1"
          onClick={() => navigate(-1)}
        >
          <IoIosArrowBack />
        </button>
        <h1 className="text-2xl font-bold text-black">견적요청</h1>
      </div>

      <div className="flex flex-col gap-8">
        {/* 액션 카드 */}
        <div className="flex flex-row gap-5 justify-center mt-20">
          <div
            className="flex flex-col items-center justify-center flex-1 min-w-[250px] min-h-[200px] bg-[#D9D9D9] rounded-lg p-8 text-center cursor-pointer transition hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={handleNewEstimate}
          >
            <h3 className="text-4xl font-semibold text-gray-800 mb-2 ">신규 견적 요청하기</h3>
            <p className="text-sm text-gray-600">새로운 견적을 요청합니다.</p>
          </div>

          <div
            className="flex flex-col items-center justify-center flex-1 min-w-[250px] min-h-[200px] bg-[#D9D9D9] rounded-lg p-8 text-center cursor-pointer transition hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={handleLoadTemporary}
          >
            <h3 className="text-4xl font-semibold text-gray-800 mb-2">임시저장 불러오기</h3>
            <p className="text-sm text-gray-600">임시저장된 견적을 불러옵니다.</p>
          </div>

          <div
            className="flex flex-col items-center justify-center flex-1 min-w-[250px] min-h-[200px] bg-[#D9D9D9] rounded-lg p-8 text-center cursor-pointer transition hover:bg-gray-200 hover:-translate-y-0.5 hover:shadow-md"
            onClick={handleReInquiry}
          >
            <h3 className="text-4xl font-semibold text-gray-800 mb-2">기존 견적 재문의</h3>
            <p className="text-sm text-gray-600">기존 견적에 대해 재문의합니다.</p>
          </div>
        </div>

        {/* 관리자/직원용 고객 검색 */}
        {!isCustomer && (
          <div className="flex justify-center">
            <div className="flex flex-col min-w-[400px] items-center text-center bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-800 mb-2">고객 검색</h3>
                <div className="flex gap-3">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                    onClick={() => setShowCustomerSearch(true)}
                  >
                    고객 검색
                  </button>
                  {selectedCustomer && (
                    <button
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      선택 해제
                    </button>
                  )}
              </div>
            </div>

            {selectedCustomer && (
              <div className="overflow-hidden rounded-lg border border-[#CDCDCD] bg-white shadow min-w-[400px] mx-auto mt-3">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr>
                      <th className="w-1/3 bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">회사명</th>
                      <td className="p-3 font-semibold">{selectedCustomer.companyName}</td>
                    </tr>
                    <tr>
                      <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">담당자 성함</th>
                      <td className="p-3 font-semibold">{selectedCustomer.name}</td>
                    </tr>
                    <tr>
                      <th className="bg-[#DFDFDF] border-[#CDCDCD] p-3 text-left font-semibold">직급</th>
                      <td className="p-3 font-semibold">{selectedCustomer.position}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        )}

        {/* 고객 검색 모달 */}
        {showCustomerSearch && (
          <CustomerSearchModal
            isOpen={showCustomerSearch}
            onClose={() => setShowCustomerSearch(false)}
            onSelectUser={handleCustomerSelect}
          />
        )}
      </div>
    </div>
  );
};

export default EstimateRequestPage;
