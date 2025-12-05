import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { MOCK_ANNOUNCEMENTS, MOCK_EVENTS, ROLES } from './utils/constants';

// Import Pages & Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import InfoBoard from './pages/InfoBoard';
import CalendarPage from './pages/Calendar';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import UserGuide from './pages/UserGuide';

export default function App() {
  // --- PERBAIKAN 1: DETEKSI URL SEJAK AWAL ---
  // Kita cek URL langsung saat state dibuat, bukan menunggu useEffect
  const [resetParams, setResetParams] = useState(() => {
      const queryParams = new URLSearchParams(window.location.search);
      const mode = queryParams.get('mode');
      const oobCode = queryParams.get('oobCode');
      if (mode === 'resetPassword' && oobCode) {
          return { oobCode };
      }
      return null;
  });

  // Set tampilan awal berdasarkan apakah ada resetParams atau tidak
  const [currentView, setCurrentView] = useState(resetParams ? 'reset-password' : 'home');
  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminInitTab, setAdminInitTab] = useState('pending');

  // Data State
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Notifikasi State
  const [myEvents, setMyEvents] = useState([]); 
  const [userNotifications, setUserNotifications] = useState([]); 
  const [adminPending, setAdminPending] = useState([]); 
  const [adminReports, setAdminReports] = useState([]); 

  // 1. Auth Listener (DIPERBAIKI)
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // JIKA LOGIN: Ambil data user
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setUserData({ role: 'user' });
          }
          setLoading(false);
        }, () => setLoading(false));

        loadPersonalCalendar(currentUser.uid);
        return () => unsubscribeSnapshot();

      } else {
        // JIKA BELUM LOGIN / LOGOUT
        setUserData(null);
        setMyEvents([]);
        setUserNotifications([]);
        setAdminPending([]);
        setAdminReports([]);
        
        // --- PERBAIKAN 2: CEK DULU SEBELUM REDIRECT ---
        // Hanya kembali ke 'home' jika TIDAK sedang mereset password
        if (!resetParams) {
            setCurrentView('home');
        }
        
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [resetParams]); // Penting: resetParams masuk dependency

  // 2. Global Data Listeners
  useEffect(() => {
    if (!db) return;
    const qA = query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc'));
    const unsubA = onSnapshot(qA, (s) => setAnnouncements(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const qE = query(collection(db, 'acara'), orderBy('date', 'asc'));
    const unsubE = onSnapshot(qE, (s) => setEvents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { unsubA(); unsubE(); };
  }, []);

  // 3. Admin Listeners
  useEffect(() => {
    const role = userData?.role;
    if (!db || !user || role !== ROLES.ADMIN) {
        setAdminPending([]);
        setAdminReports([]);
        return;
    }
    const qP = query(collection(db, 'pengumuman'), where('status', '==', 'pending'));
    const uP = onSnapshot(qP, (s) => setAdminPending(s.docs.map(d => ({id: d.id, type: 'admin-pending', title: 'Butuh Persetujuan', desc: `"${d.data().title}"`, targetView: 'admin-dashboard', targetTab: 'pending'}))));
    const qR = query(collection(db, 'komentar'), where('isReported', '==', true));
    const uR = onSnapshot(qR, (s) => setAdminReports(s.docs.map(d => ({id: d.id, type: 'admin-report', title: 'Laporan Masuk', desc: `Komentar oleh ${d.data().userName}`, targetView: 'admin-dashboard', targetTab: 'moderation'}))));
    return () => { uP(); uR(); };
  }, [userData, user]);

  const loadPersonalCalendar = (uid) => {
    if (!db) return;
    const q = query(collection(db, 'kalender_pribadi'), where('userId', '==', uid));
    onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setMyEvents(data.map(item => item.eventId));
      const today = new Date(); today.setHours(0,0,0,0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const notificationsList = [];
      data.forEach(item => {
          if (!item.eventDate) return;
          let start;
          if (item.eventDate.includes('-')) { const [y, m, d] = item.eventDate.split('-').map(Number); start = new Date(y, m - 1, d); } else { start = new Date(item.eventDate); }
          start.setHours(0,0,0,0);
          let end = item.eventEndDate ? (item.eventEndDate.includes('-') ? new Date(...item.eventEndDate.split('-').map((n,i)=>i===1?n-1:Number(n))) : new Date(item.eventEndDate)) : new Date(start);
          end.setHours(0,0,0,0);
          const isMultiDay = start.getTime() !== end.getTime();
          if (start.getTime() === tomorrow.getTime()) notificationsList.push({ ...item, type: 'event-reminder', title: 'Pengingat Besok', desc: `Besok: ${item.eventTitle}`, isToday: false, targetView: 'kalender' });
          if (start.getTime() === today.getTime()) notificationsList.push({ ...item, type: 'event-reminder', title: isMultiDay ? 'Acara DIMULAI Hari Ini!' : 'Acara HARI INI!', desc: isMultiDay ? `Hari pertama: ${item.eventTitle}` : `Sedang berlangsung: ${item.eventTitle}`, isToday: true, targetView: 'kalender' });
          if (isMultiDay && end.getTime() === today.getTime()) notificationsList.push({ ...item, type: 'event-reminder', title: '🏁 Acara BERAKHIR Hari Ini!', desc: `Hari terakhir: ${item.eventTitle}.`, isToday: true, targetView: 'kalender' });
      });
      setUserNotifications(notificationsList);
    });
  };

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setUser(null); setUserData(null); setMyEvents([]); setUserNotifications([]); setAdminPending([]); setAdminReports([]);
    setCurrentView('home');
  };

  const allNotifications = [...userNotifications, ...adminPending, ...adminReports];

  // --- RENDER HALAMAN RESET PASSWORD (Prioritas Utama) ---
  // Kode ini diletakkan SEBELUM loading check agar bisa langsung tampil
  if (currentView === 'reset-password' && resetParams) {
      return (
          <ResetPassword 
            oobCode={resetParams.oobCode} 
            onResetSuccess={() => {
                setResetParams(null);
                // Bersihkan URL agar kembali bersih
                window.history.replaceState({}, document.title, "/");
                setCurrentView('login');
            }} 
          />
      );
  }

  if (loading) return <div className="h-screen flex items-center justify-center text-teal-600 font-bold">Memuat Aplikasi...</div>;

  const role = userData?.role || 'user';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar 
        user={user} 
        userData={userData} 
        role={role}
        setView={setCurrentView} 
        onLogout={handleLogout}
        notifications={allNotifications}
        setAdminInitTab={setAdminInitTab}
      />
      
      <main className="pb-20">
        {currentView === 'home' && <Home user={user} userData={userData} role={role} setCurrentView={setCurrentView} announcements={announcements} />}
        {user && currentView === 'papan-informasi' && <InfoBoard user={user} userData={userData} role={role} announcements={announcements} />}
        {currentView === 'kalender' && <CalendarPage user={user} events={events} />}
        {currentView === 'login' && <Auth setCurrentView={setCurrentView} />}
        {currentView === 'register' && <Auth setCurrentView={setCurrentView} />}
        {user && currentView === 'admin-dashboard' && <AdminDashboard user={user} role={role} initialTab={adminInitTab} />}
        {user && currentView === 'profile' && <Profile user={user} userData={userData} role={role} />}
        {currentView === 'panduan' && <UserGuide setView={setCurrentView} />}
      </main>

      <footer className="bg-teal-900 text-teal-200 py-8 mt-12 text-center text-sm">
        <div className="max-w-7xl mx-auto px-4">
            <p className="font-bold text-white text-lg mb-2">CampusBoard</p>
            <p>© 2025 Universitas Islam Negeri Sulthan Thaha Saifuddin Jambi</p>
        </div>
      </footer>
    </div>
  );
}