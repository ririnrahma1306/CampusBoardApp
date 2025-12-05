CampusBoard - Pusat Informasi Kampus Terpadu

Final Project Rekayasa Perangkat Lunak
Kelompok: 4
Anggota:
1. Indo Masse (701230001)
2. Ririn Rahmawati (701230036)
3. Dina Komariah (701230065)
Dosen Pengampu: Dila Nurlaila, M.Kom.

Deskripsi Aplikasi
CampusBoard adalah aplikasi berbasis web yang berfungsi sebagai papan informasi digital untuk lingkungan kampus UIN Sultan Thaha Saifuddin Jambi. Aplikasi ini memusatkan penyebaran pengumuman akademik, acara kemahasiswaan, dan kalender kegiatan dalam satu platform yang mudah diakses.

Tujuan & Masalah yang Diselesaikan
- Masalah: Informasi kampus sering tercecer di grup WhatsApp, tertimbun chat, atau hanya ditempel di papan fisik yang jarang dibaca.
- Solusi: CampusBoard menyediakan centralized hub di mana Admin dapat menyebarkan info resmi yang dapat diakses kapan saja secara real-time, dan Mahasiswa dapat berdiskusi serta menyimpan jadwal penting ke kalender pribadi.

Teknologi yang Digunakan
- Frontend: React.js (Vite Framework)
- Styling: Tailwind CSS
- Language: JavaScript (ES6+), HTML5
- Database: Google Cloud Firestore (NoSQL)
- Authentication: Firebase Auth
- Deployment: Firebase Hosting

Cara Menjalankan Aplikasi (Lokal)
1. Clone Repository
    git clone [https://github.com/username-anda/campusboard.git](https://github.com/username-anda/campusboard.git)
    cd campusboard
2. Instalasi Dependency
    npm install
3. Konfigurasi Firebase
    - Buat file src/config/firebase.js.
    - Masukkan konfigurasi API Key Firebase Anda (lihat firebase.js.example)
4. Jalankan Project
    npm run dev
    Buka http://localhost:5173 di browser.

Akun Demo (Untuk Pengujian)
Jika Anda ingin mencoba fitur tanpa mendaftar:
1. Akun Admin:
    - Email: campusboard1@gmail.com
    - Password: adminkita
2. Akun Mahasiswa:
    - Email: Mahasiswa58@gmail.com
    - Password: Mhs123

Link Deployment & Demo
Aplikasi Web: https://campusboard1-c6e50.web.app/
Video Demo:

Screenshot
<img src="public/Home.png" alt="Tampilan Halaman Utama" width="700">

Catatan Tambahan
- Fitur "Lupa Password" memerlukan konfigurasi domain hosting di Firebase Console agar link email berfungsi dengan benar.
- Saat ini aplikasi berjalan optimal di browser Chrome dan Edge.

Dibuat untuk memenuhi tugas Final Project mata kuliah Rekayasa Perangkat Lunak, Program Studi Sistem Informasi, UIN Sultan Thaha Saifuddin Jambi, 2025.