// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// Analytics is optional. You can keep it if you want, but it is not required
// for Google Sign-In.
// import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBlAUSCclx-yTmoISuSQHahxkLiK_3EMxw",
  authDomain: "leetcode-clone-f22eb.firebaseapp.com",
  projectId: "leetcode-clone-f22eb",
  storageBucket: "leetcode-clone-f22eb.firebasestorage.app",
  messagingSenderId: "422063173515",
  appId: "1:422063173515:web:7b19daff9124838858498e",
  measurementId: "G-BZ7YKG08LP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional Analytics (only needed if you want analytics)
// const analytics = getAnalytics(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Google Provider for "Continue with Google"
export const googleProvider = new GoogleAuthProvider();

// Optional default export if you need the app instance elsewhere
export default app;