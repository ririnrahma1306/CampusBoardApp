export const ROLES = {
    ADMIN: 'admin',
    USER: 'user'
  };
  
  export const CATEGORIES = ['Akademik', 'Beasiswa', 'Non-Akademik', 'Seminar', 'Lomba'];
  
  // Data Dummy untuk tampilan awal jika database belum konek
  export const MOCK_ANNOUNCEMENTS = [
    { id: '1', title: 'Pendaftaran Wisuda Periode II', category: 'Akademik', content: 'Pendaftaran dibuka mulai tanggal...', status: 'published', date: new Date(), authorName: 'Admin' },
    { id: '2', title: 'Seminar Nasional AI', category: 'Seminar', content: 'Ikuti seminar teknologi masa depan...', status: 'published', date: new Date(), authorName: 'BEM' },
    { id: '3', title: 'Beasiswa Prestasi 2025', category: 'Beasiswa', content: 'Kesempatan emas bagi mahasiswa...', status: 'published', date: new Date(), authorName: 'Kemahasiswaan' },
  ];
  
  export const MOCK_EVENTS = [
    { id: '1', title: 'Workshop ReactJS', date: '2025-11-20', location: 'Lab Komputer 1', desc: 'Belajar dasar React.' },
    { id: '2', title: 'Upacara Hari Pahlawan', date: '2025-11-10', location: 'Lapangan Utama', desc: 'Wajib bagi seluruh maba.' },
  ];