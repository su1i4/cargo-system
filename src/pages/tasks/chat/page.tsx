import React, { useEffect, useRef, useState } from "react";
import { Input, Button, Spin, Popover, message } from "antd";
import { liveProvider } from "../../../contexts/liveProvider";
import {
  DownloadOutlined,
  FullscreenOutlined,
  LinkOutlined,
  SendOutlined,
  ShareAltOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import timezone from "dayjs/plugin/timezone";
import { API_URL } from "../../../App";
import { useCustom } from "@refinedev/core";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

interface ChatPageProps {
  messages_load: any;
  loading: boolean;
  dialog_id: number;
}

const ChatPage: React.FC<ChatPageProps> = ({
  messages_load,
  loading,
  dialog_id,
}) => {
  const token = localStorage.getItem("token");

  const { data: user_profile } = useCustom({
    url: `${API_URL}/users/profile`,
    method: "get",
    meta: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const [myData, setMyData] = useState<any>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const imageRef = useRef<any>(null);

  const handleFullscreen = (e: any) => {
    e.stopPropagation();
    const element = imageRef.current;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  useEffect(() => {
    const subscription = liveProvider.subscribe({
      channel: "message",
      types: [],
      callback: (data: any) => {
        if (
          data &&
          typeof data?.message?.payload === "string" &&
          data?.message?.meta?.dialog_id === dialog_id
        ) {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              message: data?.message?.payload,
              type: data?.message?.meta?.type,
              assigned_chat: data?.message?.meta?.assigned_chat,
              assigned_chat_id: data?.message?.meta?.assigned_chat_id,
              created_at: data?.message?.meta?.created_at,
            },
          ]);
        }
      },
      meta: {
        dialog_id: dialog_id,
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dialog_id]);

  useEffect(() => {
    setMessages(messages_load);
  }, [messages_load, loading]);

  useEffect(() => {
    if (user_profile?.data) {
      setMyData(user_profile.data);
    }
  }, [user_profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (
    messageText = newMessage,
    messageType = "text"
  ) => {
    if (!dialog_id) {
      message.error("Чат недоступен. Пожалуйста, обновите страницу.");
      return;
    }

    if (messageText.trim()) {
      liveProvider.publish({
        channel: "message",
        payload: messageText,
        meta: {
          dialog_id: dialog_id,
          type: messageType,
          assigned_chat: myData,
          assigned_chat_id: myData?.id,
        },
      });
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData?.emoji);
  };

  const getAvatarColor = (name: any) => {
    if (!name) return "#e0e0e0";

    const colors = ["#c4f5d3", "#ffdcdc", "#e0d1ff", "#d1f4ff", "#ffe0b2"];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const handleFileUpload = () => {
    if (!dialog_id) {
      message.error("Чат недоступен. Пожалуйста, обновите страницу.");
      return;
    }

    // Create a hidden file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";

    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${API_URL}/file-upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        const data = await response.json();
        const fileType = file.type.startsWith("image/") ? "photo" : "video";
        handleSendMessage(data?.filePath, fileType);
      } catch (error) {
        message.error("Не удалось загрузить файл");
      }
    };

    input.click();
  };

  const handleDownloadPhoto = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;

      const filename = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        message.success(`Картинка успешно загружена`);
      }, 100);
    } catch (error) {
      console.error("Error downloading photo:", error);
    }
  };

  const renderMessage = (messageContent: any, messageType: any) => {
    const COMMON_URL = API_URL + "/" + messageContent;
    console.log(COMMON_URL);
    if (messageType === "photo") {
      return (
        <div style={{ maxWidth: "100%", marginTop: 5, position: "relative" }}>
          <img
            ref={imageRef}
            src={COMMON_URL}
            alt="Shared photo"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
            }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src =
                "https://placehold.co/200x150?text=Ошибка+загрузки+изображения";
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              display: "flex",
              gap: 8,
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 20,
              padding: "4px 8px",
            }}
          >
            <DownloadOutlined
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadPhoto(COMMON_URL);
              }}
              style={{ fontSize: 16, color: "white" }}
            />
            <ShareAltOutlined
              onClick={(e) => {
                e.stopPropagation();
                const imageUrl = COMMON_URL;
                navigator.clipboard
                  .writeText(imageUrl)
                  .then(() => message.success("Ссылка скопирована"))
                  .catch(() => message.error("Не удалось скопировать ссылку"));
              }}
              style={{ fontSize: 16, color: "white" }}
            />
            <FullscreenOutlined
              onClick={handleFullscreen}
              style={{ fontSize: 16, color: "white" }}
            />
          </div>
        </div>
      );
    } else if (messageType === "video") {
      return (
        <div style={{ maxWidth: "100%", marginTop: 5 }}>
          <video
            controls
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              minHeight: "200px",
              borderRadius: "8px",
            }}
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              const errorDiv = document.createElement("div");
              errorDiv.textContent = "Ошибка загрузки видео";
              errorDiv.style.padding = "80px 20px";
              errorDiv.style.backgroundColor = "#f5f5f5";
              errorDiv.style.borderRadius = "8px";
              errorDiv.style.textAlign = "center";
              target.parentNode?.replaceChild(errorDiv, target);
            }}
          >
            <source src={COMMON_URL} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return messageContent;
  };

  if (!dialog_id) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: "100%",
        background: "#ffffff",
        overflow: "hidden",
        color: "#333",
      }}
    >
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading || uploadLoading ? (
          <Spin size="large" style={{ margin: "auto" }} />
        ) : messages.length === 0 ? (
          <div
            style={{ textAlign: "center", color: "#aaa", marginTop: "100px" }}
          >
            <div style={{ fontSize: 48 }}>💬</div>
            <p>Сообщений пока нет</p>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => {
              const isMine = message?.assigned_chat_id === myData?.id;
              const firstName = message?.assigned_chat?.firstName || "";
              const lastName = message?.assigned_chat?.lastName || "";
              const senderName = isMine ? "Вы" : `${firstName} ${lastName}`;
              const avatarColor = getAvatarColor(senderName);
              const time = message?.created_at
                ? dayjs(message.created_at).utc().format("HH:mm")
                : dayjs().utc().format("HH:mm");

              return (
                <div key={index} style={{ marginBottom: 16, width: "100%" }}>
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMine ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "fit-content",
                        display: "flex",
                        alignItems: "flex-start",
                        flexDirection: isMine ? "row-reverse" : "row",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: avatarColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#333",
                          fontWeight: 500,
                          marginLeft: isMine ? 8 : 0,
                          marginRight: isMine ? 0 : 8,
                          flexShrink: 0,
                        }}
                      >
                        {senderName.charAt(0).toUpperCase()}
                      </div>

                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isMine ? "flex-end" : "flex-start",
                          gap: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            lineHeight: "12px",
                            fontWeight: 500,
                          }}
                        >
                          {senderName}
                        </span>

                        <div
                          style={{
                            backgroundColor: isMine ? "#e1f5fe" : "#f1f1f1",
                            padding: "6px 12px",
                            borderRadius: 16,
                            borderBottomRightRadius: isMine ? 4 : 16,
                            borderBottomLeftRadius: isMine ? 16 : 4,
                            maxWidth: "300px",
                            wordBreak: "break-word",
                            color: "#333",
                            minWidth: "fit-content",
                            width: "fit-content",
                          }}
                        >
                          <div
                            style={{
                              lineHeight: "16px",
                              margin: 0,
                              minWidth: 50,
                              textAlign: isMine ? "end" : "start",
                            }}
                          >
                            {renderMessage(message.message, message.type)}
                          </div>
                          <p
                            style={{
                              fontSize: 10,
                              lineHeight: "10px",
                              color: "#888",
                              margin: 0,
                              marginTop: 5,
                              textAlign: isMine ? "end" : "start",
                            }}
                          >
                            {time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div
        style={{
          padding: "10px 16px 0px 16px",
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          gap: 8,
        }}
      >
        <Button
          icon={<LinkOutlined />}
          onClick={handleFileUpload}
          style={{
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          loading={uploadLoading}
          disabled={!dialog_id}
        />
        <Popover
          content={<EmojiPicker onEmojiClick={handleEmojiClick} />}
          trigger="click"
          visible={isEmojiPickerVisible}
          onVisibleChange={setIsEmojiPickerVisible}
        >
          <Button
            style={{
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            icon={<SmileOutlined style={{ height: 14, width: 14 }} />}
            disabled={!dialog_id}
          />
        </Popover>
        <Input
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            flex: 1,
            backgroundColor: "#f5f5f5",
            color: "#333",
            border: "none",
            borderRadius: 20,
            height: 40,
            padding: "0px 16px",
          }}
          disabled={!dialog_id}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => handleSendMessage()}
          style={{
            borderRadius: "50%",
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          disabled={!dialog_id || !newMessage.trim()}
        />
      </div>
    </div>
  );
};

export default ChatPage;
