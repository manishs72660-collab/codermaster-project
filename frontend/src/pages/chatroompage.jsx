import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import socket from "../utils/socket";

function ChatRoomPage() {
  const { roomName } = useParams(); // e.g. "chat-<chatRequestId>"
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [chatRequest, setChatRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // roomName looks like "chat-<id>" -> extract the raw chatRequestId for API calls
  const chatRequestId = roomName?.replace("chat-", "");

  useEffect(() => {
    let isMounted = true;

    axiosClient
      .get(`/chat/chats/${chatRequestId}/messages`)
      .then((res) => {
        if (!isMounted) return;
        setChatRequest(res.data.chatRequest);
        setMessages(res.data.messages);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleEnded = () => {
      alert("This chat has ended.");
      navigate("/admins");
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:ended", handleEnded);

    return () => {
      isMounted = false;
      socket.off("chat:message", handleMessage);
      socket.off("chat:ended", handleEnded);
    };
  }, [chatRequestId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("chat:message", {
      roomName,
      chatRequestId,
      senderId: user._id,
      text,
    });
    setText("");
  };

  const endChat = () => {
    if (!chatRequest) return;

    // FIX: was checking role === "admin" (lowercase, matches nothing in the
    // schema). The person on the "admin side" of this chat is a "CollageAdmin",
    // so recognize them directly by role rather than falling through to the
    // populated chatRequest.adminId every time.
    const adminId =
      user.role === "CollageAdmin"
        ? user._id
        : chatRequest.adminId?._id || chatRequest.adminId;

    socket.emit("chat:end", { chatRequestId, roomName, adminId });
    navigate("/admins");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm">Loading chat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-semibold text-white">
              {(chatRequest?.adminId?.firstName || "C")[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <h3 className="text-neutral-100 font-medium text-sm">Chat</h3>
              <p className="text-xs text-emerald-500">Active</p>
            </div>
          </div>
          <button
            onClick={endChat}
            className="text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg px-3 py-1.5 transition-colors"
          >
            End Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-neutral-600 text-sm">No messages yet. Say hello 👋</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.senderId === user._id;
            return (
              <div
                key={msg._id || Math.random()}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <span
                  className={`inline-block max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    isMine
                      ? "bg-orange-500 text-white rounded-br-sm shadow-lg shadow-orange-500/10"
                      : "bg-neutral-800 text-neutral-100 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-4 border-t border-neutral-800 shrink-0 bg-neutral-950">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
              text.trim()
                ? "bg-orange-500 text-white hover:bg-orange-400 active:scale-95 shadow-lg shadow-orange-500/20"
                : "bg-neutral-800 text-neutral-600 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatRoomPage;