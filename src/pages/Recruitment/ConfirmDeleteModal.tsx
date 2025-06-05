import React, { useEffect, useState } from "react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobTitle?: string;
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, jobTitle }: ConfirmDeleteModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Đợi hiệu ứng fade-out xong mới thực sự unmount
      const timeout = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-200 ${isOpen ? 'opacity-100 bg-black bg-opacity-50' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-lg p-6 w-full max-w-md shadow-lg transform transition-all duration-200 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <h2 className="text-lg font-bold mb-4 text-red-600">Xác nhận xoá</h2>
        <p className="mb-6">
          Bạn có chắc chắn muốn xoá công việc{" "}
          <span className="font-semibold text-[#002147]">{jobTitle}</span> không?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 font-bold rounded-lg"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteModal; 