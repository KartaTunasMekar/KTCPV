import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, Timestamp, getDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PlayerCard } from '../types/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog';
import { Share2 } from 'lucide-react';

// Fungsi pembantu untuk format tanggal
const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

// Fungsi pembantu untuk parse tanggal dari berbagai format
const parseDate = (date: any): Date | null => {
  if (!date) return null;
  
  try {
    if (date instanceof Date) return date;
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      // Pastikan tanggal valid
      if (isNaN(parsedDate.getTime())) return null;
      return parsedDate;
    }
    if (typeof date === 'number') return new Date(date);
    return null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

// Interface untuk pertandingan berikutnya
interface MatchData {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: Timestamp;
  time: string;
  venue?: string;
  status: string;
  isHomeTeam?: boolean;
}

export default function CardsAndBans() {
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerCard | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [nextMatches, setNextMatches] = useState<{[key: string]: MatchData}>({});
  const [activeTab, setActiveTab] = useState("yellow");

  useEffect(() => {
    fetchPlayerCards();
  }, []);
  
  useEffect(() => {
    const bannedPlayersCount = playerCards.filter(p => p.isBanned).length;
    
    if (bannedPlayersCount > 0) {
      fetchNextMatches();
    }
  }, [playerCards]);

  const fetchPlayerCards = async () => {
    try {
      // Ambil semua pertandingan yang sudah selesai
      const matchesRef = collection(db, 'matches');
      const matchesQuery = query(matchesRef, where('status', '==', 'completed'));
      const matchesSnapshot = await getDocs(matchesQuery);
      
      const cards: PlayerCard[] = [];
      const processedPlayerIds = new Set<string>();
      
      // Proses setiap pertandingan yang sudah selesai
      for (const matchDoc of matchesSnapshot.docs) {
        const matchData = matchDoc.data();
        
        // Ambil data tim kandang
        const homeTeamRef = doc(db, 'teams', matchData.homeTeamId);
        const homeTeamDoc = await getDoc(homeTeamRef);
        const homeTeamData = homeTeamDoc.data();
        
        // Ambil data tim tamu
        const awayTeamRef = doc(db, 'teams', matchData.awayTeamId);
        const awayTeamDoc = await getDoc(awayTeamRef);
        const awayTeamData = awayTeamDoc.data();

        if (!homeTeamData || !awayTeamData) continue;

        // Proses kartu tim kandang
        if (matchData.cards?.home) {
          matchData.cards.home.forEach((card: any) => {
            const player = homeTeamData.players.find((p: any) => p.id === card.playerId);
            if (player) {
              const existingCard = cards.find(c => c.playerId === player.id);
              if (existingCard) {
                if (card.type === 'yellow') {
                  existingCard.yellowCards++;
                } else {
                  existingCard.redCards++;
                }
                // Update status isBanned dengan nilai terbaru dari database
                existingCard.isBanned = player.isBanned || false;
              } else {
                processedPlayerIds.add(player.id);
                cards.push({
                  playerId: player.id,
                  playerName: player.name,
                  yellowCards: card.type === 'yellow' ? 1 : 0,
                  redCards: card.type === 'red' ? 1 : 0,
                  isBanned: player.isBanned || false,
                  teamId: matchData.homeTeamId,
                  teamName: homeTeamData.name,
                  lastUpdated: card.timestamp?.toDate() || new Date(),
                  matchDate: matchData.date,
                  matchTime: matchData.time,
                  opponentTeamName: matchData.awayTeamName,
                  matchId: matchDoc.id,
                  finePaid: player.finePaid || false,
                  fineAmount: player.fineAmount || 0,
                  finePaidDate: player.finePaidDate || null
                });
              }
            }
          });
        }

        // Proses kartu tim tamu
        if (matchData.cards?.away) {
          matchData.cards.away.forEach((card: any) => {
            const player = awayTeamData.players.find((p: any) => p.id === card.playerId);
            if (player) {
              const existingCard = cards.find(c => c.playerId === player.id);
              if (existingCard) {
                if (card.type === 'yellow') {
                  existingCard.yellowCards++;
                } else {
                  existingCard.redCards++;
                }
                // Update status isBanned dengan nilai terbaru dari database
                existingCard.isBanned = player.isBanned || false;
              } else {
                processedPlayerIds.add(player.id);
                cards.push({
                  playerId: player.id,
                  playerName: player.name,
                  yellowCards: card.type === 'yellow' ? 1 : 0,
                  redCards: card.type === 'red' ? 1 : 0,
                  isBanned: player.isBanned || false,
                  teamId: matchData.awayTeamId,
                  teamName: awayTeamData.name,
                  lastUpdated: card.timestamp?.toDate() || new Date(),
                  matchDate: matchData.date,
                  matchTime: matchData.time,
                  opponentTeamName: matchData.homeTeamName,
                  matchId: matchDoc.id,
                  finePaid: player.finePaid || false,
                  fineAmount: player.fineAmount || 0,
                  finePaidDate: player.finePaidDate || null
                });
              }
            }
          });
        }
        
        // Tambahkan pemain yang telah dilarang secara manual (tidak melalui kartu)
        // Tim kandang
        homeTeamData.players.forEach((player: any) => {
          if (player.isBanned && !processedPlayerIds.has(player.id)) {
            processedPlayerIds.add(player.id);
            cards.push({
              playerId: player.id,
              playerName: player.name,
              yellowCards: player.yellowCards || 0,
              redCards: player.redCards || 0,
              isBanned: true,
              teamId: matchData.homeTeamId,
              teamName: homeTeamData.name,
              lastUpdated: player.lastUpdated?.toDate() || new Date(),
              matchDate: matchData.date,
              matchTime: matchData.time,
              opponentTeamName: matchData.awayTeamName,
              matchId: matchDoc.id,
              finePaid: player.finePaid || false,
              fineAmount: player.fineAmount || 0,
              finePaidDate: player.finePaidDate || null
            });
          }
        });
        
        // Tim tamu
        awayTeamData.players.forEach((player: any) => {
          if (player.isBanned && !processedPlayerIds.has(player.id)) {
            processedPlayerIds.add(player.id);
            cards.push({
              playerId: player.id,
              playerName: player.name,
              yellowCards: player.yellowCards || 0,
              redCards: player.redCards || 0,
              isBanned: true,
              teamId: matchData.awayTeamId,
              teamName: awayTeamData.name,
              lastUpdated: player.lastUpdated?.toDate() || new Date(),
              matchDate: matchData.date,
              matchTime: matchData.time,
              opponentTeamName: matchData.homeTeamName,
              matchId: matchDoc.id,
              finePaid: player.finePaid || false,
              fineAmount: player.fineAmount || 0,
              finePaidDate: player.finePaidDate || null
            });
          }
        });
      }

      // Update status larangan berdasarkan aturan
      cards.forEach(card => {
        // Hanya larangan untuk akumulasi kartu kuning
        if (card.yellowCards >= 3) {
          card.isBanned = true;
        }
        // Untuk kartu merah, tidak otomatis larangan supaya bisa bayar denda dulu
      });
      
      setPlayerCards(cards);
    } catch (error) {
      console.error('Error fetching player cards:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data kartu pemain",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerCard = async (playerId: string, type: 'yellow' | 'red', action: 'add' | 'remove') => {
    try {
      // Cari tim yang memiliki pemain ini
      const team = playerCards.find(p => p.playerId === playerId);
      if (!team) return;

      const teamRef = doc(db, 'teams', team.teamId);
      const teamDoc = await getDoc(teamRef);
      const teamData = teamDoc.data();
      if (!teamData) return;
      
      const players = teamData.players || [];
      
      // Update data pemain
      const updatedPlayers = players.map((player: any) => {
        if (player.id === playerId) {
          const updates = { ...player };
          if (type === 'yellow') {
            updates.yellowCards = action === 'add' ? (player.yellowCards || 0) + 1 : Math.max(0, (player.yellowCards || 0) - 1);
          } else {
            updates.redCards = action === 'add' ? (player.redCards || 0) + 1 : Math.max(0, (player.redCards || 0) - 1);
          }

          // Cek aturan larangan
          if (updates.yellowCards >= 3 || updates.redCards > 0) {
            updates.isBanned = true;
          }

          updates.lastUpdated = Timestamp.now();
          return updates;
        }
        return player;
      });

      // Update tim di Firestore
      await updateDoc(teamRef, {
        players: updatedPlayers
      });
      
      // Update state lokal
      setPlayerCards(prevCards => {
        return prevCards.map(card => {
          if (card.playerId === playerId) {
            const updatedCard = { ...card };
            if (type === 'yellow') {
              updatedCard.yellowCards = action === 'add' ? card.yellowCards + 1 : Math.max(0, card.yellowCards - 1);
            } else {
              updatedCard.redCards = action === 'add' ? card.redCards + 1 : Math.max(0, card.redCards - 1);
            }
            // Update status larangan
            updatedCard.isBanned = updatedCard.yellowCards >= 3 || updatedCard.redCards > 0;
            return updatedCard;
          }
          return card;
        });
      });
      
      toast({
        title: "Sukses",
        description: `Kartu ${type === 'yellow' ? 'kuning' : 'merah'} berhasil ${action === 'add' ? 'ditambah' : 'dikurangi'}`,
      });
    } catch (error) {
      console.error('Error updating player card:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui kartu pemain",
        variant: "destructive",
      });
    }
  };

  const togglePlayerBan = async (playerId: string) => {
    try {
      // Cari tim yang memiliki pemain ini
      const playerCard = playerCards.find(p => p.playerId === playerId);
      if (!playerCard) {
        console.error("Player card not found for ID:", playerId);
        return;
      }

      const teamRef = doc(db, 'teams', playerCard.teamId);
      const teamDoc = await getDoc(teamRef);
      const teamData = teamDoc.data();
      if (!teamData) {
        console.error("Team data not found for ID:", playerCard.teamId);
        return;
      }
      
      const players = teamData.players || [];
      
      // Update data pemain
      const updatedPlayers = players.map((player: any) => {
        if (player.id === playerId) {
          // Toggle status isBanned
          const newBanStatus = !player.isBanned;
          
          const updatedPlayer = {
            ...player,
            isBanned: newBanStatus,
            lastUpdated: Timestamp.now()
          };
          
          return updatedPlayer;
        }
        return player;
      });

      // Update tim di Firestore
      await updateDoc(teamRef, {
        players: updatedPlayers
      });
      
      // Update local state immediately to give better feedback
      setPlayerCards(prevCards => {
        return prevCards.map(card => {
          if (card.playerId === playerId) {
            return {
              ...card,
              isBanned: !card.isBanned
            };
          }
          return card;
        });
      });
      
      // Refresh data from server for complete sync
      await fetchPlayerCards();
      
      // Get the current status for the toast message
      const currentStatus = !playerCard.isBanned;
      
      toast({
        title: "Sukses",
        description: `Status larangan pemain berhasil ${currentStatus ? 'diaktifkan' : 'dihapus'}`,
      });
    } catch (error) {
      console.error('Error toggling player ban:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status larangan pemain",
        variant: "destructive",
      });
    }
  };

  const yellowCardPlayers = playerCards.filter(p => p.yellowCards > 0);
  const redCardPlayers = playerCards.filter(p => p.redCards > 0);
  const bannedPlayers = playerCards.filter(p => p.isBanned);
  const paidFinePlayers = playerCards.filter(p => p.finePaid);
  
  // Tambahkan perhitungan untuk pendapatan denda
  const calculateFineStats = () => {
    const stats = {
      totalPaidFine: 0,
      totalUnpaidFine: 0,
      paidPlayers: [] as PlayerCard[],
      unpaidPlayers: [] as PlayerCard[],
      yellowCardStats: {
        total: 0,
        paid: 0,
        unpaid: 0
      },
      redCardStats: {
        total: 0,
        paid: 0,
        unpaid: 0
      }
    };

    playerCards.forEach(player => {
      const yellowCardFine = player.yellowCards * 35000;
      const redCardFine = player.redCards * 50000;
      const totalFine = yellowCardFine + redCardFine;

      if (totalFine > 0) {
        if (player.finePaid) {
          stats.totalPaidFine += player.fineAmount || 0;
          stats.paidPlayers.push(player);
          stats.yellowCardStats.paid += player.yellowCards;
          stats.redCardStats.paid += player.redCards;
        } else {
          stats.totalUnpaidFine += totalFine;
          stats.unpaidPlayers.push(player);
          stats.yellowCardStats.unpaid += player.yellowCards;
          stats.redCardStats.unpaid += player.redCards;
        }
      }

      stats.yellowCardStats.total += player.yellowCards;
      stats.redCardStats.total += player.redCards;
    });

    return stats;
  };

  const fineStats = calculateFineStats();

  const getCardAmount = (card: PlayerCard) => {
    // Hitung denda kartu merah (Rp50.000 per kartu)
    const redCardFine = card.redCards * 50000;
    
    // Hitung denda kartu kuning (Rp35.000 per kartu)
    const yellowCardFine = card.yellowCards * 35000;
    
    // Total denda
    return redCardFine + yellowCardFine;
  };

  const openPaymentDialog = (player: PlayerCard) => {
    setSelectedPlayer(player);
    setPaymentDialogOpen(true);
  };

  const handlePayFine = async () => {
    if (!selectedPlayer) return;
    
    try {
      const amount = getCardAmount(selectedPlayer);
      
      // Get team document
      const teamRef = doc(db, 'teams', selectedPlayer.teamId);
      const teamDoc = await getDoc(teamRef);
      const teamData = teamDoc.data();
      
      if (!teamData) {
        throw new Error('Data tim tidak ditemukan');
      }
      
      // Update player data in the team document
      const updatedPlayers = (teamData.players || []).map((player: any) => {
        if (player.id === selectedPlayer.playerId) {
          // Pastikan semua nilai valid dan tidak undefined
          const updatedPlayer = {
            ...player,
            finePaid: true,
            fineAmount: amount,
            finePaidDate: new Date().toISOString(),
            // Jika pemain memiliki kartu merah, tetap dilarang meskipun sudah bayar denda
            isBanned: selectedPlayer.redCards > 0 ? true : !!player.isBanned,
            lastUpdated: Timestamp.now()
          };
          
          return updatedPlayer;
        }
        return player;
      });
      
      // Pastikan tidak ada nilai undefined di updatedPlayers
      const validatedPlayers = updatedPlayers.map((player: any) => {
        const validPlayer = { ...player };
        
        // Pastikan setiap properti memiliki nilai default jika undefined
        if (validPlayer.finePaid === undefined) validPlayer.finePaid = false;
        if (validPlayer.fineAmount === undefined) validPlayer.fineAmount = 0;
        if (validPlayer.finePaidDate === undefined) validPlayer.finePaidDate = null;
        if (validPlayer.isBanned === undefined) validPlayer.isBanned = false;
        
        return validPlayer;
      });
      
      // Update team document
      await updateDoc(teamRef, {
        players: validatedPlayers
      });

      toast({
        title: "Berhasil",
        description: `Denda sebesar Rp${amount.toLocaleString('id-ID')} telah dibayar`,
      });

      // Jika pemain memiliki kartu merah, tampilkan notifikasi tambahan
      if (selectedPlayer.redCards > 0) {
        toast({
          title: "Informasi",
          description: "Pemain tetap dilarang bermain karena mendapat kartu merah",
        });
      }

      // Close dialog and reset selected player
      setPaymentDialogOpen(false);
      setSelectedPlayer(null);

      // Refresh data
      fetchPlayerCards();
    } catch (error) {
      console.error('Error paying fine:', error);
      toast({
        title: "Error",
        description: "Gagal memproses pembayaran denda",
        variant: "destructive"
      });
    }
  };

  // Fungsi untuk mengirim informasi denda via WhatsApp
  const shareToWhatsApp = (player: PlayerCard) => {
    // Format tanggal pembayaran
    const paymentDate = player.finePaidDate 
      ? new Date(player.finePaidDate).toLocaleDateString('id-ID') 
      : '-';
    
    // Hitung rincian denda
    const yellowCardFine = player.yellowCards * 35000;
    const redCardFine = player.redCards * 50000;
    const totalFine = yellowCardFine + redCardFine;
    
    // Membuat pesan
    let message = `*INFORMASI PEMBAYARAN DENDA*\n\n`;
    message += `Nama Pemain: *${player.playerName}*\n`;
    message += `Tim: *${player.teamName}*\n\n`;
    message += `Detail Kartu:\n`;
    
    if (player.yellowCards > 0) {
      message += `Kartu Kuning: ${player.yellowCards} kartu\n`;
    }
    
    if (player.redCards > 0) {
      message += `Kartu Merah: ${player.redCards} kartu\n`;
    }
    
    message += `\nRincian Denda:\n`;
    
    if (player.yellowCards > 0) {
      message += `- Kartu Kuning: ${player.yellowCards} × Rp35.000 = Rp${yellowCardFine.toLocaleString('id-ID')}\n`;
    }
    
    if (player.redCards > 0) {
      message += `- Kartu Merah: ${player.redCards} × Rp50.000 = Rp${redCardFine.toLocaleString('id-ID')}\n`;
    }
    
    message += `\nTotal Denda: *Rp${totalFine.toLocaleString('id-ID')}*\n`;
    
    if (player.finePaid) {
      message += `Status Pembayaran: *Sudah Dibayar*\n`;
      message += `Tanggal Pembayaran: ${paymentDate}\n\n`;
    } else {
      message += `Status Pembayaran: *Belum Dibayar*\n\n`;
      message += `Mohon segera melakukan pembayaran denda kepada panitia.\n\n`;
    }
    
    message += `Status: ${player.isBanned ? '*Pemain dilarang bermain*' : 'Pemain aktif'}\n\n`;
    message += `Pertandingan Terakhir:\n`;
    message += `${player.teamName} vs ${player.opponentTeamName}\n`;
    message += `Waktu: ${player.matchDate} ${player.matchTime}\n\n`;

    // Tambahkan informasi pertandingan selanjutnya jika pemain dilarang
    if (player.isBanned && nextMatches[player.teamId]) {
      const nextMatch = nextMatches[player.teamId];
      message += `*PERTANDINGAN SELANJUTNYA*\n`;
      message += `${nextMatch.isHomeTeam 
        ? `${player.teamName} vs ${nextMatch.awayTeamName}`
        : `${nextMatch.homeTeamName} vs ${player.teamName}`}\n`;
      
      // Format tanggal pertandingan
      const matchDate = nextMatch.date instanceof Timestamp 
        ? formatDate(nextMatch.date.toDate())
        : '-';
      
      message += `Tanggal: ${matchDate}\n`;
      message += `Waktu: ${nextMatch.time || 'TBD'}\n`;
      if (nextMatch.venue) {
        message += `Venue: ${nextMatch.venue}\n`;
      }
      message += `\n⚠️ *PEMAIN DILARANG BERMAIN PADA PERTANDINGAN INI*\n\n`;
    }
    
    message += `_Informasi ini dikirim dari aplikasi Karta Cup V_`;
    
    // Encode pesan untuk URL
    const encodedMessage = encodeURIComponent(message);
    
    // Buka WhatsApp dengan pesan yang sudah disiapkan
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // Fungsi untuk mengambil pertandingan selanjutnya untuk tim dari pemain yang dilarang
  const fetchNextMatches = async () => {
    try {
      const bannedPlayersList = playerCards.filter(p => p.isBanned);
      const uniqueTeamIds = [...new Set(bannedPlayersList.map(player => player.teamId))];
      const matchesResult: {[key: string]: MatchData} = {};
      
      if (uniqueTeamIds.length === 0) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const matchesRef = collection(db, 'matches');
      // Ubah query untuk hanya mengambil pertandingan yang belum selesai
      const matchesQuery = query(
        matchesRef,
        where('status', '==', 'scheduled')
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      
      for (const teamId of uniqueTeamIds) {
        const teamMatches = matchesSnapshot.docs
          .map(doc => {
            const data = doc.data();
            const matchDate = parseDate(data.date);
            
            // Hanya proses jika tanggal valid dan tim terlibat dalam pertandingan
            if (matchDate && (data.homeTeamId === teamId || data.awayTeamId === teamId)) {
              return {
                id: doc.id,
                homeTeamId: data.homeTeamId,
                awayTeamId: data.awayTeamId,
                homeTeamName: data.homeTeamName,
                awayTeamName: data.awayTeamName,
                date: Timestamp.fromDate(matchDate),
                time: data.time || 'TBD',
                venue: data.venue,
                status: data.status,
                isHomeTeam: data.homeTeamId === teamId
              };
            }
            return null;
          })
          .filter(match => match !== null && match.date.toDate() >= today)
          .sort((a, b) => a!.date.toDate().getTime() - b!.date.toDate().getTime());

        if (teamMatches.length > 0) {
          matchesResult[teamId] = teamMatches[0]!;
        }
      }
      
      setNextMatches(matchesResult);
      
      if (Object.keys(matchesResult).length === 0 && uniqueTeamIds.length > 0) {
        toast({
          title: "Informasi",
          description: "Tidak ada pertandingan mendatang untuk tim dengan pemain yang dilarang",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error fetching next matches:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pertandingan selanjutnya",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Kartu & Larangan</h1>
      
      <Tabs defaultValue="yellow" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        {/* Mobile TabsList */}
        <TabsList className="md:hidden w-full overflow-x-auto flex whitespace-nowrap scrollbar-hide border-b border-gray-200 p-1 mb-4">
          <TabsTrigger value="yellow" className="flex-shrink-0 px-4">
            Kartu Kuning ({yellowCardPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="red" className="flex-shrink-0 px-4">
            Kartu Merah ({redCardPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="banned" className="flex-shrink-0 px-4">
            Larangan ({bannedPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex-shrink-0 px-4">
            Pembayaran ({paidFinePlayers.length})
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-shrink-0 px-4">
            Pendapatan Denda
          </TabsTrigger>
        </TabsList>

        {/* Desktop TabsList */}
        <TabsList className="hidden md:grid w-full grid-cols-5 gap-2">
          <TabsTrigger value="yellow" className="text-sm whitespace-normal h-auto py-2">
            Kartu Kuning ({yellowCardPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="red" className="text-sm whitespace-normal h-auto py-2">
            Kartu Merah ({redCardPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="banned" className="text-sm whitespace-normal h-auto py-2">
            Larangan ({bannedPlayers.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="text-sm whitespace-normal h-auto py-2">
            Pembayaran ({paidFinePlayers.length})
          </TabsTrigger>
          <TabsTrigger value="income" className="text-sm whitespace-normal h-auto py-2">
            Pendapatan Denda
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="yellow">
            <div className="grid gap-4">
              {yellowCardPlayers.map((player) => (
                <Card key={player.playerId} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{player.playerName}</h3>
                        {player.finePaid && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Denda Dibayar
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{player.teamName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Pertandingan:</span>
                        <span>{player.teamName} vs {player.opponentTeamName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Waktu:</span>
                        <span>{player.matchDate} {player.matchTime}</span>
                      </div>
                      {player.yellowCards >= 3 && (
                        <p className="text-sm text-amber-600">
                          Kartu Kuning: {player.yellowCards}
                        </p>
                      )}
                      {!player.isBanned && !player.finePaid && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-blue-600">
                            Denda: Rp{getCardAmount(player).toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(player)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Bayar Denda
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareToWhatsApp(player)}
                              className="flex items-center gap-1"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>Kirim Info</span>
                            </Button>
                          </div>
                        </div>
                      )}
                      {player.finePaid && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-600">
                            Denda sebesar Rp{player.fineAmount ? player.fineAmount.toLocaleString('id-ID') : 0} telah dibayar
                          </p>
                          <p className="text-xs text-gray-500">
                            Tanggal pembayaran: {player.finePaidDate ? new Date(player.finePaidDate).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePlayerCard(player.playerId, 'yellow', 'remove')}
                      >
                        -
                      </Button>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        {player.yellowCards}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePlayerCard(player.playerId, 'yellow', 'add')}
                      >
                        +
                      </Button>
                      <Button
                        variant={player.isBanned ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => togglePlayerBan(player.playerId)}
                        className={player.isBanned ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                      >
                        {player.isBanned ? "✓ Terlarang" : "Larang"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="red">
            <div className="grid gap-4">
              {redCardPlayers.map((player) => (
                <Card key={player.playerId} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{player.playerName}</h3>
                        {player.finePaid && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Denda Dibayar
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{player.teamName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Pertandingan:</span>
                        <span>{player.teamName} vs {player.opponentTeamName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Waktu:</span>
                        <span>{player.matchDate} {player.matchTime}</span>
                      </div>
                      {player.redCards > 0 && (
                        <p className="text-sm text-red-600">
                          Kartu Merah: {player.redCards}
                        </p>
                      )}
                      {!player.isBanned && !player.finePaid && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-blue-600">
                            Denda: Rp{getCardAmount(player).toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(player)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Bayar Denda
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareToWhatsApp(player)}
                              className="flex items-center gap-1"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>Kirim Info</span>
                            </Button>
                          </div>
                        </div>
                      )}
                      {player.finePaid && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-600">
                            Denda sebesar Rp{player.fineAmount ? player.fineAmount.toLocaleString('id-ID') : 0} telah dibayar
                          </p>
                          <p className="text-xs text-gray-500">
                            Tanggal pembayaran: {player.finePaidDate ? new Date(player.finePaidDate).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePlayerCard(player.playerId, 'red', 'remove')}
                      >
                        -
                      </Button>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                        {player.redCards}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePlayerCard(player.playerId, 'red', 'add')}
                      >
                        +
                      </Button>
                      <Button
                        variant={player.isBanned ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => togglePlayerBan(player.playerId)}
                        className={player.isBanned ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                      >
                        {player.isBanned ? "✓ Terlarang" : "Larang"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="banned">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Daftar Pemain Dilarang</h2>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={fetchNextMatches}
                className="flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                <span>Muat Ulang Jadwal</span>
              </Button>
            </div>
            <div className="grid gap-4">
              {bannedPlayers.map((player) => (
                <Card key={player.playerId} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{player.playerName}</h3>
                        {player.finePaid && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Denda Dibayar
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{player.teamName}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Pertandingan:</span>
                        <span>{player.teamName} vs {player.opponentTeamName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">Waktu:</span>
                        <span>{player.matchDate} {player.matchTime}</span>
                      </div>
                      {player.yellowCards >= 3 && (
                        <p className="text-sm text-amber-600">
                          Kartu Kuning: {player.yellowCards}
                        </p>
                      )}
                      {player.redCards > 0 && (
                        <p className="text-sm text-red-600">
                          Kartu Merah: {player.redCards}
                        </p>
                      )}
                      
                      {/* Tambahkan tombol bayar denda dan kirim info jika belum bayar */}
                      {!player.finePaid && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-blue-600">
                            Denda: Rp{getCardAmount(player).toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="sm"
                              onClick={() => openPaymentDialog(player)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Bayar Denda
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareToWhatsApp(player)}
                              className="flex items-center gap-1"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>Kirim Info</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Tampilkan informasi pembayaran jika sudah bayar */}
                      {player.finePaid && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-green-600">
                            Denda sebesar Rp{player.fineAmount ? player.fineAmount.toLocaleString('id-ID') : 0} telah dibayar
                          </p>
                          <p className="text-xs text-gray-500">
                            Tanggal pembayaran: {player.finePaidDate ? new Date(player.finePaidDate).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </div>
                      )}
                      
                      {/* Informasi lawan selanjutnya */}
                      {nextMatches[player.teamId] && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                          <p className="text-sm font-medium text-blue-800">Lawan Selanjutnya:</p>
                          <p className="text-sm font-semibold">
                            {nextMatches[player.teamId].isHomeTeam 
                              ? `${player.teamName} vs ${nextMatches[player.teamId].awayTeamName}`
                              : `${nextMatches[player.teamId].homeTeamName} vs ${player.teamName}`
                            }
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <span>Tanggal:</span>
                            <span>
                              {nextMatches[player.teamId].date instanceof Timestamp 
                                ? formatDate(nextMatches[player.teamId].date.toDate())
                                : '-'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <span>Waktu:</span>
                            <span>{nextMatches[player.teamId].time || 'TBD'}</span>
                          </div>
                          {nextMatches[player.teamId].venue && (
                            <div className="text-xs text-gray-600">
                              <span>Venue: {nextMatches[player.teamId].venue}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 mt-2">
                            <p className="text-xs font-medium text-red-600">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              Pemain dilarang bermain pada pertandingan ini
                            </p>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-blue-100">
                            <a href="/schedule">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Lihat Jadwal Pertandingan
                              </Button>
                            </a>
                          </div>
                        </div>
                      )}
                      {!nextMatches[player.teamId] && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-sm font-medium text-gray-700">
                            Tidak ada pertandingan selanjutnya yang dijadwalkan
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Tim ini memiliki pertandingan tapi tidak bisa ditampilkan karena:
                          </p>
                          <ul className="text-xs text-gray-500 mt-1 list-disc list-inside">
                            <li>Semua pertandingan tim ini memiliki status "completed"</li>
                            <li>Tanggal pertandingan di masa lalu ({new Date().toLocaleDateString('id-ID')})</li>
                            <li>Format tanggal pertandingan tidak valid di database</li>
                          </ul>
                          <div className="flex mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={fetchNextMatches}
                              className="text-xs flex items-center gap-1 mr-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                              Coba Lagi
                            </Button>
                            <a href="/schedule">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Lihat Jadwal Pertandingan
                              </Button>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePlayerCard(player.playerId, 'yellow', 'remove')}
                      >
                        -
                      </Button>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        {player.yellowCards}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updatePlayerCard(player.playerId, 'yellow', 'add')}
                      >
                        +
                      </Button>
                    <Button
                        variant={player.isBanned ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => togglePlayerBan(player.playerId)}
                        className={player.isBanned ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                    >
                        {player.isBanned ? "✓ Terlarang" : "Larang"}
                    </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="paid">
            <div className="grid gap-4">
              {paidFinePlayers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada pemain yang membayar denda</p>
                </div>
              ) : (
                paidFinePlayers.map((player) => (
                  <Card key={player.playerId} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{player.playerName}</h3>
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Denda Dibayar
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{player.teamName}</p>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                          <div>
                            <p className="text-xs font-medium text-gray-600">Kartu Kuning</p>
                            <p className="text-sm">{player.yellowCards}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Kartu Merah</p>
                            <p className="text-sm">{player.redCards}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Status</p>
                            <p className="text-sm">{player.isBanned ? 'Dilarang' : 'Aktif'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Tanggal Pembayaran</p>
                            <p className="text-sm">{player.finePaidDate ? new Date(player.finePaidDate).toLocaleDateString('id-ID') : '-'}</p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-2 rounded-md mt-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Total Denda</p>
                            <p className="text-sm font-bold text-green-600">
                              Rp{player.fineAmount ? player.fineAmount.toLocaleString('id-ID') : 0}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            <span className="font-medium">Rincian:</span>
                            {player.yellowCards > 0 && (
                              <span className="ml-1">Kartu Kuning: {player.yellowCards} × Rp35.000 = Rp{(player.yellowCards * 35000).toLocaleString('id-ID')}</span>
                            )}
                            {player.redCards > 0 && (
                              <span className="ml-1">{player.yellowCards > 0 ? ', ' : ''}Kartu Merah: {player.redCards} × Rp50.000 = Rp{(player.redCards * 50000).toLocaleString('id-ID')}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span className="font-medium">Pertandingan:</span>
                          <span>{player.teamName} vs {player.opponentTeamName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="font-medium">Waktu:</span>
                          <span>{player.matchDate} {player.matchTime}</span>
                        </div>
                        
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            onClick={() => shareToWhatsApp(player)}
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Bagikan via WhatsApp</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="income">
            <div className="grid gap-6">
              {/* Ringkasan Statistik */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Ringkasan Pendapatan Denda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Total Denda */}
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <p className="text-sm font-medium text-green-800">Total Denda Terbayar</p>
                      <p className="text-2xl font-bold text-green-700">
                        Rp{fineStats.totalPaidFine.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {fineStats.paidPlayers.length} pemain telah membayar denda
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <p className="text-sm font-medium text-red-800">Total Denda Belum Dibayar</p>
                      <p className="text-2xl font-bold text-red-700">
                        Rp{fineStats.totalUnpaidFine.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {fineStats.unpaidPlayers.length} pemain belum membayar denda
                      </p>
                    </div>
                  </div>

                  {/* Statistik Kartu */}
                  <div className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <p className="text-sm font-medium text-yellow-800">Statistik Kartu Kuning</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Total Kartu:</span>
                          <span className="font-medium">{fineStats.yellowCardStats.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sudah Bayar Denda:</span>
                          <span className="font-medium text-green-600">{fineStats.yellowCardStats.paid}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Belum Bayar Denda:</span>
                          <span className="font-medium text-red-600">{fineStats.yellowCardStats.unpaid}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-1 border-t border-yellow-200">
                          <span>Total Denda:</span>
                          <span>Rp{(fineStats.yellowCardStats.total * 35000).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <p className="text-sm font-medium text-red-800">Statistik Kartu Merah</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Total Kartu:</span>
                          <span className="font-medium">{fineStats.redCardStats.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Sudah Bayar Denda:</span>
                          <span className="font-medium text-green-600">{fineStats.redCardStats.paid}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Belum Bayar Denda:</span>
                          <span className="font-medium text-red-600">{fineStats.redCardStats.unpaid}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium pt-1 border-t border-red-200">
                          <span>Total Denda:</span>
                          <span>Rp{(fineStats.redCardStats.total * 50000).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Daftar Denda Terbayar */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Daftar Denda Terbayar</h3>
                <div className="space-y-4">
                  {fineStats.paidPlayers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada pemain yang membayar denda</p>
                  ) : (
                    fineStats.paidPlayers.map(player => (
                      <div key={player.playerId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{player.playerName}</h4>
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                                Lunas
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{player.teamName}</p>
                          </div>
                          <p className="text-sm font-medium text-green-600">
                            Rp{player.fineAmount?.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="font-medium">Kartu Kuning:</span> {player.yellowCards}
                            </div>
                            <div>
                              <span className="font-medium">Kartu Merah:</span> {player.redCards}
                            </div>
                            <div>
                              <span className="font-medium">Tanggal Bayar:</span>{' '}
                              {player.finePaidDate ? new Date(player.finePaidDate).toLocaleDateString('id-ID') : '-'}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>{' '}
                              <span className={player.isBanned ? 'text-red-600' : 'text-green-600'}>
                                {player.isBanned ? 'Dilarang Bermain' : 'Aktif'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Daftar Denda Belum Terbayar */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Daftar Denda Belum Terbayar</h3>
                <div className="space-y-4">
                  {fineStats.unpaidPlayers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Semua pemain sudah membayar denda</p>
                  ) : (
                    fineStats.unpaidPlayers.map(player => {
                      const totalFine = (player.yellowCards * 35000) + (player.redCards * 50000);
                      return (
                        <div key={player.playerId} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{player.playerName}</h4>
                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                  Belum Lunas
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{player.teamName}</p>
                            </div>
                            <p className="text-sm font-medium text-red-600">
                              Rp{totalFine.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium">Kartu Kuning:</span> {player.yellowCards}
                                {player.yellowCards > 0 && (
                                  <span className="text-xs text-gray-400 ml-1">
                                    (Rp{(player.yellowCards * 35000).toLocaleString('id-ID')})
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Kartu Merah:</span> {player.redCards}
                                {player.redCards > 0 && (
                                  <span className="text-xs text-gray-400 ml-1">
                                    (Rp{(player.redCards * 50000).toLocaleString('id-ID')})
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Status:</span>{' '}
                                <span className={player.isBanned ? 'text-red-600' : 'text-green-600'}>
                                  {player.isBanned ? 'Dilarang Bermain' : 'Aktif'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <Button
                                size="sm"
                                onClick={() => openPaymentDialog(player)}
                                className="bg-green-500 hover:bg-green-600 text-white mr-2"
                              >
                                Bayar Denda
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => shareToWhatsApp(player)}
                                className="flex items-center gap-1"
                              >
                                <Share2 className="h-4 w-4" />
                                <span>Kirim Info</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran Denda</DialogTitle>
            <DialogDescription>
              Anda akan memproses pembayaran denda untuk pemain ini.
            </DialogDescription>
          </DialogHeader>

          {selectedPlayer && (
            <div className="py-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-800 mb-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Nama Pemain:</span>
                    <span>{selectedPlayer.playerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tim:</span>
                    <span>{selectedPlayer.teamName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Kartu Kuning:</span>
                    <span>{selectedPlayer.yellowCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Kartu Merah:</span>
                    <span>{selectedPlayer.redCards}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-700 dark:text-blue-400 pt-2 border-t border-blue-100 dark:border-blue-800">
                    <span>Total Denda:</span>
                    <span>Rp{getCardAmount(selectedPlayer).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Dengan mengklik tombol "Bayar Sekarang", Anda mengkonfirmasi bahwa denda telah dibayar oleh pemain.
              </p>
            </div>
          )}

          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={handlePayFine}
            >
              Bayar Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 