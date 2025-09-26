import React, { useEffect } from "react";
import { FaTimes, FaExclamationCircle, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info"; 
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = "error", onClose }) => {
  const typeStyles = {
    error: {
      container: "bg-red-50 border-red-200 text-red-600",
      icon: <FaExclamationCircle className="text-red-500 text-lg" />,
      close: "bg-red-50 border-red-200 text-red-500 hover:bg-red-100",
    },
    success: {
      container: "bg-green-50 border-green-200 text-green-600",
      icon: <FaCheckCircle className="text-green-500 text-lg" />,
      close: "bg-green-50 border-green-200 text-green-500 hover:bg-green-100",
    },
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-600",
      icon: <FaInfoCircle className="text-blue-500 text-lg" />,
      close: "bg-blue-50 border-blue-200 text-blue-500 hover:bg-blue-100",
    },
  };

  const style = typeStyles[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose && onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="relative inline-block">
      <button
        onClick={onClose}
        className={`absolute -top-3 -left-3 w-6 h-6 flex items-center justify-center rounded-full border text-sm ${style.close}`}
      >
        <FaTimes size={12} />
      </button>

      <div
        className={`flex items-center gap-3 px-4 py-3 border rounded-lg shadow-sm whitespace-nowrap ${style.container}`}
      >
        {style.icon}
        <span className="flex-1 font-normal">{message}</span>
      </div>
    </div>
  );
};
