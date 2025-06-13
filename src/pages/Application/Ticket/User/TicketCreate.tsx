import React, { useState } from "react";
import { FaRegCircle, FaRegCircleDot } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { Input } from "@/components/ui/input";

interface ProgressIndicatorProps {
  step: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ step }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {/* Step 2 */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
          {step === 2 ? (
            <FaRegCircleDot
              size={28}
              className="text-[#FF5733] drop-shadow-md"
            />
          ) : step > 2 ? (
            <FaCheckCircle
              size={28}
              className="text-[#FF5733] bg-white rounded-full"
            />
          ) : (
            <FaRegCircle className="bg-[#FF5733] text-2xl rounded-full" />
          )}
        </div>
        <div
          className={`w-24 h-[2px] transition-all duration-300 ${
            step >= 3 ? "bg-gray-300" : "bg-gray-300"
          }`}
        ></div>
      </div>
      {/* Step 3 */}
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
          {step === 3 ? (
            <FaRegCircleDot
              size={28}
              className="text-[#FF5733] drop-shadow-md"
            />
          ) : step > 3 ? (
            <FaCheckCircle
              size={28}
              className="text-[#FF5733] bg-white rounded-full"
            />
          ) : (
            <FaRegCircle className="text-[#FF5733] text-2xl" />
          )}
        </div>
        <div
          className={`w-24 h-[2px] transition-all duration-300 ${
            step >= 4 ? "bg-gray-300" : "bg-gray-300"
          }`}
        ></div>
      </div>
      {/* Step 4 */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-white">
        {step === 4 ? (
          <FaRegCircleDot size={28} className="text-[#FF5733] drop-shadow-md" />
        ) : step > 4 ? (
          <FaCheckCircle className="bg-[#FF5733] text-2xl" />
        ) : (
          <FaRegCircle className="text-[#FF5733] text-2xl" />
        )}
      </div>
    </div>
  );
};

interface User {
  id: string;
  fullname: string;
  email: string;
}

interface TicketData {
  type: string;
  title: string;
  description: string;
  images: File[];
  attachments: File[];
  notes: string;
  priority: string;
  startDate?: string;
  endDate?: string;
}

interface TicketCreateProps {
  currentUser: User | null;
  step: number;
  setStep: (step: number) => void;
  ticketData: TicketData;
  setTicketData: React.Dispatch<React.SetStateAction<TicketData>>;
  selectedOption: string | null;
  setSelectedOption: (option: string | null) => void;
  submitTicket: () => Promise<void>;
  ticketCreatedId: string | null;
}

const TicketCreate: React.FC<TicketCreateProps> = ({
  currentUser,
  step,
  setStep,
  ticketData,
  setTicketData,
  selectedOption,
  setSelectedOption,
  submitTicket,
  ticketCreatedId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitTicket();
    } catch (error) {
      console.error("Error submitting ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setTicketData(prev => ({
        ...prev,
        images: [...prev.images, ...fileArray]
      }));
    }
  };

  const removeImage = (index: number) => {
    setTicketData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="w-full p-4 bg-white rounded-2xl shadow-lg relative">
      {/* Icon trang trí */}
      <img
        src="/ticket/icon3.png"
        alt="WSHN Logo"
        className="absolute bottom-0 right-0 w-[240px]"
      />
      <img
        src="/ticket/icon1.png"
        alt="Corner Right"
        className="absolute top-0 right-0 w-[120px]"
      />
      <img
        src="/ticket/icon2.png"
        alt="Corner Left"
        className="absolute bottom-16 left-0 w-[120px]"
      />

      {/* Nội dung chính */}
      <div className="w-full h-full p-6">
        <div className="w-full h-full flex flex-col items-center justify-between pt-5">
          {/* Bước 1 - Chọn loại ticket */}
          {step === 1 && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div>
                <h1 className="text-center text-2xl font-bold text-gray-800 mb-5">
                  Xin chào WISer{" "}
                  <span className="text-[#FF5733] font-semibold">
                    {currentUser?.fullname}
                  </span>
                  , bạn cần chúng tớ{" "}
                  <span className="text-[#002147] font-semibold">hỗ trợ</span>{" "}
                  gì ạ ^^
                </h1>
                <h1 className="text-center text-[#FF5733] text-md font-bold underline">
                  Hướng dẫn tạo ticket trên 360° WISers
                </h1>
              </div>
              {/* Các lựa chọn */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
                {[
                  {
                    type: "device",
                    label: "Hỗ trợ chung",
                    image: "/ticket/overall.png",
                    description:
                      "Dành cho mọi yêu cầu hỗ trợ kỹ thuật hằng ngày: máy tính, mạng nội bộ/Wi-Fi, in ấn, email, phần mềm, tài khoản đăng nhập, v.v."
                  },
                  {
                    type: "event",
                    label: "Hỗ trợ sự kiện",
                    image: "/ticket/event.png",
                    description:
                      "Dành cho nhu cầu hỗ trợ kỹ thuật cho sự kiện: setup âm thanh − ánh sáng, trình chiếu, livestream, ghi hình, mượn thiết bị và hỗ trợ tại chỗ trước, trong, sau sự kiện."
                  },
                  {
                    type: "hrorder",
                    label: "Order Nhân sự",
                    image: "/ticket/hrorder.png",
                    description:
                      "Dành cho yêu cầu điều phối hoặc bổ sung nhân sự tạm thời: hỗ trợ lớp học, hội thảo, sự kiện, trực quầy, hỗ trợ vận hành theo ca hoặc ngắn hạn."
                  }
                ].map(({ type, label, image, description }) => (
                  <div
                    key={type}
                    onClick={() => {
                      setTicketData((prev) => ({ ...prev, type }));
                      setSelectedOption(description);
                    }}
                    className={`relative w-[240px] h-[200px] flex flex-col items-center justify-end text-lg font-semibold rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                      ticketData.type === type
                        ? " bg-[#E6EEF6] shadow-lg"
                        : " border-transparent bg-gray-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={label}
                      className="absolute top-[-30px] w-[180px] h-[180px] object-contain"
                    />
                    <div className="pb-4">{label}</div>
                  </div>
                ))}
              </div>
              {selectedOption && (
                <div className="mt-6 p-4 border border-dashed rounded-lg text-[#002147] font-semibold text-center max-w-2xl mx-auto">
                  {selectedOption}
                </div>
              )}
            </div>
          )}

          {/* Bước 2 - Nhập thông tin */}
          {step === 2 && (
            <div className="w-full flex flex-col items-center">
              {ticketData.type === "event" ? (
                // Giao diện riêng cho sự kiện
                <div className="w-full max-w-2xl">
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                    Bạn hãy nhập nội dung và mô tả chi tiết
                  </h1>
                  <ProgressIndicator step={step} />
                  <div className="w-full flex flex-col gap-4">
                    <div>
                      <label className="text-lg font-semibold text-[#002147]">
                        Tên sự kiện
                      </label>
                      <Input
                        type="text"
                        placeholder="Nhập nội dung"
                        value={ticketData.title}
                        onChange={(e) =>
                          setTicketData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="mt-2"
                      />
                      <p className="text-gray-500 text-sm mt-1">
                        Ngắn gọn, tối đa 100 kí tự
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-lg font-semibold text-[#002147]">
                          Ngày bắt đầu
                        </label>
                        <input
                          type="date"
                          value={ticketData.startDate || ""}
                          onChange={(e) =>
                            setTicketData((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-lg font-semibold text-[#002147]">
                          Ngày kết thúc
                        </label>
                        <input
                          type="date"
                          value={ticketData.endDate || ""}
                          onChange={(e) =>
                            setTicketData((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] text-gray-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-lg font-semibold text-[#002147]">
                        Mô tả
                      </label>
                      <textarea
                        className="w-full h-[100px] mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                        rows={5}
                        placeholder="Nhập mô tả"
                        value={ticketData.description}
                        onChange={(e) =>
                          setTicketData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                // Giao diện chung cho các loại khác
                <div className="w-full max-w-2xl">
                  <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                    Bạn hãy nhập nội dung và mô tả chi tiết
                  </h1>
                  <ProgressIndicator step={step} />
                  <div className="w-full flex flex-col gap-4">
                    <div>
                      <label className="text-lg font-semibold text-[#002147]">
                        Tiêu đề
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập tiêu đề"
                        value={ticketData.title}
                        onChange={(e) =>
                          setTicketData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="text-lg font-semibold text-[#002147]">
                        Mô tả chi tiết
                      </label>
                      <textarea
                        className="w-full h-[120px] mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                        rows={6}
                        placeholder="Mô tả chi tiết vấn đề của bạn"
                        value={ticketData.description}
                        onChange={(e) =>
                          setTicketData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bước 3 - Upload file */}
          {step === 3 && (
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
                  Bạn hãy cung cấp cho chúng tớ hình ảnh nếu có thể nhé
                </h1>
                <ProgressIndicator step={step} />
                
                <div className="w-full flex flex-col gap-4">
                  <div className="border-2 border-dashed border-gray-300 bg-[#F8F8F8] rounded-lg p-8 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <img src="/ticket/upload.png" alt="Upload" className="w-16 h-16 object-contain mb-4" />
                      <p className="text-lg font-semibold text-gray-600">
                        Kéo thả hoặc click để chọn file
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Hỗ trợ: JPG, PNG, GIF (tối đa 10MB mỗi file)
                      </p>
                    </label>
                  </div>

                  {/* Hiển thị ảnh đã chọn */}
                  {ticketData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      {ticketData.images.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bước 4 - Xác nhận và ghi chú */}
          {step === 4 && (
            <div className="w-full flex flex-col items-center">
              <div className="w-full max-w-2xl">
                <h1 className="text-center text-2xl font-bold text-[#002147] mb-8">
Note lại cho chúng tớ những điều cần thiết nhé                </h1>
                <ProgressIndicator step={step} />
                
                <div className="w-full flex flex-col gap-4">
                  {/* Ghi chú */}
                  <div>
                    <label className="text-lg font-semibold text-[#002147]">
                      Ghi chú thêm (tùy chọn)
                    </label>
                    <textarea
                      className="w-full h-[120px] mt-2 p-3 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-[#FF5733] placeholder-gray-400"
                      rows={4}
                      placeholder="Thêm ghi chú nếu cần..."
                      value={ticketData.notes}
                      onChange={(e) =>
                        setTicketData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bước 5 - Thành công */}
          {step === 5 && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-center">
                <img 
                  src="/ticket/final.png" 
                  alt="Tạo ticket thành công" 
                  className="mx-auto mb-6 w-44 h-auto object-cover"
                />
                <h1 className="text-2xl font-bold text-[#002147] mb-4">
                  Tạo ticket thành công!
                </h1>
                <p className="text-lg text-gray-600 mb-2">
                  Mã ticket của bạn là:
                </p>
                <p className="text-2xl font-bold text-[#FF5733] mb-6">
                  {ticketCreatedId}
                </p>
                <p className="text-gray-500">
                  Chúng tôi sẽ xử lý yêu cầu của bạn trong thời gian sớm nhất.
                  Bạn có thể theo dõi tiến trình trong mục "Danh sách ticket".
                </p>
              </div>
            </div>
          )}

          {/* Nút điều hướng */}
          {step < 5 && (
            <div className="flex justify-center gap-4 w-full max-w-2xl mt-8">
              {step > 1 && (
                <button
                  onClick={handlePrevious}
                  className="w-48 px-6 py-3 rounded-lg font-semibold bg-[#EBEBEB] text-[#757575] hover:bg-gray-300"
                >
                  Quay lại
                </button>
              )}
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !ticketData.type) ||
                    (step === 2 && (!ticketData.title || !ticketData.description))
                  }
                  className={`w-48 px-6 py-3 rounded-lg font-semibold ${
                    (step === 1 && !ticketData.type) ||
                    (step === 2 && (!ticketData.title || !ticketData.description))
                      ? "bg-[#EBEBEB] text-[#757575] cursor-not-allowed"
                      : "bg-[#FF5733] text-white hover:bg-[#E64A2E]"
                  }`}
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !ticketData.title || !ticketData.description}
                  className={`w-48 px-6 py-3 rounded-lg font-semibold ${
                    isSubmitting || !ticketData.title || !ticketData.description
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#FF5733] text-white hover:bg-[#E64A2E]"
                  }`}
                >
                  {isSubmitting ? "Đang tạo..." : "Tạo ticket"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketCreate; 