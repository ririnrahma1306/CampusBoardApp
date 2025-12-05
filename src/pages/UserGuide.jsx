import React from 'react';
import { BookOpen, UserPlus, LogIn, Layout, Calendar, User, ArrowLeft } from 'lucide-react';

const UserGuide = ({ setView }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <button 
        onClick={() => setView('home')}
        className="flex items-center gap-2 text-gray-500 hover:text-teal-600 mb-6 transition"
      >
        <ArrowLeft size={20} /> Kembali ke Beranda
      </button>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-teal-800 mb-2">Panduan Pengguna CampusBoard</h1>
        <p className="text-gray-600">Pelajari cara menggunakan fitur-fitur utama aplikasi ini.</p>
      </div>

      <div className="grid gap-8">
        
        {/* Section 1: Pendaftaran */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 border-b pb-2">
                <div className="bg-teal-100 p-2 rounded-lg text-teal-600"><UserPlus size={24}/></div>
                <h2 className="text-xl font-bold text-gray-800">1. Cara Daftar Akun Baru</h2>
            </div>
            <ul className="space-y-3 text-gray-600 list-disc list-inside ml-2">
                <li>Klik tombol <span className="font-bold">Login / Daftar</span> di pojok kanan atas.</li>
                <li>Pilih opsi <span className="font-bold text-teal-600">"Daftar di sini"</span> di bagian bawah.</li>
                <li>Isi Nama Lengkap, Email Kampus, dan Password (Min. 8 karakter, huruf besar, huruf kecil, dan angka).</li>
                <li>Klik tombol <b>Daftar Sekarang</b>. Anda akan langsung masuk ke aplikasi.</li>
            </ul>
        </div>

        {/* Section 2: Papan Informasi */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 border-b pb-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Layout size={24}/></div>
                <h2 className="text-xl font-bold text-gray-800">2. Menggunakan Papan Informasi</h2>
            </div>
            <p className="text-gray-600 mb-3">Di halaman ini Anda bisa melihat pengumuman akademik terbaru.</p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside ml-2">
                <li>Gunakan <b>Kolom Pencarian</b> untuk mencari berita spesifik.</li>
                <li>Klik tombol filter (Akademik, Lomba, dll) untuk menyaring info.</li>
                <li><b>Klik pada Pengumuman</b> untuk melihat detail lengkap, gambar, dan kolom komentar.</li>
            </ul>
        </div>

        {/* Section 3: Kalender */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 border-b pb-2">
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Calendar size={24}/></div>
                <h2 className="text-xl font-bold text-gray-800">3. Mengelola Kalender Saya</h2>
            </div>
            <p className="text-gray-600 mb-3">Simpan jadwal penting agar tidak terlewat.</p>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                <p className="mb-2"><strong>Caranya:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Buka menu <b>Kalender</b>.</li>
                    <li>Cari tanggal yang memiliki acara.</li>
                    <li>Klik tanggal tersebut untuk melihat detail.</li>
                    <li>Klik tombol <span className="text-blue-600 font-bold">+ Simpan ke Kalender Saya</span>.</li>
                </ol>
                <p className="mt-2 text-xs text-gray-500">*Acara yang disimpan akan muncul di daftar sebelah kanan.</p>
            </div>
        </div>

        {/* Section 4: Profil */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4 border-b pb-2">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><User size={24}/></div>
                <h2 className="text-xl font-bold text-gray-800">4. Edit Profil</h2>
            </div>
            <ul className="space-y-2 text-gray-600 list-disc list-inside ml-2">
                <li>Klik nama Anda di menu atas, lalu pilih <b>Profil</b>.</li>
                <li>Klik ikon <b>Pensil</b> untuk mengubah Nama atau Bio.</li>
                <li>Arahkan kursor ke foto profil dan klik ikon <b>Kamera</b> untuk mengganti foto.</li>
            </ul>
        </div>

      </div>

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>Masih butuh bantuan? Hubungi campusboard1@gmail.com</p>
      </div>
    </div>
  );
};

export default UserGuide;