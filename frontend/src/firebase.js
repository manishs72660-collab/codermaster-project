import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAwl0kRhcu87F5bYrixr9oZab9_pm1xYww",
  authDomain: "codemaster-6c776.firebaseapp.com",
  projectId: "codemaster-6c776",
  storageBucket: "codemaster-6c776.firebasestorage.app",
  messagingSenderId: "682414943093",
  appId: "1:682414943093:web:9e6c3f2f4125169e3dc13c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();