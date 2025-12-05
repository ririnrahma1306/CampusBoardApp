import React, { useState } from 'react';
import { Search, PlusCircle, User, FileText, Calendar, MapPin, Image, Video, UploadCloud, MessageCircle, ArrowLeft, Maximize2, Clock, Image as ImageIcon, ShieldCheck, Trash2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase'; 
import { CATEGORIES, ROLES } from '../utils/constants';
import Modal from '../components/Modal';
import CommentSection from '../components/CommentSection';
import Swal from 'sweetalert2';

// Helper: Format Link Youtube
const getEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

// Helper: Format Tanggal Indonesia
const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

const InfoBoard = ({ user, userData, role, announcements }) => {
  // --- STATE ---
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State Halaman Detail
  const [selectedPost, setSelectedPost] = useState(null);

  // State Form Baru
  const [newPost, setNewPost] = useState({ 
    title: '', category: 'Akademik', content: '', 
    startDate: '', endDate: '', 
    eventLocation: '', videoUrl: '', imageUrl: '' 
  });

  // --- HANDLERS & LOGIC ---
  const filteredData = announcements.filter(item => {
      const matchesStatus = item.status === 'published'; 
      const matchesCategory = filter === 'Semua' || item.category === filter;
      const matchesSearch = item.title?.toLowerCase().includes(search.toLowerCase()) || item.content?.toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setNewPost(prev => ({ ...prev, imageUrl: '' }));
    if (file) {
      if (file.size > 800 * 1024) { // Limit 800KB for Base64 performance
        Swal.fire({
            icon: 'error',
            title: 'File Terlalu Besar',
            text: 'Ukuran gambar maksimal 800KB.',
            confirmButtonColor: '#0d9488'
        });
        e.target.value = null;
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setNewPost(prev => ({ ...prev, imageUrl: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!db) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Database belum terhubung.' });
        return;
      }
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      if (newPost.startDate && newPost.startDate < todayStr) {
        Swal.fire({ 
          icon: 'warning', 
          title: 'Tanggal Tidak Valid', 
          text: 'Tanggal mulai tidak boleh lewat (masa lalu). Harap pilih hari ini atau tanggal mendatang.',
          confirmButtonColor: '#f59e0b' // Warna Orange
        });
        return;
    }

      if (newPost.startDate && newPost.endDate && newPost.endDate < newPost.startDate) {
        Swal.fire({ 
            icon: 'warning', 
            title: 'Tanggal Tidak Valid', 
            text: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.',
            confirmButtonColor: '#f59e0b'
          });
          return;
      }
      setLoading(true);

      try {
        const initialStatus = role === ROLES.ADMIN ? 'published' : 'pending';
        
        // Pastikan nama penulis ada
        const authorName = user.displayName || 'Mahasiswa';

        const docRef = await addDoc(collection(db, 'pengumuman'), {
          ...newPost,
          authorId: user.uid,
          authorName: authorName,
          authorRole: role,
          status: initialStatus,
          createdAt: serverTimestamp(),
        });

        if (role === ROLES.ADMIN && newPost.startDate) {
            await addDoc(collection(db, 'acara'), {
                title: newPost.title,
                date: newPost.startDate, 
                endDate: newPost.endDate, 
                location: newPost.eventLocation || 'Kampus',
                desc: newPost.content,
                fromAnnouncementId: docRef.id,
                createdAt: serverTimestamp()
            });
        }

        await Swal.fire({
            icon: role === ROLES.ADMIN ? 'success' : 'info',
            title: role === ROLES.ADMIN ? 'Berhasil!' : 'Terkirim!',
            text: role === ROLES.ADMIN 
                ? "Pengumuman berhasil diterbitkan!" 
                : "Pengumuman dikirim! Menunggu persetujuan Admin.",
            confirmButtonColor: '#0d9488', // Warna Teal
            timer: 3000,
            timerProgressBar: true
        });
        setIsCreateModalOpen(false);
        setNewPost({ title: '', category: 'Akademik', content: '', startDate: '', endDate: '', eventLocation: '', videoUrl: '', imageUrl: '' });
      } catch (error) {
        console.error("Error submit:", error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal Mengirim',
            text: error.message,
            confirmButtonColor: '#d33'
        });
      } finally {
        setLoading(false);
      }
  };

  // FUNGSI HAPUS KHUSUS ADMIN
  const handleDeletePost = async (id) => {
    Swal.fire({
        title: 'Hapus Pengumuman?',
        text: "Data yang dihapus tidak dapat dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'pengumuman', id));
                
                Swal.fire({
                  icon: 'success',
                  title: 'Terhapus!',
                  text: 'Pengumuman berhasil dihapus.',
                  confirmButtonColor: '#0d9488',
                  timer: 1500,
                  showConfirmButton: false
                });

                setSelectedPost(null); // Kembali ke daftar setelah dihapus
            } catch (error) {
                console.error(error);
                Swal.fire({
                  icon: 'error',
                  title: 'Gagal',
                  text: 'Terjadi kesalahan saat menghapus.',
                });
            }
        }
    });
};

  // ========================================================================
  // TAMPILAN 1: HALAMAN DETAIL (LAYOUT UI SEPERTI REFERENSI)
  // ========================================================================
  if (selectedPost) {
      return (
          <div className="min-h-screen bg-white animate-fade-in pb-20">
              {/* Header Navigasi */}
              <div className="border-b border-gray-100 sticky top-16 bg-white/90 backdrop-blur-md z-20">
                  <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                      <button 
                        onClick={() => setSelectedPost(null)} 
                        className="flex items-center gap-2 text-gray-500 font-medium hover:text-teal-600 transition"
                      >
                          <ArrowLeft size={18} /> Kembali ke Papan Informasi
                      </button>

                      {/* TOMBOL HAPUS (HANYA UNTUK ADMIN) */}
                      {role === ROLES.ADMIN && (
                          <button 
                            onClick={() => handleDeletePost(selectedPost.id)}
                            className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition text-sm border border-red-200"
                          >
                              <Trash2 size={16} /> Hapus Pengumuman
                          </button>
                      )}
                  </div>
              </div>

              <div className="max-w-6xl mx-auto px-4 mt-10">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                      
                      {/* KOLOM KIRI: KONTEN UTAMA (Lebar 8/12) */}
                      <div className="lg:col-span-8">
                          
                          {/* 1. JUDUL BESAR */}
                          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                              {selectedPost.title}
                          </h1>

                          {/* 2. META DATA: Kategori, Tanggal, Penulis */}
                          <div className="flex flex-wrap items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                               <span className="bg-teal-600 text-white text-sm font-bold px-4 py-1.5 rounded-md uppercase tracking-wide">
                                    {selectedPost.category}
                               </span>
                               <span className="text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 border border-gray-100">
                                    <Clock size={16} className="text-teal-600"/>
                                    {selectedPost.createdAt?.toDate ? formatDate(selectedPost.createdAt.toDate()) : 'Baru saja'}
                               </span>
                               
                               {/* TAMPILAN PENULIS DI DETAIL */}
                               <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                                   <User size={16} className="text-teal-600"/>
                                   <span className="text-gray-400">Oleh:</span>
                                   <span className="text-gray-900 font-bold flex items-center gap-1">
                                        {selectedPost.authorName || 'User'}
                                        {/* BADGE ADMIN JIKA ROLE = ADMIN */}
                                        {selectedPost.authorRole === ROLES.ADMIN && (
                                            <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm ml-1" title="Terverifikasi Admin">
                                                <ShieldCheck size={10} /> Admin
                                            </span>
                                        )}
                                   </span>
                               </div>
                          </div>

                          {/* 3. ISI KONTEN TEKS */}
                          <div className="prose prose-lg max-w-none text-gray-700 leading-loose whitespace-pre-wrap font-sans text-justify mb-10">
                              {selectedPost.content}
                          </div>

                          {/* Detail Acara (Jika Ada) */}
                          {(selectedPost.startDate || selectedPost.eventLocation) && (
                              <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500 mb-8">
                                  <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                                      <Calendar className="text-blue-600"/> Detail Pelaksanaan
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                      {selectedPost.startDate && (
                                          <div>
                                              <span className="block font-bold text-gray-500 text-xs uppercase mb-1">Waktu</span>
                                              <span className="font-medium text-base text-gray-800">
                                                  {formatDate(selectedPost.startDate)} 
                                                  {selectedPost.endDate ? ` - ${formatDate(selectedPost.endDate)}` : ''}
                                              </span>
                                          </div>
                                      )}
                                      {selectedPost.eventLocation && (
                                          <div>
                                              <span className="block font-bold text-gray-500 text-xs uppercase mb-1">Tempat</span>
                                              <span className="font-medium text-base text-gray-800 flex items-start gap-1">
                                                <MapPin size={18} className="text-red-500 mt-0.5 shrink-0"/> 
                                                {selectedPost.eventLocation}
                                              </span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )}

                          {/* Video (Jika Ada) */}
                          {selectedPost.videoUrl && getEmbedUrl(selectedPost.videoUrl) && (
                              <div className="mb-10">
                                  <div className="rounded-xl overflow-hidden shadow-lg bg-black aspect-video">
                                      <iframe className="w-full h-full" src={getEmbedUrl(selectedPost.videoUrl)} title="Video" frameBorder="0" allowFullScreen></iframe>
                                  </div>
                              </div>
                          )}

                      </div>

                      {/* KOLOM KANAN: GAMBAR ILUSTRASI (Lebar 4/12) */}
                      <div className="lg:col-span-4">
                          {selectedPost.imageUrl ? (
                              <div className="sticky top-24">
                                  <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-white p-2 transform hover:scale-[1.02] transition duration-500">
                                      <img 
                                        src={selectedPost.imageUrl} 
                                        alt={selectedPost.title} 
                                        className="w-full h-auto object-cover rounded-lg" 
                                      />
                                  </div>
                                  <p className="text-center text-xs text-gray-400 mt-3 italic">Dokumentasi Kegiatan</p>
                              </div>
                          ) : (
                              // Placeholder Ilustrasi agar layout tetap seimbang
                              <div className="sticky top-24 h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                                  <ImageIcon size={48} className="opacity-20 mb-2"/>
                                  <span className="text-xs uppercase tracking-wide">Tidak ada ilustrasi</span>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* SECTION KOMENTAR (Full Width di Bawah) */}
                  <div className="mt-16 border-t border-gray-200 pt-10">
                      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                          <MessageCircle className="text-teal-600" size={28}/> Diskusi
                      </h3>
                      <div className="bg-gray-50 rounded-2xl p-6 md:p-10 border border-gray-100">
                          <CommentSection announcementId={selectedPost.id} user={user} userData={userData} role={role} />
                      </div>
                  </div>

              </div>
          </div>
      );
  }

  // ========================================================================
  // TAMPILAN 2: DAFTAR GRID (DEFAULT)
  // ========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header & Button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
              <h1 className="text-3xl font-bold text-gray-800">Papan Informasi</h1>
              <p className="text-gray-500">Temukan informasi terbaru seputar kampus</p>
          </div>
          {user && (
              <button 
                  onClick={() => setIsCreateModalOpen(true)} 
                  className="bg-teal-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-teal-700 transition shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                  <PlusCircle size={20}/> Buat Pengumuman
              </button>
          )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20}/>
              <input 
                  type="text" placeholder="Cari pengumuman..." className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none bg-gray-50 focus:bg-white transition"
                  value={search} onChange={(e) => setSearch(e.target.value)}
              />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar items-center">
              <button onClick={() => setFilter('Semua')} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${filter === 'Semua' ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Semua</button>
              {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setFilter(cat)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${filter === cat ? 'bg-teal-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
              ))}
          </div>
      </div>

      {/* Grid Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredData.length > 0 ? filteredData.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedPost(item)} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer group"
              >
                  {item.imageUrl ? (
                    <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur text-teal-800 text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  ) : (
                    <div className="h-2 bg-teal-600 w-full"></div>
                  )}

                  <div className="p-6 flex-grow flex flex-col">
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-xs text-gray-400 font-semibold tracking-wide flex items-center gap-1">
                            <Clock size={12}/> {item.createdAt?.toDate ? formatDate(item.createdAt.toDate()) : 'Baru saja'}
                          </span>
                          {!item.imageUrl && (
                             <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-100">
                                {item.category}
                             </span>
                          )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-800 mb-3 leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                        {item.content}
                      </p>

                      <div className="pt-4 border-t border-gray-50 flex justify-between items-center mt-auto">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                             {/* TAMPILAN PENULIS (GRID) */}
                             <User size={14}/> 
                             <span className="font-medium truncate max-w-[120px] flex items-center gap-1">
                                {item.authorName || 'User'}
                                {/* Badge Admin di Grid */}
                                {item.authorRole === ROLES.ADMIN && (
                                    <ShieldCheck size={12} className="text-blue-600 fill-blue-100" />
                                )}
                             </span>
                          </div>
                          <div className="flex gap-3 text-gray-400">
                              {item.videoUrl && <Video size={16} className="text-red-400"/>}
                              <MessageCircle size={16} className="text-blue-400"/>
                          </div>
                      </div>
                  </div>
              </div>
          )) : (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300"/>
                  <p className="text-gray-500 font-medium">Tidak ada pengumuman ditemukan.</p>
              </div>
          )}
      </div>

      {/* Modal Form Create */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Buat Pengumuman Baru">
          {/* Wrapper Scrollable dengan max-height agar pas di layar kecil */}
          <div className="max-h-[75vh] overflow-y-auto custom-scrollbar pr-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Judul & Kategori */}
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Judul Pengumuman <span className="text-red-500">*</span></label>
                          <input required type="text" placeholder="Contoh: Seminar Nasional AI..." className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} 
                          onInvalid={(e) => e.target.setCustomValidity('Mohon isi judul pengumuman terlebih dahulu!')}
                          onInput={(e) => e.target.setCustomValidity('')}/>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                            <select className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 bg-white" value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Lokasi (Opsional)</label>
                            <input type="text" placeholder="Gedung/Ruangan" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={newPost.eventLocation} onChange={e => setNewPost({...newPost, eventLocation: e.target.value})} />
                          </div>
                      </div>
                  </div>

                  {/* Section Media (Dikelompokkan biar rapi) */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 space-y-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lampiran Media</h4>
                      
                      {/* Custom File Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Gambar (Maks 800KB)</label>
                        <div className="flex items-center gap-3">
                            <label className="cursor-pointer bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition flex items-center gap-2 text-sm font-medium shadow-sm">
                                <Image size={18}/> Pilih File
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden"/>
                            </label>
                            <span className="text-xs text-gray-400 italic">{newPost.imageUrl ? "File terpilih (Siap upload)" : "Belum ada file dipilih"}</span>
                        </div>
                        {newPost.imageUrl && <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1">✓ Gambar berhasil dimuat!</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link Video (YouTube)</label>
                        <div className="relative">
                            <Video size={18} className="absolute left-3 top-3.5 text-gray-400"/>
                            <input type="url" placeholder="https://youtube.com/watch?v=..." className="w-full pl-10 border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white" value={newPost.videoUrl} onChange={e => setNewPost({...newPost, videoUrl: e.target.value})} />
                        </div>
                      </div>
                  </div>

                  {/* Tanggal Pelaksanaan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mulai Tanggal</label>
                        <input type="date" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={newPost.startDate} onChange={e => setNewPost({...newPost, startDate: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Sampai Tanggal</label>
                        <input type="date" className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={newPost.endDate} onChange={e => setNewPost({...newPost, endDate: e.target.value})} />
                    </div>
                  </div>

                  {/* Isi Pengumuman */}
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Isi Pengumuman <span className="text-red-500">*</span></label>
                      <textarea required rows="5" placeholder="Tulis detail pengumuman di sini..." className="w-full border border-gray-300 p-3 rounded-xl outline-none focus:ring-2 focus:ring-teal-500" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})}
                      onInvalid={(e) => e.target.setCustomValidity('Deskripsi pengumuman tidak boleh kosong ya.')}
        onInput={(e) => e.target.setCustomValidity('')}></textarea>
                  </div>

                  {/* Tombol Submit */}
                  <div className="pt-2 sticky bottom-0 bg-white pb-2 border-t border-gray-100">
                      <button disabled={loading} type="submit" className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold hover:bg-teal-700 disabled:bg-gray-400 flex items-center justify-center gap-2 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                          {loading ? <><UploadCloud className="animate-bounce" size={20}/> Memproses...</> : (role === ROLES.ADMIN ? 'Terbitkan Sekarang' : 'Kirim untuk Ditinjau')}
                      </button>
                  </div>
              </form>
          </div>
      </Modal>
    </div>
  );
};

export default InfoBoard;