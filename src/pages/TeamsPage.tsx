import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { groups } from "../lib/utils";
import { Plus, Shield, Users, Skull, UserX, Database, Flame } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Team } from "../types";
import { 
  getTeamsFromFirestore as getTeams,
  deleteAllTeamsFromFirestore,
  saveTeamToFirestore
} from "../lib/firestoreService";
import { TeamForm } from "../components/TeamForm";
import { PlayerForm } from "../components/PlayerForm";
import { useToast } from "../components/ui/use-toast";
import { TeamCard } from "../components/TeamCard";
import { initializeTeams } from "../lib/teamData";
import { DummyPlayersButton } from "../components/DummyPlayersButton";
import { Label } from "../components/ui/label";

const TeamsPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | undefined>(undefined);
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteAnswer, setDeleteAnswer] = useState("");
  const [isDeletePlayersDialogOpen, setIsDeletePlayersDialogOpen] = useState(false);
  const [deletePlayersAnswer, setDeletePlayersAnswer] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAddTeamConfirmOpen, setIsAddTeamConfirmOpen] = useState(false);
  const [addTeamAnswer, setAddTeamAnswer] = useState("");

  // Fungsi untuk mengambil data tim
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await getTeams(selectedGroup);
      const sortedTeams = [...teamsData].sort((a, b) => a.name.localeCompare(b.name));
      setTeams(sortedTeams);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil data tim",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load teams when selectedGroup changes
  useEffect(() => {
    fetchTeams();
  }, [selectedGroup]);

  const handleInitializeTeams = async () => {
    try {
      setIsInitializing(true);
      await initializeTeams(saveTeamToFirestore);
      toast({
        title: "Berhasil",
        description: "Data tim berhasil diinisialisasi",
      });
      fetchTeams();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menginisialisasi data tim",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDeleteAllTeams = async () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAllTeams = async () => {
    if (deleteAnswer.toLowerCase() !== "g 3 m a") {
      toast({
        title: "🔥 DOSA DITOLAK 🔥",
        description: "Mantra anda belum cukup kuat untuk masuk neraka",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const teamIds = teams.map(team => team.id);
      await deleteAllTeamsFromFirestore(teamIds);
      
      setTeams([]);
      setIsDeleteDialogOpen(false);
      setDeleteAnswer("");
      
      toast({
        title: "👿 SELAMAT DATANG DI NERAKA 👿",
        description: "Anda telah resmi menjadi penghuni neraka. Semoga betah! 🔥",
      });
    } catch (error: any) {
      toast({
        title: "😇 TOBAT DITERIMA 😇",
        description: "Sepertinya Tuhan masih sayang sama kamu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllPlayers = () => {
    setIsDeletePlayersDialogOpen(true);
  };

  const confirmDeleteAllPlayers = async () => {
    if (deletePlayersAnswer.toLowerCase() !== "g 3 m a") {
      toast({
        title: "🔥 DOSA DITOLAK 🔥",
        description: "Mantra anda belum cukup kuat untuk masuk neraka",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Update setiap tim dengan array pemain kosong
      const updatePromises = teams.map(team => {
        const updatedTeam = { ...team, players: [] };
        return saveTeamToFirestore(updatedTeam);
      });
      
      await Promise.all(updatePromises);
      
      // Refresh data
      await fetchTeams();
      
      setIsDeletePlayersDialogOpen(false);
      setDeletePlayersAnswer("");
      
      toast({
        title: "👿 SELAMAT DATANG DI NERAKA 👿",
        description: "Anda telah resmi menjadi penghuni neraka. Semoga betah! 🔥",
      });
    } catch (error) {
      console.error("Error deleting players:", error);
      toast({
        title: "😇 TOBAT DITERIMA 😇",
        description: "Sepertinya Tuhan masih sayang sama kamu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamClick = () => {
    setIsAddTeamConfirmOpen(true);
  };

  const confirmAddTeam = () => {
    if (addTeamAnswer.toLowerCase() !== "g 3 m a") {
      toast({
        title: "🎭 PENDAFTARAN DITOLAK 🎭",
        description: "Mantra pendaftaran tidak valid. Anda belum layak masuk neraka.",
        variant: "destructive",
      });
      return;
    }

    setIsAddTeamConfirmOpen(false);
    setAddTeamAnswer("");
    setSelectedTeam(undefined);
    setIsTeamFormOpen(true);
    
    toast({
      title: "😈 SELAMAT BERGABUNG DI NERAKA 😈",
      description: "Silakan isi data tim untuk memulai penderitaan abadi!",
    });
  };

  const handleTeamFormClose = (shouldRefresh?: boolean) => {
    setIsTeamFormOpen(false);
    if (shouldRefresh) {
      // Refresh data tim
      fetchTeams();
    }
  };

  const handlePlayerFormClose = (shouldRefresh?: boolean) => {
    setIsPlayerFormOpen(false);
    if (shouldRefresh) {
      fetchTeams();
    }
  };

  const handleAddPlayer = (team: Team) => {
    setSelectedTeam(team);
    setIsPlayerFormOpen(true);
  };

  if (loading) {
    return (
      <div className="container py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Memuat data tim...</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Manajemen Tim</h1>
          <p className="text-muted-foreground">
            Kelola tim dan pemain yang berpartisipasi dalam turnamen
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {teams.length === 0 ? (
            <>
              <Button variant="default" onClick={handleInitializeTeams} disabled={isInitializing}>
                <Database className="mr-2 h-4 w-4" /> 
                {isInitializing ? "Menginisialisasi..." : "Inisialisasi Data Tim"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" onClick={handleAddTeamClick}>
                <Plus className="mr-2 h-4 w-4" /> Tambah Tim
              </Button>
              
              <DummyPlayersButton onSuccess={fetchTeams} />
              
              {/* Hanya tampilkan tombol Hapus Semua Pemain jika ada pemain */}
              {teams.some(team => team.players && team.players.length > 0) && (
                <Button variant="destructive" onClick={handleDeleteAllPlayers}>
                  <UserX className="mr-2 h-4 w-4" /> Hapus Semua Pemain
                </Button>
              )}
              
              <Button variant="accent" onClick={handleDeleteAllTeams}>
                <Shield className="mr-2 h-4 w-4" /> Hapus Semua Tim
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Group Filter */}
      <div className="mb-6">
        <Tabs value={selectedGroup} onValueChange={setSelectedGroup}>
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">Semua Grup</TabsTrigger>
            {groups.map(group => (
              <TabsTrigger key={group} value={group}>
                Grup {group}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Teams List */}
      {teams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teams
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(team => (
              <TeamCard 
                key={team.id} 
                team={team}
                onAddPlayer={() => handleAddPlayer(team)}
                onPlayerDeleted={fetchTeams}
              />
            ))}
        </div>
      ) : (
        <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Belum ada tim</h3>
          <p className="text-muted-foreground mb-4">
            Belum ada tim yang terdaftar. Silakan klik tombol "Hapus Semua Tim" untuk menghapus semua tim atau "Tambah Tim" untuk membuat tim baru.
          </p>
          <Button variant="default" onClick={handleAddTeamClick}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Tim Baru
          </Button>
        </div>
      )}
      
      {/* Forms */}
      <Dialog open={isTeamFormOpen} onOpenChange={setIsTeamFormOpen}>
        <DialogContent aria-describedby="team-form-description">
          <DialogHeader>
            <DialogTitle>{selectedTeam ? "Edit Tim" : "Tambah Tim"}</DialogTitle>
            <DialogDescription id="team-form-description">
              {selectedTeam ? "Edit informasi tim yang sudah ada" : "Tambahkan tim baru ke turnamen"}
            </DialogDescription>
          </DialogHeader>
          <TeamForm 
            team={selectedTeam} 
            onClose={handleTeamFormClose}
            onSave={async (team) => {
              await saveTeamToFirestore(team);
              handleTeamFormClose(true);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPlayerFormOpen} onOpenChange={setIsPlayerFormOpen}>
        <DialogContent aria-describedby="player-form-description">
          <DialogHeader>
            <DialogTitle>Tambah Pemain</DialogTitle>
            <DialogDescription id="player-form-description">
              Tambahkan pemain baru ke tim {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <PlayerForm 
            team={selectedTeam!} 
            onClose={handlePlayerFormClose}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-black to-red-950 border-2 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex flex-col items-center gap-2 text-center text-2xl font-bold animate-pulse">
              <Skull className="h-12 w-12 text-red-600" strokeWidth={1.5} />
              🔥 PINTU NERAKA TERBUKA!!! 🔥
            </DialogTitle>
            <DialogDescription className="text-red-400/90 text-center pt-4 pb-2 font-semibold">
              Siap-siap masuk neraka! Semua tim akan hangus terbakar. Tidak ada jalan kembali setelah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center space-y-3">
              <Label htmlFor="delete-confirmation" className="text-center text-red-400 text-lg">
                Ucapkan mantra sihir:
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeleteAnswer(e.target.value)}
                className="text-center bg-black/50 border-2 border-red-800/50 focus:border-red-600 focus:ring-red-600 text-red-100 placeholder:text-red-900"
                placeholder="🔥 . . . 🔥"
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
                Bertobat
              </Button>
              <Button
                onClick={confirmDeleteAllTeams}
                className="bg-gradient-to-r from-red-800 to-red-950 hover:from-red-900 hover:to-red-950 text-red-100 border border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
              >
                Masuk Neraka
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Players Confirmation Dialog */}
      <Dialog open={isDeletePlayersDialogOpen} onOpenChange={setIsDeletePlayersDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-black to-red-950 border-2 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex flex-col items-center gap-2 text-center text-2xl font-bold animate-pulse">
              <Skull className="h-12 w-12 text-red-600" strokeWidth={1.5} />
              🔥 NERAKA PEMAIN DIBUKA!!! 🔥
            </DialogTitle>
            <DialogDescription className="text-red-400/90 text-center pt-4 pb-2 font-semibold">
              Siap-siap masuk neraka! Semua pemain akan hangus terbakar. Tidak ada jalan kembali setelah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center space-y-3">
              <Label htmlFor="delete-players-confirmation" className="text-center text-red-400 text-lg">
                Ucapkan mantra sihir:
              </Label>
              <Input
                id="delete-players-confirmation"
                value={deletePlayersAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeletePlayersAnswer(e.target.value)}
                className="text-center bg-black/50 border-2 border-red-800/50 focus:border-red-600 focus:ring-red-600 text-red-100 placeholder:text-red-900"
                placeholder="🔥 . . . 🔥"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDeletePlayersAnswer("");
                  setIsDeletePlayersDialogOpen(false);
                }}
                className="border-2 border-red-800 bg-black/30 text-red-500 hover:bg-red-950 hover:text-red-400 transition-all duration-300"
              >
                Bertobat
              </Button>
              <Button
                onClick={confirmDeleteAllPlayers}
                className="bg-gradient-to-r from-red-800 to-red-950 hover:from-red-900 hover:to-red-950 text-red-100 border border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
              >
                Masuk Neraka
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Team Confirmation Dialog */}
      <Dialog open={isAddTeamConfirmOpen} onOpenChange={setIsAddTeamConfirmOpen}>
        <DialogContent className="bg-gradient-to-b from-green-950 to-black border-2 border-green-800 shadow-[0_0_15px_rgba(34,197,94,0.5)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-green-500 flex flex-col items-center gap-2 text-center text-2xl font-bold animate-pulse">
              <Flame className="h-12 w-12 text-green-600 animate-bounce" strokeWidth={1.5} />
              ☠️ PENDAFTARAN CALON KORBAN ☠️
            </DialogTitle>
            <DialogDescription className="text-green-400/90 text-center pt-4 pb-2 font-semibold">
              Selamat datang di proses pendaftaran! Tim Anda akan segera menjadi korban eksperimen dalam arena pertandingan maut.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center space-y-3">
              <Label htmlFor="add-team-confirmation" className="text-center text-green-400 text-lg">
                Ucapkan mantra beracun:
              </Label>
              <Input
                id="add-team-confirmation"
                value={addTeamAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddTeamAnswer(e.target.value)}
                className="text-center bg-black/50 border-2 border-green-800/50 focus:border-green-600 focus:ring-green-600 text-green-100 placeholder:text-green-900"
                placeholder="☠️ . . . ☠️"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAddTeamAnswer("");
                  setIsAddTeamConfirmOpen(false);
                }}
                className="border-2 border-green-800 bg-black/30 text-green-500 hover:bg-green-950 hover:text-green-400 transition-all duration-300"
              >
                Kabur
              </Button>
              <Button
                onClick={confirmAddTeam}
                className="bg-gradient-to-r from-green-800 to-green-950 hover:from-green-900 hover:to-green-950 text-green-100 border border-green-700 shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] transition-all duration-300"
              >
                Jadi Korban
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsPage;
