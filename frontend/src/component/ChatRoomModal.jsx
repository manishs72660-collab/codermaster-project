import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import socket from "../utils/socket";

function MessageSkeleton() {
  return (
    <div className="space-y-3 px-1">
      <div className="flex justify-start">
        <div className="h-9 w-40 rounded-2xl rounded-bl-sm bg-neutral-800 animate-pulse" />
      </div>
      <div className="flex justify-end">
        <div className="h-9 w-56 rounded-2xl rounded-br-sm bg-neutral-800 animate-pulse" />
      </div>
      <div className="flex justify-start">
        <div className="h-9 w-28 rounded-2xl rounded-bl-sm bg-neutral-800 animate-pulse" />
      </div>
    </div>
  );
}

// chat, when passed in, is a ChatRequest doc: { _id, userId, adminId, status, ... }
function ChatRoomModal({ chat, onClose }) {
  const { user } = useSelector((state) => state.auth);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const bottomRef = useRef(null);

  const chatRequestId = chat._id;
  const roomName = `chat-${chatRequestId}`;

  const other =
    String(chat.userId?._id) === String(user._id) ? chat.adminId : chat.userId;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadError(false);

    axiosClient
      .get(`/chat/chats/${chatRequestId}/messages`)
      .then((res) => {
        if (!isMounted) return;
        setMessages(res.data.messages || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!isMounted) return;
        setLoadError(true);
        setLoading(false);
      });

    // join the room so this socket receives messages/end events for it
    // (server rooms are joined on accept, but this modal can be reopened
    // later from a fresh page load, so re-join defensively here)
    socket.emit("chat:join_room", { roomName });

    const handleMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleEnded = () => {
      alert("This chat has ended.");
      onClose();
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:ended", handleEnded);

    return () => {
      isMounted = false;
      socket.off("chat:message", handleMessage);
      socket.off("chat:ended", handleEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatRequestId]);

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
    const adminId =
      user.role === "CollageAdmin"
        ? user._id
        : chat.adminId?._id || chat.adminId;

    socket.emit("chat:end", { chatRequestId, roomName, adminId });
    onClose();
  };

  return (
    // backdrop
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* modal panel — stop click-through to backdrop */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg h-[80vh] bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
      >
        {/* header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-semibold text-white shrink-0">
              {(other?.firstName || other?.emailId || "C")[0]?.toUpperCase() || "C"}
            </div>
            <div className="min-w-0">
              <h3 className="text-neutral-100 font-medium text-sm truncate">
                {other?.firstName || other?.emailId || "Chat"}
              </h3>
              <p
                className={`text-xs ${
                  chat.status === "accepted" ? "text-emerald-500" : "text-neutral-500"
                }`}
              >
                {chat.status === "accepted" ? "Active" : chat.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {chat.status === "accepted" && (
              <button
                onClick={endChat}
                className="text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg px-3 py-1.5 transition-colors"
              >
                End Chat
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* body */}
        {loading && (
          <div className="flex-1 px-4 py-6 min-h-0 overflow-y-auto">
            <MessageSkeleton />
          </div>
        )}

        {!loading && loadError && (
          <div className="flex-1 flex items-center justify-center text-neutral-400 text-sm px-4 text-center">
            Couldn't load this chat. It may have ended or you don't have access to it.
          </div>
        )}

        {!loading && !loadError && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-3">
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-neutral-600 text-sm">No messages yet. Say hello 👋</p>
                </div>
              )}

              {messages.map((msg) => {
                const isMine = String(msg.senderId) === String(user._id);
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

            {/* input footer — only for active chats; ended chats are read-only */}
            {chat.status === "accepted" && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChatRoomModal;