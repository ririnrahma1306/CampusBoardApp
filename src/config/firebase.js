import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBPTN1T2_llk3LbvSydtE3BSIZ6t5fRuhQ",
  authDomain: "campusboard1-c6e50.firebaseapp.com",
  projectId: "campusboard1-c6e50",
  storageBucket: "campusboard1-c6e50.firebasestorage.app",
  messagingSenderId: "842684230430",
  appId: "1:842684230430:web:dcb8ffc8e51f7f6370b70f",
  measurementId: "G-SYPSMYSHDJ"
};

let app, auth, db;

// Inisialisasi aman (mencegah error jika config kosong saat development)
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn("Firebase Config belum diisi. Aplikasi berjalan dalam Mode Demo Terbatas.");
  }
} catch (e) {
  console.error("Error initializing Firebase:", e);
}

export { auth, db };