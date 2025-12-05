import React, { useState, useEffect } from 'react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../config/firebase'; // Pastikan path ini benar
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Fungsi validasi password dipindahkan ke sini jika file utils tidak ditemukan
const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password minimal 8 karakter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password harus mengandung setidaknya satu huruf besar (A-Z).";
  }
  if (!/[a-z]/.test(password)) {
    return "Password harus mengandung setidaknya satu huruf kecil (a-z).";
  }
  if (!/[0-9]/.test(password)) {
    return "Password harus mengandung setidaknya satu angka (0-9).";
  }
  return null;
};

const ResetPassword = ({ oobCode, onResetSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCodeValid, setIsCodeValid] = useState(true);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 1. Verifikasi Kode Link saat halaman dibuka
  useEffect(() => {
    const verifyCode = async () => {
        if (!oobCode) {
            setIsCodeValid(false);
            setError("Link tidak valid (kode kosong).");
            return;
        }
        try {
            // Cek ke Firebase apakah link ini valid
            const emailAddr = await verifyPasswordResetCode(auth, oobCode);
            setEmail(emailAddr);
        } catch (err) {
            console.error("Verifikasi gagal:", err);
            setIsCodeValid(false);
            setError("Link reset password tidak valid atau sudah kedaluwarsa. Silakan ajukan ulang.");
        }
    };
    verifyCode();
  }, [oobCode]);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // --- VALIDASI PASSWORD BARU ---
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
        return setError(passwordError);
    }

    if (newPassword !== confirmPassword) return setError("Konfirmasi password tidak cocok.");

    setLoading(true);
    try {
        // 2. Konfirmasi perubahan password ke Firebase
        await confirmPasswordReset(auth, oobCode, newPassword);
        setMessage("Sukses! Password berhasil diperbarui.");
        
        // Redirect otomatis setelah 3 detik
        setTimeout(() => {
            onResetSuccess(); 
        }, 3000);
    } catch (err) {
        setError("Gagal mereset password: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // Tampilan jika Link Tidak Valid
  if (!isCodeValid) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertCircle size={32}/>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Link Tidak Valid</h2>
                <p className="text-gray-600 mt-2 text-sm">{error}</p>
                <button 
                    onClick={onResetSuccess} 
                    className="mt-6 bg-teal-600 text-white px-6 py-2 rounded-full font-bold hover:bg-teal-700 transition shadow-md"
                >
                    Kembali ke Login
                </button>
            </div>
        </div>
      );
  }

  // Tampilan Sukses
  if (message) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-in">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-green-100">
                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                    <CheckCircle size={32}/>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Password Diubah!</h2>
                <p className="text-gray-600 mt-2">{message}</p>
                <p className="text-xs text-gray-400 mt-4">Mengalihkan ke halaman login dalam 3 detik...</p>
                <button onClick={onResetSuccess} className="mt-4 text-teal-600 font-bold hover:underline text-sm">Login Sekarang</button>
            </div>
        </div>
      );
  }

  // Tampilan Form Reset Password
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 animate-fade-in">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-6">
            <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
                <Lock size={32}/>
            </div>
            <h2 className="text-2xl font-bold text-teal-700">Atur Ulang Password</h2>
            <p className="text-gray-500 text-sm mt-1">Akun: <span className="font-medium text-gray-700">{email}</span></p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200 flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

        <form onSubmit={handleReset} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"}
                        required
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition pr-10"
                        placeholder="Password baru"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-teal-600 transition"
                    >
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 ml-1">
                    Min. 8 karakter, kombinasi huruf besar, kecil & angka.
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>
            <button 
                disabled={loading}
                type="submit" 
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-bold hover:bg-teal-700 transition shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;