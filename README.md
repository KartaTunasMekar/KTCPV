# Karta Cup V

Aplikasi manajemen turnamen sepak bola yang komprehensif untuk Karta Cup V, dibangun dengan Next.js, Firebase, dan Tailwind CSS.

## Fitur Utama

### 1. Manajemen Tim & Pemain
- Pendaftaran tim dengan informasi lengkap (nama, logo, grup, warna jersey)
- Manajemen pemain (nama, nomor punggung, posisi)
- Inisialisasi data tim otomatis
- Pengelompokan tim ke dalam 4 grup (A, B, C, D)

### 2. Penjadwalan Pertandingan
- Pembuatan jadwal otomatis untuk fase grup dan knockout
- 60 pertandingan fase grup (15 pertandingan per grup)
- 7 pertandingan fase knockout (4 perempat final, 2 semifinal, 1 final)
- Filter jadwal berdasarkan tanggal, tim, dan grup
- Pengaturan tanggal dan waktu pertandingan

### 3. Pencatatan Hasil Pertandingan
- Input skor pertandingan
- Pencatatan pencetak gol dengan menit
- Sistem kartu (kuning/merah) dengan detail pemain dan menit
- Validasi data pertandingan
- Update statistik tim dan pemain otomatis

### 4. Klasemen & Statistik
- Klasemen otomatis per grup
- Perhitungan poin (Menang=3, Seri=1, Kalah=0)
- Statistik tim (main, menang, seri, kalah)
- Selisih gol dan head-to-head
- Persentase kemenangan tim

### 5. Sistem Kartu & Sanksi
- Pencatatan kartu kuning dan merah
- Akumulasi kartu kuning (3 kartu = larangan main)
- Sanksi kartu merah langsung
- Sistem denda dan pembayaran
- Notifikasi pemain yang terkena sanksi

### 6. Penghargaan
- Top skor dengan detail gol
- Pemain terbaik (sistem poin berdasarkan performa)
- Kiper terbaik (clean sheet dan performa)
- Tim fair play (berdasarkan kartu dan perilaku)
- Statistik detail pemain

### 7. Dashboard & Analisis
- Ringkasan turnamen real-time
- Pertandingan mendatang
- Hasil pertandingan terakhir
- Statistik dan analisis pertandingan
- Validasi pertandingan otomatis

## Teknologi

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Firebase (Firestore)
- **State Management:** React Hooks
- **UI Components:** Shadcn UI
- **Icons:** Lucide Icons

## Instalasi

1. Clone repositori
   ```bash
   git clone [URL_REPOSITORI]
   ```

2. Install dependensi
   ```bash
   npm install
   ```

3. Setup Firebase
   - Buat proyek di Firebase Console
   - Aktifkan Firestore Database
   - Copy konfigurasi Firebase ke .env.local

4. Jalankan aplikasi
   ```bash
   npm run dev
   ```

## Penggunaan

1. Akses aplikasi di https://ktcpv.vercel.app
2. Login dengan akun yang diberikan panitia
3. Mulai dengan mendaftarkan tim dan pemain
4. Generate jadwal pertandingan
5. Catat hasil pertandingan setelah selesai
6. Monitor klasemen dan statistik

## Lisensi

Hak Cipta © 2025 Karta Cup V. Seluruh hak dilindungi.

## Kontak

- Email: kartadesapangauban@gmail.com
- WhatsApp: 0852 1234 0232 