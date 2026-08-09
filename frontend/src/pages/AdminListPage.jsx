import { useEffect, useState } from "react";
import socket from "../utils/socket";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { useNavigate } from "react-router";
import ChatRoomModal from "../component/ChatRoomModal";

function AdminSkeletonRow() {
  return (
    <li className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
      <div className="flex items-center gap-3 min-w-0 w-full">
        <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-neutral-800 animate-pulse" />
          <div className="h-3 w-16 rounded bg-neutral-800 animate-pulse" />
        </div>
      </div>
      <div className="h-9 w-24 rounded-lg bg-neutral-800 animate-pulse shrink-0" />
    </li>
  );
}

function ChatRowSkeleton() {
  return (
    <li className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
      <div className="flex items-center gap-3 min-w-0 w-full">
        <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-32 rounded bg-neutral-800 animate-pulse" />
          <div className="h-3 w-16 rounded bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </li>
  );
}

const STATUS_STYLES = {
  accepted: "text-emerald-500",
  ended: "text-neutral-500",
  pending: "text-amber-500",
  declined: "text-red-400",
  expired: "text-neutral-600",
};

function AdminListPage() {
  // ---- "admins" view state ----
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState({}); // { adminId: 'pending' | 'declined' | 'failed' }

  // ---- "my chats" view state ----
  const [view, setView] = useState("admins"); // "admins" | "chats"
  const [chats, setChats] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false); // fetch once, cache after that

  // ---- popup chat state (used ONLY for viewing past chats from "View All Chats") ----
  const [activeChat, setActiveChat] = useState(null);

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get("/chat/admins")
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    const handleStatusUpdate = ({ userId, status }) => {
      setAdmins((prev) =>
        prev.map((a) => (a._id === userId ? { ...a, isOnline: status === "online" } : a))
      );
    };

    const handleRequestSent = () => console.log("Request sent, waiting for admin...");
    const handleFailed = ({ reason }) => alert(reason);
    const handleDeclined = () => alert("Admin declined your request.");
    const handleExpired = () => alert("Admin didn't respond in time. Try another admin.");

    // NEW chat accepted -> go straight into the full chat room page (unchanged original behavior)
    const handleStarted = ({ roomName }) => navigate(`/chat/${roomName}`);

    socket.on("admin:status_update", handleStatusUpdate);
    socket.on("chat:request_sent", handleRequestSent);
    socket.on("chat:request_failed", handleFailed);
    socket.on("chat:request_declined", handleDeclined);
    socket.on("chat:request_expired", handleExpired);
    socket.on("chat:started", handleStarted);

    return () => {
      socket.off("admin:status_update", handleStatusUpdate);
      socket.off("chat:request_sent", handleRequestSent);
      socket.off("chat:request_failed", handleFailed);
      socket.off("chat:request_declined", handleDeclined);
      socket.off("chat:request_expired", handleExpired);
      socket.off("chat:started", handleStarted);
    };
  }, [navigate]);

  // fetch chat history lazily, only the first time the user switches to that view
  useEffect(() => {
    if (view !== "chats" || chatsLoaded) return;

    setChatsLoading(true);
    axiosClient
      .get("/chat/mine")
      .then((res) => {
        setChats(res.data);
        setChatsLoaded(true);
      })
      .catch((err) => console.error(err))
      .finally(() => setChatsLoading(false));
  }, [view, chatsLoaded]);

  const requestChat = (adminId) => {
    setRequestStatus((prev) => ({ ...prev, [adminId]: "pending" }));
    socket.emit("chat:request", { userId: user._id, adminId });
  };

  // opens a PAST chat as a popup — only used from the "chats" (history) view
  const openChat = (chat) => {
    if (!["accepted", "ended"].includes(chat.status)) return;
    setActiveChat(chat);
  };

  const goBack = () => navigate("/explore");

  const showCollegeName = user?.role === "Admin";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={goBack}
            aria-label="Back"
            className="mb-3 h-8 w-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            &#8592;
          </button>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {view === "admins" ? "Admins" : "My Chats"}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {view === "admins"
                  ? "Connect with an available admin to start a chat"
                  : "Your past and active conversations"}
              </p>
            </div>

            <button
              onClick={() => setView(view === "admins" ? "chats" : "admins")}
              className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 transition-colors"
            >
              {view === "admins" ? "View All Chats" : "Back to Admins"}
            </button>
          </div>

          <div className="h-px w-16 bg-orange-500 mt-4" />
        </div>

        {/* ================= ADMINS VIEW ================= */}
        {view === "admins" && (
          <>
            {loading && (
              <ul className="space-y-3">
                <AdminSkeletonRow />
                <AdminSkeletonRow />
                <AdminSkeletonRow />
              </ul>
            )}

            {!loading && admins.length === 0 && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-12 text-center">
                <p className="text-neutral-500 text-sm">No admins found.</p>
              </div>
            )}

            {!loading && admins.length > 0 && (
              <ul className="space-y-3">
                {admins.map((admin) => {
                  const status = requestStatus[admin._id];
                  const collegeName = admin.collegeId?.Collage_name;
                  const isPlatformAdmin = admin.role === "Admin";

                  return (
                    <li
                      key={admin._id}
                      className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 transition-colors hover:border-neutral-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-semibold text-white">
                            {(admin.firstName || admin.emailId || "A")[0].toUpperCase()}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-neutral-900 ${
                              admin.isOnline ? "bg-emerald-500" : "bg-neutral-600"
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="font-medium text-neutral-100 truncate">
                              {admin.firstName || admin.emailId || admin._id}
                            </p>
                            {isPlatformAdmin && (
                              <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                Super Admin
                              </span>
                            )}
                            {showCollegeName && collegeName && (
                              <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                                {collegeName}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs ${
                              admin.isOnline ? "text-emerald-500" : "text-neutral-500"
                            }`}
                          >
                            {admin.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>

                      {admin.isOnline && (
                        <button
                          onClick={() => requestChat(admin._id)}
                          disabled={status === "pending"}
                          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                            status === "pending"
                              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                              : "bg-orange-500 text-white hover:bg-orange-400 active:scale-95 shadow-lg shadow-orange-500/20"
                          }`}
                        >
                          {status === "pending" ? (
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400 animate-pulse" />
                              Waiting...
                            </span>
                          ) : (
                            "Request Chat"
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {/* ================= CHATS VIEW (history — opens popup) ================= */}
        {view === "chats" && (
          <>
            {chatsLoading && (
              <ul className="space-y-3">
                <ChatRowSkeleton />
                <ChatRowSkeleton />
                <ChatRowSkeleton />
              </ul>
            )}

            {!chatsLoading && chats.length === 0 && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-12 text-center">
                <p className="text-neutral-500 text-sm">No chats yet.</p>
              </div>
            )}

            {!chatsLoading && chats.length > 0 && (
              <ul className="space-y-3">
                {chats.map((chat) => {
                  const isMeUser = String(chat.userId?._id) === String(user._id);
                  const other = isMeUser ? chat.adminId : chat.userId;
                  const openable = ["accepted", "ended"].includes(chat.status);

                  return (
                    <li
                      key={chat._id}
                      onClick={() => openChat(chat)}
                      className={`flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 transition-colors ${
                        openable
                          ? "hover:border-neutral-700 cursor-pointer"
                          : "opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                          {(other?.firstName || other?.emailId || "?")[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-neutral-100 truncate">
                            {other?.firstName || other?.emailId || "Unknown"}
                          </p>
                          <p className={`text-xs ${STATUS_STYLES[chat.status] || "text-neutral-500"}`}>
                            {chat.status}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>

      {activeChat && (
        <ChatRoomModal chat={activeChat} onClose={() => setActiveChat(null)} />
      )}
    </div>
  );
}

export default AdminListPage;