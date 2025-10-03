import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "green" | "red"; // 확인 버튼 색상
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  confirmColor = "green",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmColorClass =
    confirmColor === "green"
      ? "bg-green-500 hover:bg-green-600"
      : "bg-red-500 hover:bg-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 antialiased">
      <div className="bg-white border-[1.5px] border-[#D8D8D8] rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-6 w-[400px] text-left">
        {/* 제목 */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
        {/* 메시지 */}
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3 font-semibold">
          <button
            onClick={onCancel}
            className="px-5 h-10 rounded-full border border-[#D8D8D8] text-gray-600 bg-white hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 h-10 rounded-full text-white ${confirmColorClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
