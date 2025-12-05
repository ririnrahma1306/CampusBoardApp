import React, { useState, useEffect } from 'react';
import { Send, Trash2, Edit2, Flag, ShieldCheck } from 'lucide-react'; 
import { 
    collection, addDoc, query, where, onSnapshot, 
    deleteDoc, doc, updateDoc, serverTimestamp, arrayUnion 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ROLES } from '../utils/constants';
import Swal from 'sweetalert2';

const CommentSection = ({ announcementId, user, userData, role }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. READ: Ambil komentar secara real-time
    useEffect(() => {
        if (!db) return;
        
        // Query hanya berdasarkan announcementId. . . .
        const q = query(
            collection(db, 'komentar'), 
            where('announcementId', '==', announcementId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sorting Manual (karena kita tidak pakai orderBy di query untuk menghindari index error)
            data.sort((a, b) => {
                const timeA = a.createdAt?.seconds || 0;
                const timeB = b.createdAt?.seconds || 0;
                return timeA - timeB;
            });

            setComments(data);
        });

        return () => unsubscribe();
    }, [announcementId]);

    // 2. CREATE: Tambah Komentar
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);

        try {
            await addDoc(collection(db, 'komentar'), {
                announcementId,
                userId: user.uid,
                userName: user.displayName || 'User',
                // Simpan Role dan Foto saat komentar dibuat
                userRole: role || 'user',
                userPhoto: userData?.photoBase64 || null, 
                text: newComment,
                createdAt: serverTimestamp(),
                reports: [],
                isReported: false
            });
            setNewComment('');
        } catch (error) {
            console.error("Error sending comment:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: "Gagal mengirim komentar: " + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // 3. DELETE: Hapus Komentar Sendiri
    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Hapus komentar?',
            text: "Komentar akan dihapus permanen.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33', // Merah
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, 'komentar', id));
                    // Opsional: Toast sukses kecil
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000
                    });
                    Toast.fire({ icon: 'success', title: 'Komentar dihapus' });
                } catch (error) {
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menghapus komentar.' });
                }
            }
        });
    };

    // 4. UPDATE: Edit Komentar Sendiri
    const startEdit = (comment) => {
        setEditingId(comment.id);
        setEditText(comment.text);
    };

    const saveEdit = async (id) => {
        try {
            await updateDoc(doc(db, 'komentar', id), { text: editText });
            setEditingId(null);
            const Toast = Swal.mixin({
                toast: true, position: 'top-end', showConfirmButton: false, timer: 2000
            });
            Toast.fire({ icon: 'success', title: 'Komentar diperbarui' });

        } catch (error) {
            console.error("Gagal update", error);
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal mengedit komentar.' });
        }
    };

    // 5. REPORT: Laporkan Komentar
    const handleReport = async (commentId, currentReports) => {
        if (currentReports && currentReports.includes(user.uid)) {
            Swal.fire({
                icon: 'info',
                title: 'Sudah Dilaporkan',
                text: "Anda sudah melaporkan komentar ini sebelumnya.",
                confirmButtonColor: '#0d9488'
            });
            return;
        }

        // Konfirmasi Lapor
        Swal.fire({
            title: 'Laporkan Komentar?',
            text: "Komentar ini akan ditinjau oleh Admin.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b', // Orange (Warning/Report)
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Laporkan',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await updateDoc(doc(db, 'komentar', commentId), {
                        reports: arrayUnion(user.uid),
                        isReported: true
                    });
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Terkirim',
                        text: "Laporan Anda telah dikirim ke Admin.",
                        confirmButtonColor: '#0d9488',
                        timer: 2000
                    });
                } catch (error) {
                    console.error(error);
                    Swal.fire({ icon: 'error', title: 'Error', text: "Gagal mengirim laporan." });
                }
            }
        });
    };

    return (
        <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-lg animate-fade-in">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                Diskusi ({comments.length})
            </h4>

            {/* List Komentar */}
            <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 && <p className="text-xs text-gray-400 italic text-center">Belum ada komentar. Jadilah yang pertama!</p>}
                
                {comments.map(comment => (
                    <div key={comment.id} className={`flex gap-3 text-sm group ${comment.userRole === ROLES.ADMIN ? 'pl-2 border-l-2 border-blue-500' : ''}`}>
                        
                        {/* FOTO PROFIL DI KOMENTAR */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border overflow-hidden ${comment.userRole === ROLES.ADMIN ? 'bg-blue-600 text-white border-blue-600' : 'bg-teal-100 text-teal-700 border-teal-200'}`}>
                            {comment.userPhoto ? (
                                <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                            ) : (
                                (comment.userName || 'U').charAt(0)
                            )}
                        </div>

                        <div className="flex-grow">
                            <div className={`p-3 rounded-lg rounded-tl-none shadow-sm border relative ${comment.userRole === ROLES.ADMIN ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-xs ${comment.userRole === ROLES.ADMIN ? 'text-blue-800' : 'text-gray-800'}`}>{comment.userName}</span>
                                        
                                        {/* BADGE ADMIN */}
                                        {comment.userRole === ROLES.ADMIN && (
                                            <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
                                                <ShieldCheck size={10} /> Admin
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400">
                                        {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleDateString() : 'Baru saja'}
                                    </span>
                                </div>
                                
                                {editingId === comment.id ? (
                                    <div className="flex gap-2 flex-col sm:flex-row">
                                        <input 
                                            className="flex-grow border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-teal-500 outline-none"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => saveEdit(comment.id)} className="text-white bg-green-500 px-2 py-1 rounded text-xs hover:bg-green-600">Simpan</button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-600 bg-gray-200 px-2 py-1 rounded text-xs hover:bg-gray-300">Batal</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-600 break-words">{comment.text}</p>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-1 text-[10px] text-gray-400 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {user && user.uid === comment.userId ? (
                                    <>
                                        <button onClick={() => startEdit(comment)} className="hover:text-blue-600 flex items-center gap-1"><Edit2 size={10}/> Edit</button>
                                        <button onClick={() => handleDelete(comment.id)} className="hover:text-red-600 flex items-center gap-1"><Trash2 size={10}/> Hapus</button>
                                    </>
                                ) : user ? (
                                    <button 
                                        onClick={() => handleReport(comment.id, comment.reports)} 
                                        className={`flex items-center gap-1 hover:text-orange-600 ${comment.reports?.includes(user.uid) ? 'text-orange-500 font-bold' : ''}`}
                                        disabled={comment.reports?.includes(user.uid)}
                                    >
                                        <Flag size={10}/> {comment.reports?.includes(user.uid) ? 'Dilaporkan' : 'Laporkan'}
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Input */}
            {user ? (
                <form onSubmit={handleSend} className="flex gap-2 mt-2">
                    {/* Tampilkan foto user yang sedang mengetik (opsional) */}
                    {userData?.photoBase64 && (
                        <img src={userData.photoBase64} className="w-8 h-8 rounded-full object-cover border border-gray-200" alt="My" />
                    )}
                    
                    <input 
                        type="text" 
                        placeholder={role === ROLES.ADMIN ? "Tulis komentar resmi sebagai Admin..." : "Tulis komentar..."} 
                        className={`flex-grow border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 ${role === ROLES.ADMIN ? 'focus:border-blue-500 focus:ring-blue-500 bg-blue-50/50' : 'focus:border-teal-500 focus:ring-teal-500'}`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        disabled={loading || !newComment.trim()}
                        className={`${role === ROLES.ADMIN ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'} text-white p-2 rounded-full disabled:bg-gray-300 transition shadow-sm`}
                    >
                        <Send size={18} />
                    </button>
                </form>
            ) : (
                <p className="text-xs text-center text-gray-500 bg-gray-100 p-2 rounded">Login untuk berdiskusi</p>
            )}
        </div>
    );
};

export default CommentSection;