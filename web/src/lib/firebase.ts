import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: This config currently uses your Android API key and Project ID.
// For full Web support, you should register a Web App in Firebase Console
// and replace this with the exact config object they provide (including appId).
const firebaseConfig = {
  apiKey: "AIzaSyBEZ-FrpqgECCx6qk7-do15rtLssHjtWMY",
  authDomain: "wechristian-67f07.firebaseapp.com",
  projectId: "wechristian-67f07",
  storageBucket: "wechristian-67f07.firebasestorage.app",
  messagingSenderId: "962252889183",
  appId: "1:962252889183:web:f76dd0d76af372900f8fea",
  measurementId: "G-0VKHN9VSWH"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);


