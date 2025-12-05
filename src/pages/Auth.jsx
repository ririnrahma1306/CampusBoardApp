import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

const Auth = ({ setCurrentView }) => {
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!auth) {
        setError("Fitur Database non-aktif.");
        setLoading(false);
        return;
    }

    try {
      auth.languageCode = 'id'; // Email Bahasa Indonesia

      if (authMode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const newUser = userCredential.user;
        await updateProfile(newUser, { displayName: formData.name });
        
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          nama_lengkap: formData.name,
          email: formData.email,
          role: 'user', 
          createdAt: serverTimestamp()
        });
        await Swal.fire({
          icon: 'success',
          title: 'Registrasi Berhasil!',
          text: 'Akun Anda telah dibuat. Silakan login.',
          confirmButtonColor: '#0d9488', // Warna Teal
          confirmButtonText: 'Oke, Siap!'
        });
        setCurrentView('home');

      } else if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        Toast.fire({
          icon: 'success',
          title: 'Login berhasil'
        });
        setCurrentView('home');

      } else if (authMode === 'reset') {
        // --- LOGIKA LINK RESET ---
        const actionCodeSettings = {
            url: window.location.origin, 
            handleCodeInApp: true,
        };

        await sendPasswordResetEmail(auth, formData.email, actionCodeSettings);
        
        Swal.fire({
          icon: 'success',
          title: 'Link Terkirim',
          text: `Link reset password telah dikirim ke ${formData.email}. Cek Inbox atau Spam.`,
          confirmButtonColor: '#0d9488'
        });
        setLoading(false); 
        return; 
      }

    } catch (err) {
      console.error(err);
      // Translate Error
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = "Email atau kata sandi salah.";
      }
      else if (err.code === 'auth/invalid-email') msg = "Format email tidak valid.";
      else if (err.code === 'auth/email-already-in-use') msg = "Email sudah terdaftar. Silakan login.";
      else if (err.code === 'auth/weak-password') msg = "Password terlalu lemah (minimal 8 karakter).";
      else if (err.code === 'auth/too-many-requests') msg = "Terlalu banyak percobaan gagal. Coba lagi nanti.";
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: msg,
        confirmButtonColor: '#d33'
      });
      
    } finally {
      if (authMode !== 'reset') setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 relative">
        
        {authMode === 'reset' && (
            <button 
                onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }} 
                className="absolute top-4 left-4 text-gray-400 hover:text-teal-600 transition"
                title="Kembali ke Login"
            >
                <ArrowLeft size={24} />
            </button>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-teal-700">
            {authMode === 'login' ? 'Login' : authMode === 'register' ? 'Daftar Akun' : 'Lupa Password?'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {authMode === 'login' ? 'Masuk untuk mengakses CampusBoard' : 
             authMode === 'register' ? 'Bergabung dengan komunitas kampus' : 
             'Masukkan email untuk mendapatkan link reset'}
          </p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200 flex items-center gap-2">⚠️ {error}</div>}
        {successMsg && <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm border border-green-200 flex items-center gap-2">✅ {successMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {authMode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Nama Anda" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              onInvalid={(e) => e.target.setCustomValidity('Mohon isi nama lengkap Anda.')}
              onInput={(e) => e.target.setCustomValidity('')}/>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
                <input type="email" required className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="mahasiswa@uin.ac.id" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                onInvalid={e => {
                  if (e.target.validity.valueMissing) {
                      // Jika kosong
                      e.target.setCustomValidity('Mohon isi alamat email.');
                  } else if (e.target.validity.typeMismatch) {
                      // Jika ada isi TAPI tidak ada '@' atau format salah
                      e.target.setCustomValidity('Mohon sertakan "@" dalam alamat email.');
                  } else {
                      e.target.setCustomValidity('Format email salah.');
                  }
              }}
              onInput={e => e.target.setCustomValidity('')}
                />
                <Mail size={18} className="absolute left-3 top-3.5 text-gray-400"/>
            </div>
          </div>

          {authMode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    // VALIDASI DI SINI:
                    // pattern ini mengecek: minimal 8 karakter, ada huruf besar, huruf kecil, dan angka.
                    pattern={authMode === 'register' ? "(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" : undefined}
                    title={authMode === 'register' ? "Harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka" : undefined}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                    placeholder="********" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    onInvalid={e => e.target.setCustomValidity('Mohon isi kata sandi Anda.')}
                    onInput={e => e.target.setCustomValidity('')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-teal-600">
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
              
              {/* Petunjuk Password (Hanya muncul saat register) */}
              {authMode === 'register' && (
                  <p className="text-xs text-gray-400 mt-1 ml-1">
                      Min. 8 karakter, kombinasi huruf besar, huruf kecil dan angka.
                  </p>
              )}

              {authMode === 'login' && (
                  <div className="text-right mt-2">
                      <button type="button" onClick={() => { setAuthMode('reset'); setError(''); }} className="text-xs text-teal-600 hover:text-teal-800 font-medium">Lupa kata sandi?</button>
                  </div>
              )}
            </div>
          )}

          <button disabled={loading} type="submit" className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition shadow-md disabled:bg-gray-400">
            {loading ? 'Memproses...' : (authMode === 'login' ? 'Masuk' : authMode === 'register' ? 'Daftar Sekarang' : 'Kirim Link Reset')}
          </button>
        </form>

        {authMode !== 'reset' && (
            <div className="mt-6 text-center text-sm text-gray-600">
            {authMode === 'register' ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }} className="text-teal-600 font-bold hover:underline">
                {authMode === 'register' ? 'Login di sini' : 'Daftar di sini'}
            </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Auth;