import { useEffect, useState } from 'react';
import { getTeams } from '../lib/firestoreService';
import { Standing, Team, Match } from '../types';
import { Info, Trophy, Medal, TrendingUp, TrendingDown, Minus, Save, Scale, Skull } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, onSnapshot, query, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Label,
} from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function StandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [groups, setGroups] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAnswer, setConfirmAnswer] = useState("");

  const saveStandingsToFirestore = async (standings: Standing[]) => {
    try {
      // Hapus semua data klasemen yang ada
      const standingsRef = collection(db, 'standings');
      const standingsSnapshot = await getDocs(standingsRef);
      const deletePromises = standingsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Simpan data klasemen baru
      const promises = standings.map(standing => {
        const docRef = doc(collection(db, 'standings'));  // Buat ID baru
        return setDoc(docRef, {
          ...standing,
          lastUpdated: serverTimestamp()  // Tambah timestamp
        });
      });

      await Promise.all(promises);
      console.log('Standings saved to Firestore');
    } catch (error) {
      console.error('Error saving standings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan data klasemen",
      });
    }
  };

  const calculateStandings = (matches: Match[], teams: Team[]) => {
    const standingsMap = new Map<string, Standing>();

    // Initialize standings for all teams
    teams.forEach(team => {
      standingsMap.set(team.id, {
        id: team.id,
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        groupId: team.groupId
      });
    });

    // Calculate standings from completed matches
    matches.forEach(match => {
      if (match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined) {
        const homeTeam = standingsMap.get(match.homeTeamId);
        const awayTeam = standingsMap.get(match.awayTeamId);

        if (homeTeam && awayTeam) {
          // Update matches played
          homeTeam.matchesPlayed++;
          awayTeam.matchesPlayed++;

          // Update goals
          homeTeam.goalsFor += match.homeScore;
          homeTeam.goalsAgainst += match.awayScore;
          awayTeam.goalsFor += match.awayScore;
          awayTeam.goalsAgainst += match.homeScore;

          // Update goal difference
          homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
          awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

          // Update wins, draws, losses and points
          if (match.homeScore > match.awayScore) {
            homeTeam.wins++;
            awayTeam.losses++;
            homeTeam.points += 3;
          } else if (match.homeScore < match.awayScore) {
            awayTeam.wins++;
            homeTeam.losses++;
            awayTeam.points += 3;
          } else {
            homeTeam.draws++;
            awayTeam.draws++;
            homeTeam.points += 1;
            awayTeam.points += 1;
          }
        }
      }
    });

    return Array.from(standingsMap.values());
  };

  const handleManualSave = async () => {
    setIsConfirmDialogOpen(true);
  };

  const confirmSave = async () => {
    if (confirmAnswer.toLowerCase() !== "g 3 m a") {
      toast({
        title: "⚖️ PENGADILAN DITOLAK ⚖️",
        description: "Mantra pengadilan tidak valid. Nasib tim-tim ini masih menggantung...",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await saveStandingsToFirestore(standings);
      toast({
        title: "⚔️ VONIS TELAH DIJATUHKAN ⚔️",
        description: "Nasib semua tim telah diputuskan. Tidak ada jalan untuk kembali!",
      });
      setIsConfirmDialogOpen(false);
      setConfirmAnswer("");
    } catch (error) {
      console.error('Error saving standings:', error);
      toast({
        variant: "destructive",
        title: "🏛️ PENGADILAN GAGAL 🏛️",
        description: "Para terdakwa berhasil melarikan diri dari ruang sidang!",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teamsData] = await Promise.all([
          getTeams()
        ]);

        // Extract unique groups and sort them
        const uniqueGroups = Array.from(new Set(teamsData.map(team => team.groupId)))
          .sort((a, b) => a.localeCompare(b));
        setGroups(uniqueGroups);
        setTeams(teamsData);

        // Set up realtime listeners
        const matchesQuery = query(collection(db, 'matches'));
        const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
          const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Match[];
          
          // Calculate standings from matches
          const calculatedStandings = calculateStandings(matchesData, teamsData);

          // Sort standings by points, goal difference, and goals for
          const sortedStandings = calculatedStandings.sort((a, b) => {
            if (a.points !== b.points) {
              return b.points - a.points;
            }
            if (a.goalDifference !== b.goalDifference) {
              return b.goalDifference - a.goalDifference;
            }
            return b.goalsFor - a.goalsFor;
          });

          // Update standings state
          setStandings(sortedStandings);
        });

        setLoading(false);

        // Cleanup listener on unmount
        return () => {
          unsubscribeMatches();
        };
      } catch (err) {
        setError('Gagal memuat data klasemen');
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPositionIndicator = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="font-medium">{position}</span>;
  };

  const getTeamLogo = (teamName: string) => {
    const team = teams.find(t => t.name === teamName);
    return team?.logo || '/team-placeholder.png';
  };

  const getTeamForm = (standing: Standing) => {
    const total = standing.wins + standing.draws + standing.losses;
    const winPercentage = (standing.wins / total) * 100;
    const drawPercentage = (standing.draws / total) * 100;

    return (
      <div className="flex items-center gap-2">
        <div className="w-24 h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${winPercentage}%` }}
          />
          <div
            className="h-full bg-yellow-500"
            style={{ width: `${drawPercentage}%`, marginTop: '-2px' }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {winPercentage.toFixed(0)}% Menang
        </span>
      </div>
    );
  };

  const getGoalDifferenceDisplay = (standing: Standing) => {
    const { goalDifference, goalsFor, goalsAgainst } = standing;
    return (
      <div className="flex items-center justify-center gap-1">
        <span className={`
          inline-flex items-center gap-1
          ${goalDifference > 0 ? 'text-green-600' : ''}
          ${goalDifference < 0 ? 'text-red-600' : ''}
        `}>
          {goalDifference > 0 && '+'}
          {goalDifference}
          {goalDifference > 0 && <TrendingUp className="w-4 h-4" />}
          {goalDifference < 0 && <TrendingDown className="w-4 h-4" />}
          {goalDifference === 0 && <Minus className="w-4 h-4" />}
        </span>
        <span className="text-xs text-gray-500">
          ({goalsFor}-{goalsAgainst})
        </span>
      </div>
    );
  };

  const filteredStandings = selectedGroup === 'all'
    ? standings
    : standings.filter(s => {
      const team = teams.find(t => t.name === s.teamName);
      return team?.groupId === selectedGroup;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Klasemen</h1>
          <p className="text-gray-500">Kompetisi Turnamen Sepak Bola KARTA CUP V</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleManualSave}
            disabled={isSaving || standings.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Menyimpan..." : "Update Klasemen"}
          </Button>

          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Pilih Grup" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Grup</SelectItem>
              {groups.map(group => (
                <SelectItem key={group} value={group}>
                  Grup {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">Keterangan Klasemen</CardTitle>
          </div>
          <CardDescription>
            Sistem Poin: 3 poin untuk menang, 1 untuk seri, 0 untuk kalah. Urutan peringkat ditentukan berdasarkan: Poin → SG (Selisih Gol) → GM (Gol Memasukkan) → Head-to-Head
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">Menang (3 poin)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-sm">Seri (1 poin)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-sm">Kalah (0 poin)</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm">Selisih Gol Positif</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Pos</th>
                  <th className="px-4 py-3 text-left">Tim</th>
                  <th className="px-4 py-3 text-center">JM</th>
                  <th className="px-4 py-3 text-center">M</th>
                  <th className="px-4 py-3 text-center">S</th>
                  <th className="px-4 py-3 text-center">K</th>
                  <th className="px-4 py-3 text-center">GM</th>
                  <th className="px-4 py-3 text-center">GK</th>
                  <th className="px-4 py-3 text-center">SG</th>
                  <th className="px-4 py-3 text-center">Performa</th>
                  <th className="px-4 py-3 text-center">Poin</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandings.map((standing, index) => (
                  <tr
                    key={standing.id}
                    className={`
                      border-b hover:bg-gray-50 transition-colors
                      ${index < 3 ? 'bg-gray-50' : ''}
                    `}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center w-8">
                        {getPositionIndicator(index + 1)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={getTeamLogo(standing.teamName)}
                          alt={standing.teamName}
                          className="w-8 h-8 object-contain"
                        />
                        <span className="font-medium">{standing.teamName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{standing.matchesPlayed}</td>
                    <td className="px-4 py-3 text-center text-green-600">{standing.wins}</td>
                    <td className="px-4 py-3 text-center text-yellow-600">{standing.draws}</td>
                    <td className="px-4 py-3 text-center text-red-600">{standing.losses}</td>
                    <td className="px-4 py-3 text-center">{standing.goalsFor}</td>
                    <td className="px-4 py-3 text-center">{standing.goalsAgainst}</td>
                    <td className="px-4 py-3 text-center">
                      {getGoalDifferenceDisplay(standing)}
                    </td>
                    <td className="px-4 py-3">
                      {getTeamForm(standing)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-lg">{standing.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Save Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-blue-950 to-black border-2 border-blue-800 shadow-[0_0_15px_rgba(59,130,246,0.5)] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-blue-400 flex flex-col items-center gap-2 text-center text-2xl font-bold">
              <div className="relative">
                <Scale className="h-12 w-12 text-blue-500 animate-pulse" strokeWidth={1.5} />
                <Skull className="h-6 w-6 text-blue-300 absolute -bottom-2 -right-2 animate-bounce" strokeWidth={1.5} />
              </div>
              ⚖️ PENGADILAN TERAKHIR ⚖️
            </DialogTitle>
            <DialogDescription className="text-blue-300/90 text-center pt-4 pb-2 font-semibold">
              Sidang penentuan nasib akan dimulai! Semua tim akan diadili dan nasib mereka akan ditentukan untuk selamanya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex flex-col items-center space-y-3">
              <Label htmlFor="save-confirmation" className="text-center text-blue-400 text-lg">
                Ucapkan mantra keadilan:
              </Label>
              <Input
                id="save-confirmation"
                value={confirmAnswer}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmAnswer(e.target.value)}
                className="text-center bg-black/50 border-2 border-blue-800/50 focus:border-blue-600 focus:ring-blue-600 text-blue-100 placeholder:text-blue-900"
                placeholder="⚖️ . . . ⚖️"
              />
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setConfirmAnswer("");
                  setIsConfirmDialogOpen(false);
                }}
                className="border-2 border-blue-800 bg-black/30 text-blue-500 hover:bg-blue-950 hover:text-blue-400 transition-all duration-300"
              >
                Tunda Sidang
              </Button>
              <Button
                onClick={confirmSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-800 to-blue-950 hover:from-blue-900 hover:to-blue-950 text-blue-100 border border-blue-700 shadow-[0_0_10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300"
              >
                {isSaving ? "Memvonis..." : "Jatuhkan Vonis"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
