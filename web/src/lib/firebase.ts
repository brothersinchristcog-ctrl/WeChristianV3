import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: This config currently uses your Android API key and Project ID.
// For full Web support, you should register a Web App in Firebase Console
// and replace this with the exact config object they provide (including appId).
const firebaseConfig = {
  apiKey: "AIzaSyDXP8v94YOvitLaixotzmOvRJsaoFuGf20",
  authDomain: "wechristian-67f07.firebaseapp.com",
  projectId: "wechristian-67f07",
  storageBucket: "wechristian-67f07.firebasestorage.app",
  messagingSenderId: "962252889183",
  appId: "PLACEHOLDER_WEB_APP_ID" // Replace when Web App is registered
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
