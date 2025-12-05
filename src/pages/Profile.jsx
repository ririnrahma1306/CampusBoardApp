import React, { useEffect, useState } from 'react';
import { User, Trash2, Camera, UploadCloud, Edit2, Save, X, AlertTriangle, LogOut } from 'lucide-react';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth'; 
import { db } from '../config/firebase';
import { ROLES } from '../utils/constants'; // Import ROLES untuk pengecekan
import Swal from 'sweetalert2';

const Profile = ({ user, userData, role }) => {
  const [myPosts, setMyPosts] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  // State Mode Edit
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      displayName: '',
      bio: ''
  });

  useEffect(() => {
      if (user) {
          setFormData({
              displayName: user.displayName || '',
              bio: userData?.bio || '' 
          });
      }
  }, [user, userData]);

  // 1. Ambil Pengumuman Saya
  useEffect(() => {
    if (!user || !db) return;
    
    const q = query(collection(db, 'pengumuman'), where('authorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Hapus Pengumuman
  const handleDelete = async (id) => {
    Swal.fire({
        title: 'Hapus pengumuman?',
        text: "Pengumuman ini akan dihapus permanen.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'pengumuman', id));
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                Toast.fire({ icon: 'success', title: 'Terhapus' });
            } catch (error) {
                console.error(error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus pengumuman.' });
            }
        }
    });
  };

  // 3. Update Foto Profil
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
        Swal.fire({
            icon: 'error',
            title: 'File Terlalu Besar',
            text: 'Ukuran foto maksimal 800KB.',
            confirmButtonColor: '#d33'
        });
        return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            const base64String = reader.result;
            await updateDoc(doc(db, 'users', user.uid), {
                photoBase64: base64String
            });
            Swal.fire({
                icon: 'success',
                title: 'Foto Diperbarui!',
                text: 'Foto profil Anda berhasil diubah.',
                confirmButtonColor: '#0d9488',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error updating profile pic:", error);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memperbarui foto profil.' });
        } finally {
            setUploading(false);
        }
    };
    reader.readAsDataURL(file);
  };

  // 4. Simpan Profil
  const handleSaveProfile = async () => {
      if (!user) return;
      
      try {
          if (formData.displayName !== user.displayName) {
              await updateProfile(user, { displayName: formData.displayName });
          }

          await updateDoc(doc(db, 'users', user.uid), {
              bio: formData.bio,
              nama_lengkap: formData.displayName 
          });

          Swal.fire({
            icon: 'success',
            title: 'Profil Disimpan!',
            text: 'Data diri Anda berhasil diperbarui.',
            confirmButtonColor: '#0d9488',
            timer: 2000,
            showConfirmButton: false
        });
          setIsEditing(false);
      } catch (error) {
          console.error("Error saving profile:", error);
          Swal.fire({ icon: 'error', title: 'Gagal', text: "Gagal menyimpan profil: " + error.message });
      }
  };

  // 5. FUNGSI HAPUS AKUN
  const handleDeleteAccount = async () => {
    Swal.fire({
        title: 'Konfirmasi Terakhir',
        text: "Semua data profil dan akses Anda akan hilang selamanya. Yakin ingin melanjutkan?",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'HAPUS AKUN SEKARANG',
        cancelButtonText: 'Batalkan'
    }).then(async (result2) => {
        if (result2.isConfirmed) {
            setUploading(true); 

            try {
                await deleteDoc(doc(db, 'users', user.uid));
                await deleteUser(user);
                
                Swal.fire({
                    icon: 'success',
                    title: 'Akun Dihapus',
                    text: 'Akun Anda telah berhasil dihapus.',
                    confirmButtonColor: '#0d9488'
                });
                // Biasanya aplikasi akan auto-redirect ke login karena auth state berubah
            } catch (error) {
                console.error("Gagal hapus akun:", error);
                setUploading(false);

                if (error.code === 'auth/requires-recent-login') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Login Ulang Diperlukan',
                        text: "Demi keamanan, sistem memerlukan login terbaru untuk menghapus akun. Silakan Logout, Login kembali, lalu coba hapus akun.",
                        confirmButtonColor: '#0d9488'
                    });
                } else {
                    Swal.fire({ icon: 'error', title: 'Gagal', text: "Gagal menghapus akun: " + error.message });
                }
            }
        }
    });
}

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      
      {/* Kartu Profil */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 relative">
        {/* Tombol Edit Floating */}
        <div className="absolute top-4 right-4 z-10">
            {!isEditing ? (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-white/90 backdrop-blur text-teal-700 px-4 py-2 rounded-full shadow-sm hover:bg-white transition flex items-center gap-2 font-semibold text-sm"
                >
                    <Edit2 size={16}/> Edit Profil
                </button>
            ) : (
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-full hover:bg-red-200 transition flex items-center gap-2 font-semibold text-sm"
                    >
                        <X size={16}/> Batal
                    </button>
                    <button 
                        onClick={handleSaveProfile}
                        className="bg-teal-600 text-white px-4 py-2 rounded-full hover:bg-teal-700 transition flex items-center gap-2 font-semibold text-sm shadow-md"
                    >
                        <Save size={16}/> Simpan
                    </button>
                </div>
            )}
        </div>

        {/* Header Background */}
        <div className="bg-teal-700 h-32 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative -top-12 mb-[-30px] flex justify-between items-end">
            
            {/* FOTO PROFIL */}
            <div className="relative group">
                <div className="w-28 h-28 bg-white rounded-full p-1 shadow-md">
                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-500 overflow-hidden relative border-2 border-gray-100">
                        {userData?.photoBase64 ? (
                            <img src={userData.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48}/>
                        )}
                        
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white z-10">
                                <UploadCloud className="animate-bounce" />
                            </div>
                        )}
                    </div>
                </div>

                <label className="absolute bottom-2 right-2 bg-teal-600 text-white p-2 rounded-full cursor-pointer hover:bg-teal-700 shadow-lg transition transform hover:scale-110 group-hover:opacity-100 z-20">
                    <Camera size={16} />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading}/>
                </label>
            </div>

            {/* Badge Role */}
            <div className="hidden md:block mb-12">
                 <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide shadow-sm ${role === 'admin' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    {role}
                </span>
            </div>
          </div>
          
          {/* Info User Form */}
          <div className="mt-6">
            {isEditing ? (
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap</label>
                        <input 
                            type="text" 
                            className="w-full border-b-2 border-teal-500 py-1 text-2xl font-bold text-gray-800 focus:outline-none bg-transparent"
                            value={formData.displayName}
                            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bio / Deskripsi Diri</label>
                        <textarea 
                            rows="3"
                            className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-500 outline-none text-sm text-gray-700"
                            placeholder="Tulis sesuatu tentang diri Anda..."
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        />
                    </div>
                </div>
            ) : (
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        {user.displayName}
                        <span className={`md:hidden px-2 py-0.5 rounded text-[10px] font-bold uppercase align-middle ${role === 'admin' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                            {role}
                        </span>
                    </h1>
                    <p className="text-gray-500">{user.email}</p>
                    
                    {userData?.bio && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 max-w-xl">
                            <p className="text-gray-700 text-sm italic">"{userData.bio}"</p>
                        </div>
                    )}

                    <p className="text-xs text-gray-400 mt-4">
                        Bergabung sejak: {userData?.createdAt?.toDate ? new Date(userData.createdAt.toDate()).toLocaleDateString('id-ID') : '-'}
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Riwayat Postingan */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 pl-2 border-l-4 border-teal-500">Riwayat Pengumuman Saya</h2>
      <div className="space-y-4 mb-12">
        {myPosts.length > 0 ? myPosts.map(post => (
            <div key={post.id} className="bg-white p-5 rounded-xl border shadow-sm flex justify-between items-center hover:shadow-md transition">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{post.title}</h3>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <span className={`font-bold px-2 py-0.5 rounded ${post.status === 'published' ? 'bg-green-100 text-green-700' : post.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {post.status.toUpperCase()}
                  </span> 
                  <span>• {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('id-ID') : ''}</span>
                  <span>• {post.category}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(post.id)} 
                className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition"
                title="Hapus Pengumuman"
              >
                <Trash2 size={20}/>
              </button>
            </div>
        )) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed text-gray-400">
                <p>Anda belum membuat pengumuman apapun.</p>
            </div>
        )}
      </div>

      {/* ZONA BAHAYA: HANYA UNTUK USER (BUKAN ADMIN) */}
      {role !== ROLES.ADMIN && (
          <div className="border-t border-red-100 pt-8 mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Pengaturan Akun</h3>
                <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h4 className="text-red-800 font-bold flex items-center gap-2">
                            <AlertTriangle size={20}/> Hapus Akun Permanen
                        </h4>
                        <p className="text-red-600 text-sm mt-1 max-w-lg">
                            Tindakan ini akan menghapus akun Anda beserta seluruh data profil secara permanen. Pengumuman yang pernah Anda buat mungkin masih tersisa kecuali dihapus manual.
                        </p>
                    </div>
                    <button 
                        onClick={handleDeleteAccount}
                        disabled={uploading}
                        className="bg-white text-red-600 border border-red-200 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-red-600 hover:text-white transition shadow-sm flex items-center gap-2 shrink-0 disabled:opacity-50"
                    >
                        <Trash2 size={16}/> {uploading ? 'Memproses...' : 'Hapus Akun Saya'}
                    </button>
                </div>
          </div>
      )}

    </div>
  );
};

export default Profile;