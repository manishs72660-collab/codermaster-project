import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import socket from "../utils/socket";

function IncomingChatPopup() {
  const [incoming, setIncoming] = useState(null); // { chatRequestId, userId }
  const navigate = useNavigate();

  useEffect(() => {
    const handleIncoming = (data) => setIncoming(data);

    const handleExpired = ({ chatRequestId }) => {
      setIncoming((prev) => (prev?.chatRequestId === chatRequestId ? null : prev));
    };

    // fired for BOTH sides once the admin accepts — redirect the admin into the room
    const handleStarted = ({ roomName }) => {
      setIncoming(null);
      navigate(`/chat/${roomName}`);
    };

    socket.on("chat:incoming_request", handleIncoming);
    socket.on("chat:request_expired", handleExpired);
    socket.on("chat:started", handleStarted);

    return () => {
      socket.off("chat:incoming_request", handleIncoming);
      socket.off("chat:request_expired", handleExpired);
      socket.off("chat:started", handleStarted);
    };
  }, [navigate]);

  if (!incoming) return null;

  const respond = (accept) => {
    socket.emit("chat:respond", { chatRequestId: incoming.chatRequestId, accept });
    setIncoming(null);
    // no navigate() here directly — we wait for the server's "chat:started" event
    // above, so both sides only redirect once the server confirms the room is ready
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl shadow-black/40 overflow-hidden">
        {/* top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400" />

        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            {/* pulsing status dot + avatar */}
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-semibold text-lg">
                {String(incoming.userId).slice(-2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-orange-400 border-2 border-zinc-900 animate-pulse" />
            </div>

            <div className="min-w-0">
              <p className="text-zinc-100 font-semibold text-sm leading-tight">
                Incoming chat request
              </p>
              <p className="text-zinc-400 text-xs truncate mt-0.5">
                User {String(incoming.userId).slice(-6)} wants to chat
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => respond(false)}
              className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] transition-all duration-150 border border-zinc-700"
            >
              Decline
            </button>
            <button
              onClick={() => respond(true)}
              className="flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-orange-500/20"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomingChatPopup;