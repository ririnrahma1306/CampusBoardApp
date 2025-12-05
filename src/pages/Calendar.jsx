import React, { useEffect, useState } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, MapPin, Clock, PlusCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { addDoc, collection, query, where, onSnapshot, serverTimestamp, deleteDoc, getDocs, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import Modal from '../components/Modal'; 
import Swal from 'sweetalert2';

const CalendarPage = ({ user, events, initialDate }) => {
  const [myEvents, setMyEvents] = useState([]); // Menyimpan ID acara
  const [myEventDocs, setMyEventDocs] = useState({}); // Menyimpan Mapping { eventId: docId } untuk penghapusan
  
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. LOGIKA BUKA TANGGAL DARI NOTIFIKASI
  useEffect(() => {
      if (initialDate) {
          const [y, m, d] = initialDate.split('-').map(Number);
          setCurrentDate(new Date(y, m - 1, 1));
          setSelectedDate(initialDate);
          setIsModalOpen(true);
      }
  }, [initialDate]);

  // 2. AMBIL KALENDER PRIBADI
  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, 'kalender_pribadi'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventIds = [];
      const docsMap = {};
      
      snapshot.docs.forEach(doc => {
          const data = doc.data();
          eventIds.push(data.eventId);
          docsMap[data.eventId] = doc.id; // Simpan ID Dokumen agar bisa dihapus nanti
      });

      setMyEvents(eventIds);
      setMyEventDocs(docsMap);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. FUNGSI TAMBAH KE KALENDER
  const handleAddToCalendar = async (event) => {
    if (!user) {
        Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Silakan login terlebih dahulu.' });
        return;
    }    
    if (!db) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Database belum terhubung.' });
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventEndDateStr = event.endDate || event.date;
    const [y, m, d] = eventEndDateStr.split('-').map(Number);
    const eventEndDate = new Date(y, m - 1, d);
    
    if (eventEndDate < today) {
        Swal.fire({ 
            icon: 'warning', 
            title: 'Acara Lewat', 
            text: 'Maaf, acara ini sudah berlalu dan tidak dapat ditambahkan.',
            confirmButtonColor: '#f59e0b'
        });
        return;
    }

    try {
        await addDoc(collection(db, 'kalender_pribadi'), {
            userId: user.uid,
            eventId: event.id,
            eventTitle: event.title,
            eventDate: event.date, 
            eventEndDate: event.endDate || event.date, 
            addedAt: serverTimestamp()
        });
        Swal.fire({
            icon: 'success',
            title: 'Tersimpan!',
            text: 'Acara berhasil ditambahkan ke kalender pribadi!',
            confirmButtonColor: '#0d9488', // Warna Teal
            timer: 2000,
            showConfirmButton: false
        });
    } catch (e) {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menambahkan acara.' });
    }
  };
  
  // 4. FUNGSI HAPUS DARI KALENDER (BARU)
  const handleRemoveFromCalendar = async (eventId) => {
      if (!user || !db) return;
      
      const docId = myEventDocs[eventId];
      if (!docId){
        Swal.fire({ icon: 'error', title: 'Error', text: 'Data acara tidak ditemukan.' });
        return;
    }

    Swal.fire({
        title: 'Hapus dari Kalender?',
        text: "Acara ini akan dihapus dari jadwal pribadi Anda.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33', // Merah
        cancelButtonColor: '#3085d6', // Biru standar
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await deleteDoc(doc(db, 'kalender_pribadi', docId));
                
                // Notifikasi kecil (Toast) setelah dihapus
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Acara dihapus dari kalender'
                });

            } catch (error) {
                console.error("Gagal menghapus:", error);
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus acara.' });
            }
        }
    });
};

  // Helper format
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // --- LOGIKA KALENDER GRID ---
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setIsModalOpen(true);
  };

  const eventsOnSelectedDate = events.filter(e => {
      const current = selectedDate;
      const start = e.date;
      const end = e.endDate || e.date;
      return current >= start && current <= end;
  });

  const renderCalendarGrid = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate); 
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let days = [];
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);

    for (let day = 1; day <= totalDays; day++) {
        const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = `${currentDayDate.getFullYear()}-${String(currentDayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getTime() === currentDayDate.getTime();
        const isPast = currentDayDate < today;
        const isSelected = selectedDate === dateStr;

        const eventsToday = events.filter(e => {
            const start = e.date;
            const end = e.endDate || e.date;
            return dateStr >= start && dateStr <= end;
        });

        days.push(
            <div 
                key={day} 
                onClick={() => handleDateClick(day)}
                className={`h-24 border border-gray-100 p-2 cursor-pointer transition relative hover:bg-teal-50 
                ${isToday ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : 'bg-white'} 
                ${isSelected ? 'bg-yellow-50 ring-2 ring-yellow-400' : ''}
                ${isPast ? 'bg-gray-50' : ''}`}
            >
                <span className={`text-sm font-bold ${isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>{day}</span>
                <div className="mt-1 space-y-1 overflow-hidden">
                    {eventsToday.map((ev, idx) => (
                        <div key={idx} className={`text-[10px] px-1 rounded truncate ${isPast ? 'bg-gray-200 text-gray-500 line-through' : (ev.endDate && ev.endDate !== ev.date ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800')}`}>
                            {ev.title}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return days;
  };

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Kalender Akademik</h1>
            <p className="text-gray-500">Pantau jadwal kegiatan dan acara penting kampus.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20}/></button>
            <h2 className="text-lg font-bold text-gray-800 w-40 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="grid grid-cols-7 bg-teal-700 text-white text-center py-2 font-semibold text-sm">
                    <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
                </div>
                <div className="grid grid-cols-7">
                    {renderCalendarGrid()}
                </div>
            </div>
        </div>

        <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-teal-100 sticky top-24">
                <h2 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <CalIcon size={18} className="text-teal-600"/> Kalender Saya
                </h2>
                {!user ? (
                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded">Login untuk melihat jadwal pribadi Anda.</p>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {myEvents.length > 0 ? events.filter(e => myEvents.includes(e.id)).map(e => {
                            const [y, m, d] = e.date.split('-').map(Number);
                            const eventDate = new Date(y, m - 1, d);
                            const today = new Date(); today.setHours(0,0,0,0);
                            const isPast = eventDate < today;

                            return (
                                <div key={'my-'+e.id} className={`text-sm p-3 rounded-lg border transition relative group ${isPast ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-teal-50 border-teal-100 hover:shadow-sm'}`}>
                                    <div className={`font-bold ${isPast ? 'line-through' : 'text-teal-800'} pr-6`}>
                                        {e.title} 
                                    </div>
                                    {isPast && <span className="text-[10px] font-bold text-gray-500 block mb-1">(Terlaksana)</span>}
                                    <div className={`text-xs mt-1 flex items-center gap-1 ${isPast ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <Clock size={12}/> {formatDate(e.date)}
                                    </div>

                                    {/* TOMBOL HAPUS DI SIDEBAR */}
                                    <button 
                                        onClick={() => handleRemoveFromCalendar(e.id)}
                                        className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Hapus dari Kalender Saya"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            );
                        }) : (
                            <p className="text-sm text-gray-400 italic">Belum ada acara disimpan.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Modal Detail Acara */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Acara Tanggal ${selectedDate ? formatDate(selectedDate) : ''}`}>
            <div className="space-y-4">
                {eventsOnSelectedDate.length > 0 ? (
                    eventsOnSelectedDate.map(event => {
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const endDateStr = event.endDate || event.date;
                        const [y, m, d] = endDateStr.split('-').map(Number);
                        const eventEnd = new Date(y, m - 1, d);
                        const isEventPast = eventEnd < today;
                        const isSaved = myEvents.includes(event.id);

                        return (
                            <div key={event.id} className={`bg-gray-50 p-4 rounded-lg border ${isEventPast ? 'border-gray-200 bg-gray-100 opacity-80' : 'border-blue-100'}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold text-lg ${isEventPast ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{event.title}</h3>
                                    {isEventPast && <span className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">SELESAI</span>}
                                </div>
                                
                                <div className={`flex items-center gap-2 text-sm mt-2 font-medium ${isEventPast ? 'text-gray-500' : 'text-blue-600'}`}>
                                    <Clock size={16}/> 
                                    {formatDate(event.date)} 
                                    {event.endDate && event.endDate !== event.date && ` s/d ${formatDate(event.endDate)}`}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                    <MapPin size={16} className={isEventPast ? 'text-gray-400' : 'text-red-500'}/> {event.location}
                                </div>
                                <p className="text-sm text-gray-700 mt-3 bg-white p-2 rounded border border-dashed">
                                    {event.desc}
                                </p>
                                
                                {user && (
                                    <div className="mt-4 pt-3 border-t flex justify-end">
                                    {myEvents.includes(event.id) ? (
                                        <span className="flex items-center gap-1 text-green-600 text-sm font-bold bg-green-100 px-3 py-1.5 rounded-full">
                                            <CheckCircle size={16}/> Tersimpan
                                        </span>
                                    ) : isEventPast ? (
                                        <button disabled className="flex items-center gap-1 bg-gray-300 text-white text-sm px-4 py-2 rounded-lg cursor-not-allowed">
                                            <XCircle size={16}/> Sudah Lewat
                                        </button>
                                    ) : (
                                        <button onClick={() => handleAddToCalendar(event)} className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
                                            <PlusCircle size={16}/> Simpan ke Kalender Saya
                                        </button>
                                    )}
                                </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <p>Tidak ada acara pada tanggal ini.</p>
                    </div>
                )}
            </div>
      </Modal>
    </div>
  );
};

export default CalendarPage;