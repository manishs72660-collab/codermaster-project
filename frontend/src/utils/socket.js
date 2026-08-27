import { io } from "socket.io-client";
import { store } from "../store/store"; // <-- adjust to wherever configureStore() lives

const socket = io(import.meta.env.VITE_API_URL, {
  withCredentials: true,
  autoConnect: true,
  transports: ["websocket", "polling"],
});

let lastEmittedUserId = null;

function emitOnline() {
  const { user } = store.getState().auth;
  if (user?._id && socket.connected) {
    socket.emit("user:online", { userId: user._id, role: user.role });
    lastEmittedUserId = user._id;
  }
}

function emitOffline(userId) {
  if (userId && socket.connected) {
    socket.emit("user:offline", { userId });
  }
}

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
  emitOnline(); // handles first connect AND reconnects after drops
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", reason);
  lastEmittedUserId = null;
});

// Tracks auth state transitions:
// - null -> user  => user just logged in (or was already logged in when
//   the socket connected) => emit user:online
// - user -> null  => user just logged out while the socket is still open
//   (tab stayed open) => emit user:offline BEFORE we lose the id
store.subscribe(() => {
  const { user } = store.getState().auth;

  if (user?._id && user._id !== lastEmittedUserId) {
    emitOnline();
  } else if (!user && lastEmittedUserId) {
    emitOffline(lastEmittedUserId);
    lastEmittedUserId = null;
  }
});

export default socket;