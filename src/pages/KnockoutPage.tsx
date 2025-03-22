import { useEffect, useState } from "react";
import { KnockoutMatch, KnockoutStage } from "@/types/knockout";
import { KnockoutBracket } from "../components/KnockoutBracket";
import { KnockoutMatchDialog } from "../components/KnockoutMatchDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { db } from "@/lib/firebase";
import { setupKnockoutStage, setQualifiedTeams as setKnockoutTeams, deleteQuarterFinalMatches } from "@/lib/firestoreService";
import { Standing } from "@/types";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skull } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function KnockoutPage() {
  const [knockoutStage, setKnockoutStage] = useState<KnockoutStage>({
    quarterFinals: [],
    semiFinals: [],
    final: [],
  });
  const [selectedMatch, setSelectedMatch] = useState<KnockoutMatch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isSettingTeams, setIsSettingTeams] = useState(false);
  const [qualifiedTeams, setQualifiedTeams] = useState<Record<string, Standing[]>>({});
  const [isDeletingQF, setIsDeletingQF] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAnswer, setConfirmAnswer] = useState("");

  useEffect(() => {
    fetchKnockoutMatches();
    fetchQualifiedTeams();
  }, []);

  const fetchQualifiedTeams = async () => {
    try {
      const standingsRef = collection(db, "standings");
      const standingsSnapshot = await getDocs(standingsRef);
      const standings = standingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Standing[];

      // Kelompokkan standings berdasarkan grup
      const groupedStandings = standings.reduce((acc, standing) => {
        if (!acc[standing.groupId]) {
          acc[standing.groupId] = [];
        }
        acc[standing.groupId].push(standing);
        return acc;
      }, {} as Record<string, Standing[]>);

      // Urutkan tim di setiap grup berdasarkan poin, selisih gol, dan gol
      Object.values(groupedStandings).forEach(group => {
        group.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsFor - a.goalsFor;
        });
      });

      setQualifiedTeams(groupedStandings);
    } catch (error) {
      console.error("Error fetching standings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data klasemen",
      });
    }
  };

  const fetchKnockoutMatches = async () => {
    try {
      const matchesRef = collection(db, "matches");
      const quarterFinalsQuery = query(
        matchesRef,
        where("round", "==", "QUARTER")
      );
      const semiFinalsQuery = query(matchesRef, where("round", "==", "SEMI"));
      const finalQuery = query(matchesRef, where("round", "==", "FINAL"));

      const [quarterDocs, semiDocs, finalDocs] = await Promise.all([
        getDocs(quarterFinalsQuery),
        getDocs(semiFinalsQuery),
        getDocs(finalQuery),
      ]);

      const quarterFinals: KnockoutMatch[] = [];
      const semiFinals: KnockoutMatch[] = [];
      const final: KnockoutMatch[] = [];

      quarterDocs.forEach((doc) => {
        quarterFinals.push({ id: doc.id, ...doc.data() } as KnockoutMatch);
      });

      semiDocs.forEach((doc) => {
        semiFinals.push({ id: doc.id, ...doc.data() } as KnockoutMatch);
      });

      finalDocs.forEach((doc) => {
        final.push({ id: doc.id, ...doc.data() } as KnockoutMatch);
      });

      setKnockoutStage({
        quarterFinals: quarterFinals.sort((a, b) => a.matchNumber - b.matchNumber),
        semiFinals: semiFinals.sort((a, b) => a.matchNumber - b.matchNumber),
        final: final.sort((a, b) => a.matchNumber - b.matchNumber),
      });
    } catch (error) {
      console.error("Error fetching knockout matches:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal memuat data pertandingan knockout",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatchClick = (match: KnockoutMatch) => {
    setSelectedMatch(match);
    setIsDialogOpen(true);
  };

  const handleSetupKnockoutClick = () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmSetupKnockout = async () => {
    if (confirmAnswer.toLowerCase() !== "g 3 m a") {
      toast({
        title: "⚰️ EKSEKUSI DITUNDA ⚰️",
        description: "Mantra eksekusi tidak valid. Para tahanan masih diberi kesempatan hidup.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSettingUp(true);
      await setupKnockoutStage();
      await fetchKnockoutMatches();
      toast({
        title: "💀 EKSEKUSI BERHASIL 💀",
        description: "Semua tim telah masuk ke dalam arena pertarungan maut!",
      });
      setIsConfirmDialogOpen(false);
      setConfirmAnswer("");
    } catch (error) {
      console.error("Error setting up knockout stage:", error);
      toast({
        variant: "destructive",
        title: "🪦 EKSEKUSI GAGAL 🪦",
        description: "Para tahanan berhasil melarikan diri dari arena pertarungan",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleSetQualifiedTeams = async () => {
    try {
      setIsSettingTeams(true);
      // Pastikan ada pertandingan perempat final terlebih dahulu
      if (knockoutStage.quarterFinals.length === 0) {
        await setupKnockoutStage();
      }
      await setKnockoutTeams();
      await fetchKnockoutMatches();
      toast({
        title: "Berhasil",
        description: "Tim yang lolos berhasil diatur",
      });
    } catch (error) {
      console.error("Error setting qualified teams:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengatur tim yang lolos",
      });
    } finally {
      setIsSettingTeams(false);
    }
  };

  const handleDeleteQuarterFinals = async () => {
    try {
      setIsDeletingQF(true);
      await deleteQuarterFinalMatches();
      await fetchKnockoutMatches();
      toast({
        title: "Berhasil",
        description: "Pertandingan perempat final berhasil dihapus",
      });
      setShowDeleteConfirm(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Gagal menghapus pertandingan perempat final",
      });
    } finally {
      setIsDeletingQF(false);
    }
  };

  const handleSaveMatch = async (updatedMatch: KnockoutMatch) => {
    try {
      const matchRef = doc(db, "matches", updatedMatch.id);
      await updateDoc(matchRef, {
        homeScore: updatedMatch.homeScore,
        awayScore: updatedMatch.awayScore,
        status: updatedMatch.status,
        winner: updatedMatch.winner,
        date: updatedMatch.date,
        time: updatedMatch.time,
        venue: updatedMatch.venue,
      });

      // Update state
      setKnockoutStage((prev) => {
        const newStage = { ...prev };
        if (updatedMatch.round === "QUARTER") {
          newStage.quarterFinals = prev.quarterFinals.map((m) =>
            m.id === updatedMatch.id ? updatedMatch : m
          );
        } else if (updatedMatch.round === "SEMI") {
          newStage.semiFinals = prev.semiFinals.map((m) =>
            m.id === updatedMatch.id ? updatedMatch : m
          );
        } else if (updatedMatch.round === "FINAL") {
          newStage.final = prev.final.map((m) =>
            m.id === updatedMatch.id ? updatedMatch : m
          );
        }
        return newStage;
      });

      toast({
        title: "Berhasil",
        description: "Hasil pertandingan berhasil disimpan",
      });

      // If there's a next match, update the teams
      if (updatedMatch.nextMatchNumber && updatedMatch.winner) {
        let nextMatch: KnockoutMatch | undefined;

        // Find the next match in semi-finals or final
        if (updatedMatch.round === "QUARTER") {
          nextMatch = knockoutStage.semiFinals.find(
            (m) => m.matchNumber === updatedMatch.nextMatchNumber
          );
        } else if (updatedMatch.round === "SEMI") {
          nextMatch = knockoutStage.final.find(
            (m) => m.matchNumber === updatedMatch.nextMatchNumber
          );
        }

        if (nextMatch) {
          const nextMatchRef = doc(db, "matches", nextMatch.id);
          const isHomeTeam = nextMatch.matchNumber % 2 === 1;
          await updateDoc(nextMatchRef, {
            ...(isHomeTeam
              ? {
                  homeTeamId: updatedMatch.winner.id,
                  homeTeamName: updatedMatch.winner.name,
                }
              : {
                  awayTeamId: updatedMatch.winner.id,
                  awayTeamName: updatedMatch.winner.name,
                }),
          });

          // Refresh matches to show updated teams
          await fetchKnockoutMatches();
        }
      }
    } catch (error) {
      console.error("Error saving match result:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan hasil pertandingan",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasKnockoutMatches =
    knockoutStage.quarterFinals.length > 0 ||
    knockoutStage.semiFinals.length > 0 ||
    knockoutStage.final.length > 0;

  const hasQualifiedTeams = knockoutStage.quarterFinals.some(
    (match) => match.homeTeamId && match.awayTeamId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Babak Knockout</h1>
        <div className="space-x-2">
          {!hasKnockoutMatches && (
            <Button onClick={handleSetupKnockoutClick} disabled={isSettingUp}>
              {isSettingUp ? "Mempersiapkan Arena..." : "Setup Babak Knockout"}
            </Button>
          )}
          {hasKnockoutMatches && !hasQualifiedTeams && (
            <Button onClick={handleSetQualifiedTeams} disabled={isSettingTeams}>
              {isSettingTeams ? "Mengatur..." : "Atur Tim yang Lolos"}
            </Button>
          )}
          {hasQualifiedTeams && (
            <Button 
              onClick={() => setShowDeleteConfirm(true)} 
              disabled={isDeletingQF}
              variant="destructive"
            >
              {isDeletingQF ? "Menghapus..." : "Hapus Semua Pertandingan Knockout"}
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua pertandingan knockout (perempat final, semifinal, dan final) dan tidak dapat dibatalkan.
              Semua data pertandingan knockout akan hilang secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuarterFinals}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingQF ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Setup Knockout Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-black to-red-950 border-2 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.5)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex flex-col items-center gap-2 text-center text-2xl font-bold animate-pulse">
              <Skull className="h-12 w-12 text-red-600" strokeWidth={1.5} />
              ⚰️ SIAP-SIAP KE ARENA MAUT !!! ⚰️
            </DialogTitle>
            <DialogDescription className="text-red-400/90 text-center pt-4 pb-2 font-semibold">
              Ritual eksekusi akan dimulai! Semua tim akan masuk ke arena pertarungan maut. Tidak ada jalan kembali setelah ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center space-y-3">
              <Label htmlFor="setup-confirmation" className="text-center text-red-400 text-lg">
                Ucapkan mantra eksekusi:
              </Label>
              <Input
                id="setup-confirmation"
                value={confirmAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmAnswer(e.target.value)}
                className="text-center bg-black/50 border-2 border-red-800/50 focus:border-red-600 focus:ring-red-600 text-red-100 placeholder:text-red-900"
                placeholder="💀 . . . 💀"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setConfirmAnswer("");
                  setIsConfirmDialogOpen(false);
                }}
                className="border-2 border-red-800 bg-black/30 text-red-500 hover:bg-red-950 hover:text-red-400 transition-all duration-300"
              >
                Tunda Eksekusi
              </Button>
              <Button
                onClick={confirmSetupKnockout}
                className="bg-gradient-to-r from-red-800 to-red-950 hover:from-red-900 hover:to-red-950 text-red-100 border border-red-700 shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-300"
              >
                Mulai Eksekusi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Informasi Tim yang Lolos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(qualifiedTeams)
          .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
          .map(([groupId, teams]) => (
            <div key={groupId} className="p-4 border rounded-lg shadow-sm">
              <h3 className="font-semibold mb-3 text-lg border-b pb-2">
                Grup {groupId.replace('group', '')}
              </h3>
              <div className="space-y-3">
                {teams.slice(0, 2).map((team, index) => (
                  <div
                    key={team.teamId}
                    className={`flex items-center justify-between p-3 rounded ${
                      index === 0 
                        ? 'bg-yellow-50 border border-yellow-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span className="font-medium">{team.teamName}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      index === 0 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {index === 0 ? "Winner" : "Runner-up"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {hasKnockoutMatches ? (
        <KnockoutBracket
          knockoutStage={knockoutStage}
          onMatchClick={handleMatchClick}
        />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Belum ada pertandingan knockout. Klik tombol "Setup Babak Knockout" untuk memulai.
          </p>
        </div>
      )}

      {selectedMatch && (
        <KnockoutMatchDialog
          match={selectedMatch}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedMatch(null);
          }}
          onSave={handleSaveMatch}
        />
      )}
    </div>
  );
} 