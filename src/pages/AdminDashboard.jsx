import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, Calendar, MapPin, Video, Image as ImageIcon, Flag, FileText } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES } from '../utils/constants';
import Swal from 'sweetalert2';

const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminDashboard = ({ user, role, initialTab }) => {
  const [tab, setTab] = useState(initialTab || 'pending'); 
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [reportedComments, setReportedComments] = useState([]); 
  
  const [newEvent, setNewEvent] = useState({ title: '', date: '', location: '', desc: '' });

  useEffect(() => {
      if (initialTab) {
          setTab(initialTab);
      }
  }, [initialTab]);

  useEffect(() => {
    if (!db || role !== ROLES.ADMIN) return;
    
    const qAnnounce = query(collection(db, 'pengumuman'), orderBy('createdAt', 'desc')); 
    const unsubA = onSnapshot(qAnnounce, (snap) => setAnnouncements(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    const qEvent = query(collection(db, 'acara'), orderBy('date', 'asc'));
    const unsubE = onSnapshot(qEvent, (snap) => setEvents(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    
    const qReports = query(collection(db, 'komentar'), where('isReported', '==', true));
    const unsubR = onSnapshot(qReports, (snap) => setReportedComments(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubA(); unsubE(); unsubR(); };
  }, [role]);

  // --- EVENT HANDLERS ---

  const handleAddEvent = async (e) => {
      e.preventDefault();
      if(!db) return;
      await addDoc(collection(db, 'acara'), { 
          ...newEvent, 
          authorId: user.uid, 
          authorName: user.displayName, 
          createdAt: serverTimestamp() 
      });
      setNewEvent({ title: '', date: '', location: '', desc: '' });
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Acara berhasil ditambahkan ke kalender.',
        confirmButtonColor: '#0d9488',
        timer: 2000,
        showConfirmButton: false
    });
  };

  const handleApprove = async (post) => {
      if(!db) return;
      try {
        await updateDoc(doc(db, 'pengumuman', post.id), { 
            status: 'published',
            approvedBy: user.displayName,
            approvedAt: serverTimestamp()
        });

        let successMsg = "Pengumuman berhasil disetujui.";
        
        if (post.startDate) {
            await addDoc(collection(db, 'acara'), {
                title: post.title,
                date: post.startDate,
                endDate: post.endDate,
                location: post.eventLocation || 'Kampus',
                desc: post.content,
                fromAnnouncementId: post.id,
                createdAt: serverTimestamp()
            });
            successMsg = "Pengumuman disetujui & Acara otomatis ditambahkan ke Kalender!";
        }
        
        // SUKSES APPROVE
        Swal.fire({
            icon: 'success',
            title: 'Diterbitkan!',
            text: successMsg,
            confirmButtonColor: '#0d9488',
            timer: 2500
        });

      } catch (error) {
          console.error("Error approving:", error);
          Swal.fire({ icon: 'error', title: 'Gagal', text: "Gagal memproses persetujuan." });
      }
  };
  
  const handleReject = async (id) => {
    Swal.fire({
      title: 'Tolak Pengumuman?',
      text: "Pengumuman ini akan ditandai sebagai ditolak.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal'
  }).then(async (result) => {
      if (result.isConfirmed) {
        try {
            await updateDoc(doc(db, 'pengumuman', id), { status: 'rejected' });
            Swal.fire({
                icon: 'success',
                title: 'Ditolak',
                text: 'Pengumuman telah ditolak.',
                confirmButtonColor: '#0d9488',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menolak pengumuman.' });
        }
      }
  });
};

  const handleDelete = async (coll, id) => {
    Swal.fire({
      title: 'Hapus Data?',
      text: "Data ini akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
  }).then(async (result) => {
      if (result.isConfirmed) {
         try {
             await deleteDoc(doc(db, coll, id));
             Swal.fire({
                icon: 'success',
                title: 'Terhapus',
                showConfirmButton: false,
                timer: 1500
             });
         } catch (error) {
             Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus data.' });
         }
      }
  });
};

  const handleDeleteComment = async (id) => {
    Swal.fire({
      title: 'Hapus Komentar?',
      text: "Komentar ini akan dihapus permanen.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
  }).then(async (result) => {
      if (result.isConfirmed) {
          await deleteDoc(doc(db, 'komentar', id));
          Swal.fire({ icon: 'success', title: 'Komentar Dihapus', showConfirmButton: false, timer: 1500 });
      }
  });
};

  const handleIgnoreReport = async (id) => {
    Swal.fire({
      title: 'Abaikan Laporan?',
      text: "Status laporan akan dihapus, komentar tetap ada.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488', // Teal (Aman)
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Abaikan',
      cancelButtonText: 'Batal'
  }).then(async (result) => {
      if (result.isConfirmed) {
          await updateDoc(doc(db, 'komentar', id), { isReported: false, reports: [] });
          Swal.fire({ icon: 'success', title: 'Laporan Diabaikan', showConfirmButton: false, timer: 1500 });
      }
  });
};

  if (role !== ROLES.ADMIN) return <div className="text-center mt-10 text-red-500 font-bold">Akses Ditolak.</div>;

  // Filter Data
  const pendingPosts = announcements.filter(a => a.status === 'pending');
  const publishedPosts = announcements.filter(a => a.status === 'published'); // DATA BARU

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Admin</h1>
      
      <div className="flex space-x-4 border-b mb-6 overflow-x-auto">
        <button onClick={() => setTab('pending')} className={`pb-2 px-4 font-medium whitespace-nowrap transition ${tab === 'pending' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-teal-500'}`}>
          Persetujuan <span className="bg-orange-100 text-orange-600 px-2 rounded-full text-xs ml-1">{pendingPosts.length}</span>
        </button>
        
        {/* TAB BARU: DITERBITKAN */}
        <button onClick={() => setTab('published')} className={`pb-2 px-4 font-medium whitespace-nowrap transition ${tab === 'published' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-teal-500'}`}>
          Diterbitkan <span className="bg-green-100 text-green-600 px-2 rounded-full text-xs ml-1">{publishedPosts.length}</span>
        </button>

        <button onClick={() => setTab('moderation')} className={`pb-2 px-4 font-medium whitespace-nowrap transition ${tab === 'moderation' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-teal-500'}`}>
          Moderasi <span className="bg-red-100 text-red-600 px-2 rounded-full text-xs ml-1">{reportedComments.length}</span>
        </button>
        <button onClick={() => setTab('events')} className={`pb-2 px-4 font-medium whitespace-nowrap transition ${tab === 'events' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:text-teal-500'}`}>
          Manajemen Acara
        </button>
      </div>

      {/* TAB 1: Persetujuan */}
      {tab === 'pending' && (
        <div className="space-y-6">
          {pendingPosts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed text-gray-400"><CheckCircle size={48} className="mx-auto mb-2 opacity-50"/><p>Tidak ada pengumuman baru.</p></div>
          ) : (
            pendingPosts.map(post => (
            <div key={post.id} className="bg-white p-6 rounded-xl shadow-md border border-orange-200 transition hover:shadow-lg">
               {/* ... (Isi sama seperti sebelumnya) ... */}
               <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-grow">
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded inline-block mb-2">Menunggu</span>
                  <h3 className="font-bold text-xl text-gray-800">{post.title}</h3>
                  <p className="text-gray-600 mt-2 text-sm line-clamp-2">{post.content}</p>
                  <div className="text-xs text-gray-400 mt-2">Diajukan: <b>{post.authorName}</b> • {post.category}</div>
                </div>
                <div className="flex flex-row md:flex-col gap-3 shrink-0 justify-center md:border-l md:pl-6">
                  <button onClick={() => handleApprove(post)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-2 shadow-sm"><CheckCircle size={16}/> Setujui</button>
                  <button onClick={() => handleReject(post.id)} className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm hover:bg-red-50 flex items-center justify-center gap-2 shadow-sm"><XCircle size={16}/> Tolak</button>
                </div>
               </div>
            </div>
          )))}
        </div>
      )}

      {/* TAB BARU: DITERBITKAN (Manajemen Postingan Aktif) */}
      {tab === 'published' && (
        <div className="space-y-4">
           {publishedPosts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed text-gray-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-50"/>
                    <p>Belum ada pengumuman yang diterbitkan.</p>
                </div>
           ) : (
               publishedPosts.map(post => (
                   <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4 items-center hover:shadow-md transition">
                       
                       {/* Thumbnail Kecil */}
                       <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 overflow-hidden border">
                            {post.imageUrl ? <img src={post.imageUrl} className="w-full h-full object-cover"/> : <ImageIcon className="m-auto mt-4 text-gray-400" size={24}/>}
                       </div>

                       <div className="flex-grow min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                               <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Published</span>
                               <span className="text-xs text-gray-400">{formatDate(post.createdAt?.toDate())}</span>
                           </div>
                           <h4 className="font-bold text-gray-800 truncate">{post.title}</h4>
                           <p className="text-xs text-gray-500">Penulis: {post.authorName}</p>
                       </div>

                       <div className="flex gap-2 shrink-0">
                           {/* Tombol Hapus untuk Admin */}
                           <button 
                                onClick={() => handleDelete('pengumuman', post.id)}
                                className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition flex items-center gap-2 text-sm font-bold"
                           >
                               <Trash2 size={16}/> Hapus
                           </button>
                       </div>
                   </div>
               ))
           )}
        </div>
      )}

      {/* ... (Tab Moderasi, Events, All sama seperti sebelumnya, tidak perlu diubah) ... */}
      
      {tab === 'moderation' && (
        <div className="space-y-4">
           {reportedComments.map(comment => (
               <div key={comment.id} className="bg-white p-4 rounded-xl shadow-sm border border-red-200 flex justify-between gap-4">
                   <div>
                       <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{comment.reports?.length} Laporan</span>
                       <p className="text-gray-800 text-sm italic">"{comment.text}"</p>
                       <p className="text-xs text-gray-500 mt-1">Oleh: {comment.userName}</p>
                   </div>
                   <div className="flex gap-2">
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-red-600 bg-red-50 p-2 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                        <button onClick={() => handleIgnoreReport(comment.id)} className="text-gray-600 bg-gray-100 p-2 rounded hover:bg-gray-200"><CheckCircle size={16}/></button>
                   </div>
               </div>
           ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Calendar className="text-teal-600"/> Tambah Acara Manual</h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <input required placeholder="Nama Acara" className="w-full border p-2 rounded" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" className="w-full border p-2 rounded" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                <input required placeholder="Lokasi" className="w-full border p-2 rounded" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
              </div>
              <textarea required placeholder="Deskripsi" className="w-full border p-2 rounded" rows="3" value={newEvent.desc} onChange={e => setNewEvent({...newEvent, desc: e.target.value})} />
              <button className="w-full bg-teal-600 text-white py-2.5 rounded-lg font-bold">Simpan</button>
            </form>
          </div>
          <div className="space-y-4">
            {events.map(ev => (
              <div key={ev.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-800">{ev.title}</div>
                  <div className="text-sm text-gray-500">{formatDate(ev.date)} • {ev.location}</div>
                </div>
                <button onClick={() => handleDelete('acara', ev.id)} className="text-red-500 bg-red-50 p-2 rounded hover:bg-red-100"><Trash2 size={18}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;