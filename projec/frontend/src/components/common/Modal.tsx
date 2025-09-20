import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message,
  confirmText = "확인",
  cancelText = "취소",
  confirmColor = "blue",
  onConfirm,
  onCancel,
  children, 
  className = '' 
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const getConfirmButtonColor = () => {
    switch (confirmColor) {
      case 'red': return 'bg-red-500 hover:bg-red-600';
      case 'green': return 'bg-green-500 hover:bg-green-600';
      case 'blue': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-4">
          {message && <p className="mb-4">{message}</p>}
          {children}
        </div>

        {/* Footer with buttons */}
        {(onConfirm || onCancel) && (
          <div className="flex justify-end gap-2 p-4 border-t">
            {onCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
              >
                {cancelText}
              </button>
            )}
            {onConfirm && (
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-white rounded ${getConfirmButtonColor()}`}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
