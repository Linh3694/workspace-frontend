import React, { useState, useEffect, useRef, useMemo } from "react";
import { FiSend } from "react-icons/fi";
import { FaImage, FaCheck } from "react-icons/fa6";
import io, { Socket } from "socket.io-client";
import { BASE_URL, API_URL } from "../../../../config/api";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "../../../../components/ui/dialog";

interface User {
  _id: string;
  id: string;
  fullname: string;
  email: string;
  avatarUrl?: string;
}

interface Message {
  _id: string;
  text: string;
  sender: User;
  timestamp: string;
  type?: string;
  caption?: string;
}

interface FormattedMessage {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  senderAvatar: string;
  time: string;
  timestamp: Date;
  type: string;
  isSelf: boolean;
  caption: string;
}

interface Ticket {
  _id: string;
  ticketCode: string;
  title: string;
  status: string;
}

interface TicketChatProps {
  ticket: Ticket;
  currentUser: User | null;
  fetchTicketById: (id: string) => Promise<void>;
}

// Component Avatar riêng
const Avatar: React.FC<{
  src: string;
  alt: string;
  isOnline?: boolean;
  className?: string;
}> = React.memo(({ src, alt, isOnline, className = "" }) => {
  const [imgSrc, setImgSrc] = useState("/default-avatar.png");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setError(false);
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImgSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setError(true);
        setIsLoading(false);
        setImgSrc("/default-avatar.png");
      };
    }
  }, [src]);

  return (
    <div className="relative">
      <img
        src={imgSrc}
        alt={alt}
        className={`w-10 h-10 rounded-full border shadow-md object-cover transition-opacity duration-200 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${className}`}
        loading="lazy"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-full">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-[#FF5733] rounded-full animate-spin"></div>
        </div>
      )}
      {isOnline && !isLoading && !error && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );
});

const TicketChat: React.FC<TicketChatProps> = ({ ticket, currentUser }) => {
  const socketRef = useRef<Socket | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tempToRealIdRef = useRef<Record<string, string>>({});
  const isSendingRef = useRef(false);

  // State
  const [messagesMap, setMessagesMap] = useState<Record<string, FormattedMessage>>({});
  const [newMessage, setNewMessage] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  // const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const [seenMessages, setSeenMessages] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [messageStatus, setMessageStatus] = useState<Record<string, string>>({});

  const MESSAGES_PER_PAGE = 20;

  // Tạo danh sách tin nhắn từ messagesMap
  const messages = useMemo(() => {
    return Object.values(messagesMap).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messagesMap]);

  // Auto scroll
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom(false);
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  // Socket connection
  useEffect(() => {
    if (!ticket._id || !currentUser) return;

    socketRef.current = io(BASE_URL, {
      auth: {
        token: localStorage.getItem("token"),
        userId: currentUser.id,
      },
    });

    const socket = socketRef.current;

    socket.emit("joinTicket", ticket._id);

    // Socket event listeners
    socket.on("newMessage", (message: Message) => {
      const formattedMsg = formatMessage(message, currentUser);
      setMessagesMap((prev) => ({
        ...prev,
        [formattedMsg.id]: formattedMsg,
      }));
      
      if (!formattedMsg.isSelf) {
        sendMessageReceived(formattedMsg.id);
      }
    });

    socket.on("messageReceived", ({ messageId }) => {
      setMessageStatus((prev) => ({
        ...prev,
        [messageId]: "received",
      }));
    });

    socket.on("messageSeen", ({ messageId, userId }) => {
      setSeenMessages((prev) => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), userId],
      }));
    });

    socket.on("userTyping", ({ userId, isTyping: typing }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: typing,
      }));
    });

    socket.on("userOnline", ({ userId }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: true,
      }));
    });

    socket.on("userOffline", ({ userId }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: false,
      }));
    });

    // Load initial messages
    loadMessages();

    return () => {
      socket.disconnect();
    };
  }, [ticket._id, currentUser]);

  // Load messages
  const loadMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/tickets/${ticket._id}/messages?page=1&limit=${MESSAGES_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const newMessages = res.data.messages;
        const newMap: Record<string, FormattedMessage> = {};
        
        newMessages.forEach((msg: Message) => {
          const formattedMsg = formatMessage(msg, currentUser);
          newMap[formattedMsg.id] = formattedMsg;
        });
        
        setMessagesMap(newMap);
        setHasMore(newMessages.length === MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error("Lỗi khi load tin nhắn:", error);
    }
  };

  // Load more messages
  const loadMoreMessages = async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/tickets/${ticket._id}/messages?page=${page + 1}&limit=${MESSAGES_PER_PAGE}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const newMessages = res.data.messages;
        if (newMessages.length < MESSAGES_PER_PAGE) {
          setHasMore(false);
        }

        setMessagesMap((prev) => {
          const newMap = { ...prev };
          newMessages.forEach((msg: Message) => {
            const formattedMsg = formatMessage(msg, currentUser);
            newMap[formattedMsg.id] = formattedMsg;
          });
          return newMap;
        });

        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Lỗi khi load thêm tin nhắn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format message
  const formatMessage = (msg: Message, currentUser: User | null): FormattedMessage => ({
    id: msg._id?.toString(),
    text: msg.text,
    sender: msg.sender?.fullname || "N/A",
    senderId: msg.sender?._id,
    senderAvatar: (() => {
      const path = msg.sender?.avatarUrl || "";
      if (!path) return "/default-avatar.png";
      return path.startsWith("http") || path.startsWith("/uploads")
        ? path
        : `${BASE_URL}/uploads/Avatar/${path}`;
    })(),
    time: new Date(msg.timestamp).toLocaleString("vi-VN"),
    timestamp: new Date(msg.timestamp),
    type: msg.type || "text",
    isSelf: msg.sender?._id === currentUser?.id,
    caption: msg.caption || "",
  });

  // Send message received status
  const sendMessageReceived = (messageId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("messageReceived", {
        ticketId: ticket._id,
        messageId,
        userId: currentUser?.id,
      });
    }
  };

  // Send message seen status
  const sendMessageSeen = (messageId: string) => {
    if (socketRef.current) {
      socketRef.current.emit("messageSeen", {
        ticketId: ticket._id,
        messageId,
        userId: currentUser?.id,
      });
      setSeenMessages((prev) => ({
        ...prev,
        [messageId]: [...(prev[messageId] || []), currentUser?.id || ""],
      }));
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!isTyping && socketRef.current) {
      setIsTyping(true);
      socketRef.current.emit("typing", {
        ticketId: ticket._id,
        userId: currentUser?.id,
        isTyping: true,
      });

      setTimeout(() => {
        setIsTyping(false);
        if (socketRef.current) {
          socketRef.current.emit("typing", {
            ticketId: ticket._id,
            userId: currentUser?.id,
            isTyping: false,
          });
        }
      }, 3000);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSendingRef.current) return;

    isSendingRef.current = true;
    const tempId = `temp_${Date.now()}`;
    const messageText = newMessage.trim();
    setNewMessage("");

    // Add temporary message
    const tempMessage: FormattedMessage = {
      id: tempId,
      text: messageText,
      sender: currentUser?.fullname || "You",
      senderId: currentUser?.id || "",
      senderAvatar: currentUser?.avatarUrl 
        ? `${BASE_URL}/uploads/Avatar/${currentUser.avatarUrl}`
        : "/default-avatar.png",
      time: new Date().toLocaleString("vi-VN"),
      timestamp: new Date(),
      type: "text",
      isSelf: true,
      caption: "",
    };

    setMessagesMap((prev) => ({
      ...prev,
      [tempId]: tempMessage,
    }));

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/tickets/${ticket._id}/messages`,
        { text: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const realMessage = res.data.message;
        const formattedRealMsg = formatMessage(realMessage, currentUser);
        
        // Replace temp message with real message
        setMessagesMap((prev) => {
          const newMap = { ...prev };
          delete newMap[tempId];
          newMap[formattedRealMsg.id] = formattedRealMsg;
          return newMap;
        });

        tempToRealIdRef.current[tempId] = formattedRealMsg.id;
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      // Remove temp message on error
      setMessagesMap((prev) => {
        const newMap = { ...prev };
        delete newMap[tempId];
        return newMap;
      });
      toast.error("Không thể gửi tin nhắn");
    } finally {
      isSendingRef.current = false;
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.");
      return;
    }

    try {
      setIsUploading(true);
      const compressedFile = await compressImage(file);
      setPreviewImage(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Lỗi khi xử lý file:", error);
      toast.error("Không thể xử lý file");
    } finally {
      setIsUploading(false);
    }
  };

  // Compress image
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  })
                );
              }
            },
            "image/jpeg",
            0.7
          );
        };
      };
    });
  };

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Handle scroll
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);

      // Load more messages when scrolled to top
      if (scrollTop === 0 && hasMore && !isLoading) {
        loadMoreMessages();
      }

      // Mark messages as seen
      if (isNearBottom) {
        messages.forEach((msg) => {
          if (!msg.isSelf && !seenMessages[msg.id]?.includes(currentUser?.id || "")) {
            sendMessageSeen(msg.id);
          }
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="font-semibold text-[#002147]">
          Trao đổi - Ticket #{ticket.ticketCode}
        </h3>
        <p className="text-sm text-gray-500">{ticket.title}</p>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading && (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF5733] mx-auto"></div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isSelf ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-2 max-w-[70%] ${message.isSelf ? "flex-row-reverse" : ""}`}>
              <Avatar
                src={message.senderAvatar}
                alt={message.sender}
                isOnline={onlineUsers[message.senderId]}
              />
              <div className={`flex flex-col ${message.isSelf ? "items-end" : "items-start"}`}>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.isSelf
                      ? "bg-[#FF5733] text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.type === "image" ? (
                    <div>
                      <img
                        src={message.text}
                        alt="Shared image"
                        className="max-w-xs rounded cursor-pointer"
                        onClick={() => setPreviewImage(message.text)}
                      />
                      {message.caption && (
                        <p className="mt-2 text-sm">{message.caption}</p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-500">{message.time}</span>
                  {message.isSelf && (
                    <div className="flex items-center">
                      {messageStatus[message.id] === "received" ? (
                        <FaCheck className="text-xs text-blue-500" />
                      ) : seenMessages[message.id]?.length > 0 ? (
                        <div className="flex">
                          <FaCheck className="text-xs text-green-500" />
                          <FaCheck className="text-xs text-green-500 -ml-1" />
                        </div>
                      ) : (
                        <FaCheck className="text-xs text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {Object.keys(typingUsers).some(userId => typingUsers[userId] && userId !== currentUser?.id) && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
              <span className="text-sm text-gray-500">đang nhập...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="p-2 text-gray-500 hover:text-[#FF5733] cursor-pointer"
          >
            <FaImage size={20} />
          </label>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5733] focus:border-transparent"
            disabled={isUploading}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isUploading}
            className="p-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#E64A2E] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <FiSend size={20} />
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <Dialog 
          open={!!previewImage} 
          onOpenChange={() => {
            setPreviewImage(null);
            setImageCaption("");
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain rounded"
            />
            <div className="mt-4">
              <input
                type="text"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                placeholder="Thêm chú thích (tùy chọn)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5733]"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    // Handle send image with caption
                    setPreviewImage(null);
                    setImageCaption("");
                  }}
                  className="flex-1 px-4 py-2 bg-[#FF5733] text-white rounded-lg hover:bg-[#E64A2E]"
                >
                  Gửi
                </button>
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setImageCaption("");
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Hủy
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TicketChat; 