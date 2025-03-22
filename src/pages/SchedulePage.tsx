import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Calendar, Trash2, Filter, RefreshCcw, Loader, Skull, Info } from 'lucide-react';
import {
  generateMatchSchedule,
  getTeamsFromFirestore as getTeams,
  deleteAllMatchesFromFirestore as deleteAllMatches,
  getMatchesFromFirestore as getMatches
} from "../lib/firestoreService";
import type { Match, Team } from "../types";
import DatePicker from '../components/DatePicker';
import MatchCard from '../components/MatchCard';
import { toast } from "../components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const FormulaExplanation = () => {
  return (
    <div className="space-y-6 text-sm p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950 rounded-xl">
      <h3 className="font-black text-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text text-center animate-pulse">
        🎮 PANDUAN LENGKAP RUMUS AJAIB 60 PERTANDINGAN 🎮
      </h3>
      
      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-xl border-2 border-purple-300 dark:border-purple-700 transform hover:scale-[1.02] transition-transform">
        <h4 className="font-bold text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2">
          📚 TUTORIAL: Pengenalan Sistem
        </h4>
        <div className="mt-2 space-y-2">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
            <p className="font-medium mb-2">Sistem Grup:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Total 24 Tim</li>
              <li>4 Grup (A, B, C, D)</li>
              <li>6 Tim per Grup</li>
              <li>Setiap tim bertemu sekali (single round robin)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-xl border-2 border-purple-300 dark:border-purple-700 transform hover:scale-[1.02] transition-transform">
        <h4 className="font-bold text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2">
          🧪 Level 1: Rumus Dasar Round Robin
        </h4>
        <div className="mt-2 space-y-2">
          <div className="font-mono bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
            <p className="text-lg font-bold mb-2">Rumus: n(n-1)/2</p>
            <p className="text-sm italic">Dimana:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>n = jumlah tim dalam satu grup (6 tim)</li>
              <li>n-1 = jumlah lawan untuk setiap tim (5 lawan)</li>
              <li>/2 = karena setiap pertandingan dihitung sekali</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-xl border-2 border-pink-300 dark:border-pink-700 transform hover:scale-[1.02] transition-transform">
        <h4 className="font-bold text-lg text-pink-700 dark:text-pink-400 flex items-center gap-2">
          🎲 Level 2: Perhitungan Detail
        </h4>
        <div className="space-y-3">
          <div className="font-mono bg-pink-100 dark:bg-pink-900/50 p-3 rounded-lg">
            <p className="font-bold mb-2">Langkah 1: Masukkan angka</p>
            <p>6(6-1)/2 = 6 × 5/2</p>
          </div>
          <div className="font-mono bg-pink-100 dark:bg-pink-900/50 p-3 rounded-lg">
            <p className="font-bold mb-2">Langkah 2: Kalikan</p>
            <p>6 × 5 = 30</p>
          </div>
          <div className="font-mono bg-pink-100 dark:bg-pink-900/50 p-3 rounded-lg">
            <p className="font-bold mb-2">Langkah 3: Bagi</p>
            <p>30/2 = 15 pertandingan per grup</p>
          </div>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-xl border-2 border-purple-300 dark:border-purple-700 transform hover:scale-[1.02] transition-transform">
        <h4 className="font-bold text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2">
          🎮 Level 3: Contoh Tim REMAJA PUTRA A
        </h4>
        <div className="mt-2 space-y-4">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
              Mari kita lihat jadwal pertandingan untuk tim REMAJA PUTRA A di Grup A sebagai contoh nyata sistem Round Robin.
            </p>
            
            <div className="space-y-6">
              <div className="border-l-4 border-yellow-400 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚽</span>
                  <div>
                    <h5 className="font-bold text-lg">REMAJA PUTRA A</h5>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Grup A - 5 Pertandingan</p>
                  </div>
                </div>
                <div className="bg-white/50 dark:bg-gray-900/50 p-3 rounded-lg">
                  <p className="font-medium mb-1">Jadwal Lengkap:</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Match 1: vs PALAPA A</li>
                    <li>Match 2: vs TOCXNET A</li>
                    <li>Match 3: vs PERU B</li>
                    <li>Match 4: vs LEMKA B</li>
                    <li>Match 5: vs PORBA JAYA A</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-gray-900/50 p-4 rounded-lg">
                <h6 className="font-bold mb-2">Analisis Jadwal:</h6>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  <li>REMAJA PUTRA A akan bermain melawan semua tim di Grup A</li>
                  <li>Total 5 pertandingan yang harus dimainkan</li>
                  <li>Setiap pertandingan hanya terjadi sekali (tidak ada leg kedua)</li>
                  <li>Jadwal tersebar merata sepanjang fase grup</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-xl border-2 border-pink-300 dark:border-pink-700 transform hover:scale-[1.02] transition-transform">
        <h4 className="font-bold text-lg text-pink-700 dark:text-pink-400 flex items-center gap-2">
          🏆 FINAL BOSS: Total Keseluruhan
        </h4>
        <div className="space-y-3 mt-2">
          <div className="bg-pink-100 dark:bg-pink-900/50 p-3 rounded-lg">
            <p className="font-bold mb-2">Perhitungan Total:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>15 pertandingan × 4 grup = 60 pertandingan total</li>
              <li>Setiap tim main 5 kali di fase grup</li>
              <li>Total 24 tim mendapat jadwal yang adil</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-xl border-2 border-purple-300 dark:border-purple-700 transform hover:scale-[1.02] transition-transform">
        <h4 className="font-bold text-lg text-purple-700 dark:text-purple-400 flex items-center gap-2">
          ⏰ Manajemen Waktu Super Detail
        </h4>
        <div className="space-y-3 mt-2">
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
            <p className="font-bold mb-2">Jadwal Harian:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Match 1: 13:30 - 14:35 (65 menit)</li>
              <li>Match 2: 14:45 - 15:50 (65 menit)</li>
              <li>Match 3: 16:00 - 17:05 (65 menit)</li>
              <li>Jeda antar pertandingan: 10 menit</li>
            </ul>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
            <p className="font-bold mb-2">Total Durasi:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>20 hari total turnamen</li>
              <li>3 pertandingan per hari</li>
              <li>Total waktu per hari: 3 jam 35 menit</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-purple-600 dark:text-purple-400 animate-bounce">
        🎮 Mission Complete! Achievement Unlocked: Master of Schedule 🏆
      </div>
    </div>
  );
};

const SchedulePage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [teams, setTeams] = useState<Team[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [tournamentStartDate, setTournamentStartDate] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteAnswer, setDeleteAnswer] = useState("");
  const [filteredDates, setFilteredDates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const allMatches = await getMatches();
        setMatches(allMatches.filter(match => match.date));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching matches:", error);
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await getTeams();
        setTeams(teamsData);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchTeams();
  }, []);

  // Filter and sort matches
  let filteredMatches = [...matches];

  if (selectedDate && selectedDate !== "all") {
    filteredMatches = filteredMatches.filter(match => match.date === selectedDate);
  }

  if (selectedTeam && selectedTeam !== "all") {
    filteredMatches = filteredMatches.filter(
      match => match.homeTeamId === selectedTeam || match.awayTeamId === selectedTeam
    );
  }

  if (selectedGroup && selectedGroup !== "all") {
    filteredMatches = filteredMatches.filter(match => match.groupId === selectedGroup);
  }

  // Group matches by date
  const matchesByDate = filteredMatches.reduce((groups, match) => {
    const date = match.date || '';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(match);
    // Sort matches by time within each day
    groups[date].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    return groups;
  }, {} as Record<string, Match[]>);

  useEffect(() => {
    // Sort dates
    const sortedDates = Object.keys(matchesByDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .filter(date => {
        if (!tournamentStartDate) return true;
        return new Date(date) >= new Date(tournamentStartDate);
      });

    setFilteredDates(sortedDates);
  }, [matches, selectedDate, selectedTeam, selectedGroup, tournamentStartDate]);

  const handleDeleteSchedule = async () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteAnswer !== "G 3 M A") {
      toast({
        title: "🪦 MASIH HIDUP! 🪦",
        description: "Nyawa jadwal-jadwal ini masih selamat... untuk saat ini.",
        variant: "destructive",
      });
      setDeleteAnswer("");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      setLoading(true);
      await deleteAllMatches();
      setMatches([]);
      toast({
        title: "💀 SELAMAT MENUJU ALAM KUBUR 💀",
        description: "Semua jadwal telah dimakamkan dengan khidmat. Semoga tenang di alam sana 🪦",
        variant: "destructive",
      });
      setLoading(false);
      setDeleteAnswer("");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "⚰️ GAGAL DIKUBUR ⚰️",
        description: "Nyawa jadwal terlalu kuat, ritual pemakaman gagal",
        variant: "destructive",
      });
      setLoading(false);
      setDeleteAnswer("");
      setIsDeleteDialogOpen(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedDate("all");
    setSelectedTeam("all");
    setSelectedGroup("all");
  };

  const handleGenerateSchedule = async () => {
    if (!tournamentStartDate) {
      toast({
        title: "Error",
        description: "Silakan pilih tanggal mulai turnamen",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    try {
      setLoading(true);
      await generateMatchSchedule(tournamentStartDate);
      const matchesData = await getMatches();

      setMatches(matchesData);
      toast({
        title: "Berhasil",
        description: `Berhasil membuat ${matchesData.length} jadwal pertandingan dimulai dari ${new Date(tournamentStartDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}`,
      });
      setShowStartDateModal(false); // Menutup modal setelah berhasil
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast({
        title: "Error",
        description: "Gagal membuat jadwal. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Jadwal Pertandingan</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFormulaInfo(true)}
              title="Informasi Rumus Perhitungan"
            >
              <Info className="h-4 w-4" />
            </Button>
            {matches.length === 0 ? (
              <Button
                onClick={() => setShowStartDateModal(true)}
                className="bg-primary hover:bg-primary/90 whitespace-normal h-auto py-2 text-xs sm:text-sm"
              >
                <Calendar className="mr-2 h-4 w-4 flex-shrink-0" /> Buat Jadwal Otomatis
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleDeleteSchedule}
                disabled={loading}
                className="whitespace-normal h-auto py-2 text-xs sm:text-sm"
              >
                <Trash2 className="mr-2 h-4 w-4 flex-shrink-0" /> Hapus Semua Jadwal
              </Button>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
            </Button>
            {showFilters && (
              <Button
                variant="ghost"
                onClick={handleResetFilters}
                className="flex items-center text-muted-foreground"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset Filter
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Tanggal</label>
                <DatePicker
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  matches={matches}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tim</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">Semua Tim</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Grup</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                >
                  <option value="all">Semua Grup</option>
                  <option value="A">Grup A</option>
                  <option value="B">Grup B</option>
                  <option value="C">Grup C</option>
                  <option value="D">Grup D</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Statistik</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Hari</h3>
            <p className="text-2xl font-bold">{Math.ceil(60 / 3)}</p>
            <p className="text-xs text-muted-foreground mt-1">3 pertandingan per hari</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Pertandingan per Tim</h3>
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground mt-1">Melawan semua tim dalam grup</p>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Jadwal Harian</h3>
            <p className="text-sm font-medium">13:30 - 14:35</p>
            <p className="text-sm font-medium">14:45 - 15:50</p>
            <p className="text-sm font-medium">16:00 - 17:05</p>
          </div>
        </div>
      </div>

      {/* Modal Pemilihan Tanggal Mulai */}
      <Dialog open={showStartDateModal} onOpenChange={setShowStartDateModal}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="start-date-description">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center pb-2">
              Mulai Turnamen Baru
            </DialogTitle>
            <DialogDescription id="start-date-description" className="text-center text-muted-foreground">
              Pilih tanggal untuk memulai turnamen. Jadwal pertandingan akan dibuat secara otomatis berdasarkan tanggal yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300">Total Pertandingan</h4>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">60 Match</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">15 per grup</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-300">Durasi</h4>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">20 Hari</p>
                <p className="text-sm text-green-600 dark:text-green-400">3 match per hari</p>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-4">
              <Label htmlFor="start-date" className="text-center block">Tanggal Mulai</Label>
              <input
                type="date"
                id="start-date"
                className="w-full p-3 border rounded-lg"
                value={tournamentStartDate}
                onChange={(e) => setTournamentStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowStartDateModal(false)}>
                Batal
              </Button>
              <Button onClick={handleGenerateSchedule} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Membuat Jadwal...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Buat Jadwal
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-black to-red-950 border-2 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex flex-col items-center gap-2 text-center text-2xl font-bold animate-pulse">
              <Skull className="h-12 w-12 text-red-600" strokeWidth={1.5} />
              ⚰️ SIAP-SIAP KE ALAM KUBUR !!! ⚰️
            </DialogTitle>
            <DialogDescription className="text-red-400/90 text-center pt-4 pb-2 font-semibold">
              Ritual pemakaman jadwal akan segera dimulai. Tidak ada jalan kembali setelah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center space-y-3">
              <Label htmlFor="deleteAnswer" className="text-center text-red-400 text-lg">
                Ucapkan mantra pemakaman:
              </Label>
              <Input
                id="deleteAnswer"
                value={deleteAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteAnswer(e.target.value)}
                className="text-center bg-black/50 border-2 border-red-800/50 focus:border-red-600 focus:ring-red-600 text-red-100 placeholder:text-red-900"
                placeholder="💀 . . . 💀"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeleteAnswer("");
                  setIsDeleteDialogOpen(false);
                }}
                className="border-2 border-red-800 bg-black/30 text-red-500 hover:bg-red-950 hover:text-red-400 transition-all duration-300"
              >
                Masih Sayang Nyawa
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="bg-gradient-to-r from-red-800 to-red-950 hover:from-red-900 hover:to-red-950 text-red-100 border border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
              >
                Kubur Sekarang
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFormulaInfo} onOpenChange={setShowFormulaInfo}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informasi Perhitungan Jadwal</DialogTitle>
          </DialogHeader>
          <FormulaExplanation />
        </DialogContent>
      </Dialog>

      {/* Schedule Display */}
      <div className="space-y-8">
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Belum Ada Jadwal</h3>
            <p className="text-muted-foreground">
              Klik tombol "Buat Jadwal Otomatis" untuk membuat jadwal pertandingan.
            </p>
          </div>
        ) : (
          filteredDates.map(date => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="border-b p-4 bg-primary/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">
                      {new Date(date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </h2>
                    <p className="text-sm font-medium text-primary/80">
                      ({(matchesByDate[date] || []).length} pertandingan)
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y">
                {(matchesByDate[date] || []).map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchedulePage;
