import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: This config currently uses your Android API key and Project ID.
// For full Web support, you should register a Web App in Firebase Console
// and replace this with the exact config object they provide (including appId).
const firebaseConfig = {
  apiKey: "AIzaSyDEZ-FrpqgECCx6qk7-do1SrtLssHjtWMY",
  authDomain: "wechristian-67f07.firebaseapp.com",
  projectId: "wechristian-67f07",
  storageBucket: "wechristian-67f07.firebasestorage.app",
  messagingSenderId: "962252889183",
  appId: "1:962252889183:web:e9bf7181f5b26dd20f8fea",
  measurementId: "G-SYMMXDDKJ1"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
