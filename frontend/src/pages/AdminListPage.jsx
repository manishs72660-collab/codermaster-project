import { useEffect, useState } from "react";
import socket from "../utils/socket";
import axios from "axios";
import { useSelector } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { useNavigate } from "react-router";

function AdminListPage() {
  const [admins, setAdmins] = useState([]);
  const [requestStatus, setRequestStatus] = useState({}); // { adminId: 'pending' | 'declined' | 'failed' }
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get("/api/admins", { withCredentials: true })
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error(err));

    const handleStatusUpdate = ({ userId, status }) => {
      setAdmins((prev) =>
        prev.map((a) => (a._id === userId ? { ...a, isOnline: status === "online" } : a))
      );
    };

    const handleRequestSent = () => console.log("Request sent, waiting for admin...");
    const handleFailed = ({ reason }) => alert(reason);
    const handleDeclined = () => alert("Admin declined your request.");
    const handleExpired = () => alert("Admin didn't respond in time. Try another admin.");
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
  }, []);

  const requestChat = (adminId) => {
    setRequestStatus((prev) => ({ ...prev, [adminId]: "pending" }));
    socket.emit("chat:request", { userId: user._id, adminId });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Admins
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Connect with an available admin to start a chat
          </p>
          <div className="h-px w-16 bg-orange-500 mt-4" />
        </div>

        {/* Empty state */}
        {admins.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 py-12 text-center">
            <p className="text-neutral-500 text-sm">No admins found.</p>
          </div>
        )}

        {/* Admin list */}
        <ul className="space-y-3">
          {admins.map((admin) => {
            const status = requestStatus[admin._id];
            return (
              <li
                key={admin._id}
                className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 transition-colors hover:border-neutral-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
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

                  {/* Name + status */}
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-100 truncate">
                      {admin.firstName || admin.emailId || admin._id}
                    </p>
                    <p
                      className={`text-xs ${
                        admin.isOnline ? "text-emerald-500" : "text-neutral-500"
                      }`}
                    >
                      {admin.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Action */}
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
      </div>
    </div>
  );
}

export default AdminListPage;