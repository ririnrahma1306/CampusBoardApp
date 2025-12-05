import React, { useState } from 'react';
import { Home, MessageSquare, Calendar, User, LogOut, Menu, X, Bell, FileText, Flag, ChevronRight, HelpCircle } from 'lucide-react';
import { ROLES } from '../utils/constants';

const Navbar = ({ user, userData, role, setView, onLogout, notifications = [], setAdminInitTab, setCalendarInitDate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const handleNav = (viewName) => {
    setView(viewName);
    setMobileMenuOpen(false);
    setShowNotifDropdown(false);
  };

  const handleNotifClick = (notif) => {
      setView(notif.targetView);
      
      if (notif.targetView === 'admin-dashboard' && notif.targetTab && setAdminInitTab) {
          setAdminInitTab(notif.targetTab);
      }
      if (notif.targetView === 'kalender' && notif.eventDate && setCalendarInitDate) {
          setCalendarInitDate(notif.eventDate);
      }

      setShowNotifDropdown(false);
      setMobileMenuOpen(false);
  };

  // --- KOMPONEN ISI NOTIFIKASI (Reusable) ---
  const NotificationContent = () => (
    <div className="flex flex-col max-h-[60vh] w-full">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0 z-10">
            <span className="font-bold text-gray-700">Notifikasi</span>
            <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-1 rounded-full font-bold">{notifications.length} Baru</span>
        </div>
        
        {/* List Item */}
        <div className="overflow-y-auto custom-scrollbar p-2 bg-white">
            {notifications.length > 0 ? (
                notifications.map((notif, idx) => (
                    <div 
                        key={idx} 
                        className={`p-3 mb-2 rounded-xl cursor-pointer transition flex items-start gap-3 border ${
                            notif.type === 'admin-report' ? 'bg-red-50 border-red-100' : 
                            notif.type === 'admin-pending' ? 'bg-orange-50 border-orange-100' : 
                            'bg-blue-50 border-blue-100'
                        }`}
                        onClick={() => handleNotifClick(notif)}
                    >
                        {/* Icon */}
                        <div className={`p-2 rounded-full shrink-0 mt-1 ${
                             notif.type === 'admin-report' ? 'bg-white text-red-500' : 
                             notif.type === 'admin-pending' ? 'bg-white text-orange-500' : 
                             'bg-white text-teal-600'
                        }`}>
                            {notif.type === 'admin-report' ? <Flag size={16}/> : 
                                notif.type === 'admin-pending' ? <FileText size={16}/> : 
                                <Calendar size={16}/>}
                        </div>
                        
                        {/* Teks */}
                        <div className="min-w-0 flex-grow">
                            <div className="flex justify-between items-start">
                                <p className={`text-sm font-bold truncate ${notif.isToday ? 'text-red-600' : 'text-gray-800'}`}>{notif.title}</p>
                                {notif.isToday && <span className="text-[8px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold ml-1 uppercase">Hari Ini</span>}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-1">{notif.desc}</p>
                            <div className="mt-2 flex items-center text-[10px] text-gray-400 font-medium">
                                Klik untuk lihat detail <ChevronRight size={10}/>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-10 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
                    <Bell size={32} className="opacity-20"/>
                    <span>Tidak ada notifikasi baru.</span>
                </div>
            )}
        </div>
    </div>
  );

  return (
    <nav className="bg-teal-700 text-white shadow-lg sticky top-0 z-50 select-none">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          
          {/* --- LOGO UTAMA --- */}
          <div className="flex items-center cursor-pointer gap-3" onClick={() => handleNav('home')}>
            {/* Logo Gambar (SVG Transparan) */}
            {/* Kita beri sedikit padding/bg-white rounded agar huruf 'C' gradasi terlihat jelas di atas background teal */}
            <div className="p-1 rounded-lg shadow-sm flex items-center justify-center w-10 h-10">
                <img src="/logo-c.svg" alt="Logo C" className="w-full h-full object-contain" />
            </div>
            
            {/* Teks Logo */}
            <span className="font-semibold text-xl tracking-wide">CampusBoard</span>
          </div>

          {/* --- 2. MENU DESKTOP --- */}
          <div className="hidden md:flex items-center space-x-4">
            <button onClick={() => handleNav('home')} className="hover:bg-teal-600 px-3 py-2 rounded-md flex items-center gap-2 transition">
              <Home size={18}/> Beranda
            </button>
            
            {user && (
                <button onClick={() => handleNav('papan-informasi')} className="hover:bg-teal-600 px-3 py-2 rounded-md flex items-center gap-2 transition">
                <MessageSquare size={18}/> Papan Informasi
                </button>
            )}

            <button onClick={() => handleNav('kalender')} className="hover:bg-teal-600 px-3 py-2 rounded-md flex items-center gap-2 transition">
              <Calendar size={18}/> Kalender
            </button>
            {(!user || role === ROLES.USER) && (
                <button 
                    onClick={() => handleNav('panduan')} 
                    className="hover:bg-teal-600 px-3 py-2 rounded-md flex items-center gap-2 transition text-teal-100 hover:text-white" 
                    title="Panduan Pengguna"
                >
                  <HelpCircle size={18}/> Bantuan
                </button>
            )}
            
            {user ? (
              <>
                {/* Notifikasi Desktop (Dropdown) */}
                <div className="relative">
                    <button 
                        onClick={() => { setShowNotifDropdown(!showNotifDropdown); setMobileMenuOpen(false); }}
                        className={`p-2 rounded-full transition focus:outline-none ${showNotifDropdown ? 'bg-teal-800 ring-2 ring-teal-500' : 'hover:bg-teal-600'}`}
                    >
                        <Bell size={20} />
                        {notifications.length > 0 && (
                            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-teal-700 animate-pulse">
                                {notifications.length}
                            </span>
                        )}
                    </button>

                    {showNotifDropdown && (
                        <div className="absolute right-0 mt-3 z-50 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in-down origin-top-right">
                            <NotificationContent />
                        </div>
                    )}
                </div>

                {role === ROLES.ADMIN && (
                  <button onClick={() => handleNav('admin-dashboard')} className="bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-md font-medium shadow-sm transition text-sm">
                    Admin Panel
                  </button>
                )}
                
                <div className="relative group">
                  <button onClick={() => handleNav('profile')} className="flex items-center gap-2 hover:bg-teal-600 px-3 py-2 rounded-md border border-transparent hover:border-teal-500 transition">
                    {userData?.photoBase64 ? <img src={userData.photoBase64} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"/> : <User size={18} /> }
                  </button>
                </div>
                <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 p-2 rounded-full shadow-sm transition" title="Keluar"><LogOut size={18} /></button>
              </>
            ) : (
              <button onClick={() => handleNav('login')} className="bg-white text-teal-700 font-bold px-4 py-2 rounded-md hover:bg-gray-100 transition shadow-sm">Login / Daftar</button>
            )}
          </div>

          {/* --- 3. TOMBOL MENU MOBILE --- */}
          <div className="md:hidden flex items-center gap-3">
             {/* Tombol Notifikasi Mobile */}
             {user && (
                <button 
                    onClick={() => { setShowNotifDropdown(true); setMobileMenuOpen(false); }} 
                    className="relative p-2 rounded-full hover:bg-teal-600 transition active:scale-95"
                >
                    <Bell size={24}/>
                    {notifications.length > 0 && <span className="absolute top-1 right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-teal-700 animate-pulse"></span>}
                </button>
             )}
            <button onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setShowNotifDropdown(false); }} className="focus:outline-none p-1 hover:bg-teal-600 rounded-md">
                {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- 4. MODAL NOTIFIKASI MOBILE (RESPONSIF ANDROID) --- */}
      {/* Menggunakan Fixed Overlay yang menutupi seluruh layar */}
      {showNotifDropdown && (
         <div className="md:hidden fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-20">
             {/* Backdrop Gelap */}
             <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setShowNotifDropdown(false)}
             ></div>
             
             {/* Kontainer Modal (Lebar Penuh tapi ada margin) */}
             <div className="relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[80vh] flex flex-col">
                 <NotificationContent />
                 
                 {/* Tombol Tutup */}
                 <button 
                    onClick={() => setShowNotifDropdown(false)} 
                    className="w-full py-3 bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 border-t border-gray-200"
                 >
                    Tutup
                 </button>
             </div>
         </div>
      )}

      {/* --- 5. DROPDOWN MENU MOBILE --- */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-teal-800 px-4 pt-4 pb-6 space-y-3 border-t border-teal-600 shadow-2xl fixed w-full z-50 left-0 h-screen overflow-y-auto">
          <button onClick={() => handleNav('home')} className="w-full text-left px-4 py-3 rounded-xl bg-teal-700/50 hover:bg-teal-700 transition font-medium flex items-center gap-3">
              <Home size={20}/> Beranda
          </button>
          
          {user && (
            <button onClick={() => handleNav('papan-informasi')} className="w-full text-left px-4 py-3 rounded-xl bg-teal-700/50 hover:bg-teal-700 transition font-medium flex items-center gap-3">
                <MessageSquare size={20}/> Papan Informasi
            </button>
          )}

          <button onClick={() => handleNav('kalender')} className="w-full text-left px-4 py-3 rounded-xl bg-teal-700/50 hover:bg-teal-700 transition font-medium flex items-center gap-3">
              <Calendar size={20}/> Kalender
          </button>
           {(!user || role === ROLES.USER) && (
          <button onClick={() => handleNav('panduan')} className="w-full text-left px-3 py-2 rounded-md hover:bg-teal-700 transition flex items-center gap-2 text-teal-200 font-medium"><HelpCircle size={16}/> Panduan Pengguna</button> )}
          
          {user ? (
            <div className="pt-6 mt-4 border-t border-teal-600/50 space-y-3">
              {role === ROLES.ADMIN && (
                <button onClick={() => handleNav('admin-dashboard')} className="w-full text-left px-4 py-3 rounded-xl bg-orange-600 text-white font-bold shadow-md flex items-center gap-3">
                    <FileText size={20}/> Admin Panel
                </button>
              )}
              <button onClick={() => handleNav('profile')} className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl hover:bg-teal-700 font-semibold transition">
                 {userData?.photoBase64 ? <img src={userData.photoBase64} alt="Profile" className="w-8 h-8 rounded-full object-cover border-2 border-white"/> : <User size={24} /> }
                 <div className="flex flex-col text-left">
                     <span className="text-sm font-bold">{user.displayName}</span>
                     <span className="text-xs font-normal opacity-70">Lihat Profil</span>
                 </div>
              </button>
              <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-xl text-red-200 bg-red-900/20 hover:bg-red-900/40 transition font-medium flex items-center gap-3 mt-4">
                  <LogOut size={20}/> Logout
              </button>
            </div>
          ) : (
            <div className="pt-6 mt-4 border-t border-teal-600/50">
                <button onClick={() => handleNav('login')} className="block w-full text-center px-4 py-3 rounded-xl bg-white text-teal-800 font-bold shadow-lg active:scale-95 transition">
                    Login / Daftar Sekarang
                </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;