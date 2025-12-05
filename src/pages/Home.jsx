import React, { useState } from 'react';
import { MessageSquare, Calendar, Users, X, MapPin, MessageCircle, Video, User, ArrowRight, Maximize2, LogIn, Clock, Image as ImageIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
import CommentSection from '../components/CommentSection';

// Helper functions
const getEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Home = ({ user, userData, role, setCurrentView, announcements }) => {
  const [selectedPost, setSelectedPost] = useState(null);

  const limit = user ? 6 : 3;

  const latestPosts = announcements
    .filter(a => a.status === 'published')
    .slice(0, limit);

  // ========================================================================
  // MODE 1: TAMPILAN DETAIL (FULL PAGE - SESUAI UI HLD & LLD)
  // ========================================================================
  if (selectedPost) {
      return (
          <div className="min-h-screen bg-white animate-fade-in pb-20">
              
              {/* Header Navigasi (Sticky) */}
              <div className="sticky top-16 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100">
                  <div className="max-w-7xl mx-auto px-4 py-4">
                      <button 
                        onClick={() => setSelectedPost(null)} 
                        className="flex items-center gap-2 text-gray-500 font-bold hover:text-teal-700 transition group"
                      >
                          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                          Kembali ke Beranda
                      </button>
                  </div>
              </div>

              {/* Kontainer Utama */}
              <div className="max-w-7xl mx-auto px-4 mt-8 lg:mt-12">
                  
                  {/* HEADER JUDUL & META */}
                  <div className="mb-10 border-b border-gray-100 pb-8">
                      <span className="bg-teal-600 text-white text-xs font-bold px-3 py-1 rounded uppercase tracking-wider mb-4 inline-block">
                          {selectedPost.category}
                      </span>
                      <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                          {selectedPost.title}
                      </h1>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                           <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                <Clock size={16} className="text-teal-600"/>
                                {selectedPost.createdAt?.toDate ? formatDate(selectedPost.createdAt.toDate()) : 'Baru saja'}
                           </span>
                           
                           {/* Penulis dengan Badge Admin jika ada */}
                           <span className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                <User size={16} className="text-teal-600"/>
                                <span className="text-gray-900 font-semibold flex items-center gap-1">
                                    {selectedPost.authorName || 'User'}
                                    {selectedPost.authorRole === 'admin' && (
                                        <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm ml-1" title="Terverifikasi Admin">
                                            <ShieldCheck size={10} /> Admin
                                        </span>
                                    )}
                                </span>
                           </span>
                      </div>
                  </div>

                  {/* LAYOUT SPLIT: KONTEN (KIRI) - GAMBAR (KANAN) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                      
                      {/* KOLOM KIRI: TEKS KONTEN (Lebar 7/12) */}
                      <div className="lg:col-span-7 order-2 lg:order-1">
                          <div className="prose prose-lg max-w-none text-gray-700 leading-loose text-justify font-sans whitespace-pre-wrap">
                              {selectedPost.content}
                          </div>

                          {/* Info Tambahan: Jadwal & Lokasi */}
                          {(selectedPost.startDate || selectedPost.eventLocation) && (
                              <div className="mt-10 bg-blue-50/60 p-6 rounded-xl border-l-4 border-blue-500">
                                  <h4 className="text-blue-900 font-bold mb-4 flex items-center gap-2 text-lg">
                                      <Calendar size={20} className="text-blue-600"/> Detail Pelaksanaan
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {selectedPost.startDate && (
                                          <div>
                                              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Waktu</p>
                                              <p className="text-gray-800 font-medium text-lg">
                                                  {formatDate(selectedPost.startDate)}
                                                  {selectedPost.endDate && ` - ${formatDate(selectedPost.endDate)}`}
                                              </p>
                                          </div>
                                      )}
                                      {selectedPost.eventLocation && (
                                          <div>
                                              <p className="text-xs font-bold text-gray-500 uppercase mb-1">Tempat</p>
                                              <p className="text-gray-800 font-medium text-lg flex items-center gap-1">
                                                  <MapPin size={18} className="text-red-500"/> {selectedPost.eventLocation}
                                              </p>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )}

                          {/* Video Player */}
                          {selectedPost.videoUrl && getEmbedUrl(selectedPost.videoUrl) && (
                              <div className="mt-10">
                                  <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                                      <Video size={18}/> Video Terkait
                                  </h4>
                                  <div className="rounded-2xl overflow-hidden shadow-lg bg-black aspect-video">
                                      <iframe className="w-full h-full" src={getEmbedUrl(selectedPost.videoUrl)} title="Video Preview" frameBorder="0" allowFullScreen></iframe>
                                  </div>
                              </div>
                          )}
                      </div>

                      {/* KOLOM KANAN: GAMBAR ILUSTRASI (Lebar 5/12) */}
                      <div className="lg:col-span-5 order-1 lg:order-2">
                          {selectedPost.imageUrl ? (
                              <div className="sticky top-32">
                                  <div className="rounded-2xl overflow-hidden shadow-2xl shadow-gray-200/50 border border-gray-100 bg-white p-2 transform rotate-1 hover:rotate-0 transition duration-500">
                                      <img 
                                        src={selectedPost.imageUrl} 
                                        alt={selectedPost.title} 
                                        className="w-full h-auto rounded-xl object-cover" 
                                      />
                                  </div>
                                  <p className="text-center text-xs text-gray-400 mt-3 italic">Dokumentasi Kegiatan</p>
                              </div>
                          ) : (
                              // Placeholder Ilustrasi
                              <div className="sticky top-32 h-64 lg:h-80 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300">
                                  <ImageIcon size={64} className="mb-2 opacity-20"/>
                                  <span className="text-sm font-bold opacity-40">Tidak ada gambar</span>
                              </div>
                          )}
                      </div>

                  </div>

                  {/* SECTION KOMENTAR (Full Width di Bawah) */}
                  <div className="mt-20 border-t border-gray-100 pt-10">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                          <MessageCircle className="text-teal-600" size={28}/> Diskusi
                      </h3>
                      <div className="bg-gray-50 rounded-2xl p-6 md:p-10 border border-gray-200">
                          <CommentSection announcementId={selectedPost.id} user={user} userData={userData} role={role} />
                      </div>
                  </div>

              </div>
          </div>
      );
  }

  // ========================================================================
  // MODE 2: TAMPILAN BERANDA GRID (DEFAULT)
  // ========================================================================
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-16 px-4 text-center rounded-b-3xl shadow-md mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Selamat Datang di CampusBoard</h1>
        <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto">
          Pusat informasi terpadu, pengumuman akademik, dan kegiatan kampus Universitas Islam Negeri Sulthan Thaha Saifuddin Jambi.
        </p>
        {!user && (
          <button onClick={() => setCurrentView('login')} className="mt-6 bg-white text-teal-700 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition transform hover:scale-105">
            Bergabung Sekarang
          </button>
        )}
      </div>

      {/* Latest Announcements */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="flex justify-between items-end mb-6 border-b pb-2">
          <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-teal-500 pl-3">
            Pengumuman Terbaru
          </h2>
          
          {user ? (
            <button 
                onClick={() => setCurrentView('papan-informasi')} 
                className="text-teal-600 font-medium hover:underline flex items-center gap-1"
            >
                Lihat Semua <ArrowRight size={16}/>
            </button>
          ) : (
            <button 
                onClick={() => setCurrentView('login')} 
                className="text-gray-500 text-sm hover:text-teal-600 flex items-center gap-1 transition"
            >
                <LogIn size={14}/> Login untuk melihat lainnya
            </button>
          )}
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {latestPosts.length > 0 ? latestPosts.map((item) => (
            <div 
                key={item.id} 
                onClick={() => setSelectedPost(item)} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition duration-300 cursor-pointer group flex flex-col h-full"
            >
               {item.imageUrl ? (
                    <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-teal-800 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                        {item.category}
                      </span>
                    </div>
                  ) : (
                    <div className="h-2 bg-teal-600 w-full"></div>
                  )}

              <div className="p-5 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                        {item.createdAt?.toDate ? formatDate(item.createdAt.toDate()) : 'Baru saja'}
                    </span>
                    {!item.imageUrl && (
                        <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-100">
                        {item.category}
                        </span>
                    )}
                </div>

                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">{item.title}</h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{item.content}</p>
                
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        {/* TAMPILAN PENULIS DI CARD UTAMA */}
                        <User size={14}/> 
                        <span className="font-medium truncate max-w-[120px] flex items-center gap-1">
                            {item.authorName || 'User'}
                            {item.authorRole === 'admin' && (
                                <ShieldCheck size={10} className="text-blue-600 fill-blue-100" />
                            )}
                        </span>
                    </div>
                    <div className="flex gap-2 text-gray-400">
                        {item.videoUrl && <Video size={14} className="text-red-400"/>}
                        <MessageCircle size={14} className="text-blue-400"/>
                    </div>
                </div>
              </div>
            </div>
          )) : (
             <div className="col-span-3 text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed">Belum ada pengumuman terbaru.</div>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Fitur Utama</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition cursor-pointer">
              <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                <MessageSquare size={32}/>
              </div>
              <h3 className="font-bold text-lg mb-2">Papan Informasi</h3>
              <p className="text-gray-600 text-sm">Akses pengumuman resmi akademik dan non-akademik secara real-time.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition cursor-pointer">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Calendar size={32}/>
              </div>
              <h3 className="font-bold text-lg mb-2">Manajemen Kalender</h3>
              <p className="text-gray-600 text-sm">Pantau jadwal kegiatan kampus dan simpan ke kalender pribadi Anda.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center hover:shadow-md transition">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
                <Users size={32}/>
              </div>
              <h3 className="font-bold text-lg mb-2">Diskusi Interaktif</h3>
              <p className="text-gray-600 text-sm">Berdiskusi melalui kolom komentar pada setiap pengumuman.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;