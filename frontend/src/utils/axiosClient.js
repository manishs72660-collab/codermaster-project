import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- silent refresh on expired access token -----------------------------
// userAuth middleware responds 401 with { code: "TOKEN_EXPIRED" } when the
// access token has expired but might still have a valid refresh token.
// This interceptor calls /auth/refresh once, then retries the original
// request. Concurrent 401s while a refresh is already in flight are queued
// so we don't fire multiple refresh calls at once.

let isRefreshing = false;
let pendingRequests = [];

const flushQueue = (error) => {
  pendingRequests.forEach((cb) => cb(error));
  pendingRequests = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isExpired = error.response?.data?.code === "TOKEN_EXPIRED";

    if (error.response?.status === 401 && isExpired && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((err) => {
            if (err) reject(err);
            else resolve(axiosClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axiosClient.post("/auth/refresh");
        flushQueue(null);
        return axiosClient(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;