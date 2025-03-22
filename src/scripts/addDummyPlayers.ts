import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Team, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Daftar nama depan untuk pemain dummy
const firstNames = [
  'Andi', 'Budi', 'Candra', 'Dedi', 'Eko', 'Fajar', 'Gunawan', 'Hadi', 'Irfan', 'Joko',
  'Kurniawan', 'Lukman', 'Muhamad', 'Nanda', 'Oki', 'Pandu', 'Rudi', 'Surya', 'Tono', 'Umar',
  'Vino', 'Wahyu', 'Yanto', 'Zaki', 'Agus', 'Bambang', 'Cahyo', 'Dimas', 'Edi', 'Firman'
];

// Daftar nama belakang untuk pemain dummy
const lastNames = [
  'Pratama', 'Saputra', 'Wijaya', 'Kusuma', 'Nugraha', 'Hidayat', 'Santoso', 'Wibowo', 'Susanto', 'Setiawan',
  'Permana', 'Putra', 'Utama', 'Ramadhan', 'Suryanto', 'Firmansyah', 'Hartono', 'Gunawan', 'Sugianto', 'Maulana'
];

// Daftar posisi pemain
const positions = [
  'Penjaga Gawang',
  'Bek',
  'Gelandang',
  'Penyerang'
];

// Warna untuk avatar
const avatarColors = [
  '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33F0',
  '#33FFF0', '#F0FF33', '#FF3333', '#33FF33', '#3333FF',
  '#FFAA33', '#33FFAA', '#AA33FF', '#FF33AA', '#33AAFF'
];

// Fungsi untuk menghasilkan avatar SVG sebagai data URL
const generateAvatarDataUrl = (name: string): string => {
  // Ambil inisial dari nama (maksimal 2 karakter)
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  // Pilih warna latar belakang secara acak
  const bgColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  
  // Buat SVG sederhana dengan inisial
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" fill="${bgColor}" />
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central" dy="2">
        ${initials}
      </text>
    </svg>
  `;
  
  // Konversi SVG ke data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Fungsi untuk menghasilkan nama acak
const getRandomName = (): string => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Fungsi untuk menghasilkan posisi acak
const getRandomPosition = (): string => {
  // Pastikan ada minimal 1 penjaga gawang, 4 bek, 4 gelandang, dan 2 penyerang
  if (Math.random() < 0.1) return positions[0]; // 10% penjaga gawang
  if (Math.random() < 0.4) return positions[1]; // 30% bek
  if (Math.random() < 0.7) return positions[2]; // 30% gelandang
  return positions[3]; // 30% penyerang
};

// Fungsi untuk menghasilkan nomor punggung acak yang belum digunakan
const getRandomNumber = (usedNumbers: number[]): number => {
  let number;
  do {
    number = Math.floor(Math.random() * 99) + 1; // Nomor 1-99
  } while (usedNumbers.includes(number));
  return number;
};

// Fungsi utama untuk menambahkan pemain dummy ke tim
export const addDummyPlayersToTeams = async () => {
  try {
    // Ambil semua tim dari Firestore
    const teamsSnapshot = await getDocs(collection(db, 'teams'));
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
    
    console.log(`Ditemukan ${teams.length} tim. Menambahkan pemain dummy...`);
    
    // Iterasi setiap tim
    for (const team of teams) {
      // Periksa jumlah pemain yang sudah ada
      const existingPlayers = team.players || [];
      const existingCount = existingPlayers.length;
      
      // Tentukan berapa banyak pemain yang perlu ditambahkan
      // Minimal 15, maksimal 20 pemain per tim
      const targetCount = Math.floor(Math.random() * 6) + 15; // 15-20 pemain
      const playersToAdd = Math.max(0, targetCount - existingCount);
      
      if (playersToAdd <= 0) {
        console.log(`Tim ${team.name} sudah memiliki ${existingCount} pemain. Tidak perlu menambahkan pemain.`);
        continue;
      }
      
      console.log(`Menambahkan ${playersToAdd} pemain ke tim ${team.name}`);
      
      // Kumpulkan nomor punggung yang sudah digunakan
      const usedNumbers = existingPlayers.map(p => p.number);
      
      // Buat pemain dummy baru
      const newPlayers: Player[] = [];
      for (let i = 0; i < playersToAdd; i++) {
        const name = getRandomName();
        const number = getRandomNumber(usedNumbers);
        usedNumbers.push(number);
        
        const player: Player = {
          id: uuidv4(),
          name: name,
          number: number,
          position: getRandomPosition(),
          teamId: team.id,
          teamName: team.name,
          photo: generateAvatarDataUrl(name),
          yellowCards: 0,
          redCards: 0,
          suspended: false
        };
        
        newPlayers.push(player);
      }
      
      // Gabungkan pemain yang sudah ada dengan pemain baru
      const updatedPlayers = [...existingPlayers, ...newPlayers];
      
      // Update dokumen tim di Firestore
      const teamRef = doc(db, 'teams', team.id);
      await updateDoc(teamRef, { players: updatedPlayers });
      
      console.log(`Berhasil menambahkan ${playersToAdd} pemain ke tim ${team.name}`);
    }
    
    console.log('Proses penambahan pemain dummy selesai!');
    return true;
  } catch (error) {
    console.error('Error menambahkan pemain dummy:', error);
    return false;
  }
};

// Eksekusi fungsi jika file ini dijalankan langsung
// Hapus bagian ini karena tidak berfungsi di browser
// if (import.meta.url === import.meta.main) {
//   addDummyPlayersToTeams()
//     .then(success => {
//       if (success) {
//         console.log('Berhasil menambahkan pemain dummy ke semua tim!');
//       } else {
//         console.error('Gagal menambahkan pemain dummy.');
//       }
//     });
// } 