import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Trophy, Star, Shield, Medal, CircleDot, Goal, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { getGoalsFromFirestore, getMatchesFromFirestore, getTeamsFromFirestore } from '../lib/firestoreService';
import type { Match as MatchType } from '../types';
import { toast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";

interface PlayerStats {
  id: string;
  name: string;
  teamName: string;
  position?: string;
  goals: number;
  assists: number;
  cleanSheets: number;
  matchesPlayed: number;
  rating: number;
  goalPoints: number;
  assistPoints: number;
  matchPoints: number;
  totalPoints: number;
  yellowCards: number;
  redCards: number;
  cardPoints: number;
}

export default function AwardsPage() {
  const [topScorers, setTopScorers] = useState<PlayerStats[]>([]);
  const [bestPlayers, setBestPlayers] = useState<PlayerStats[]>([]);
  const [bestKeepers, setBestKeepers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBestPlayerPoints, setShowBestPlayerPoints] = useState(false);
  const [showBestKeeperPoints, setShowBestKeeperPoints] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [goals, matches, teams] = await Promise.all([
          getGoalsFromFirestore(),
          getMatchesFromFirestore(),
          getTeamsFromFirestore()
        ]);

        // Proses data untuk top scorers dan pemain terbaik
        const scorersMap = new Map<string, PlayerStats>();
        goals.forEach(goal => {
          if (!scorersMap.has(goal.playerId)) {
            scorersMap.set(goal.playerId, {
              id: goal.playerId,
              name: goal.playerName,
              teamName: goal.teamName,
              goals: 0,
              assists: 0,
              cleanSheets: 0,
              matchesPlayed: 0,
              rating: 0,
              goalPoints: 0,
              assistPoints: 0,
              matchPoints: 0,
              totalPoints: 0,
              yellowCards: 0,
              redCards: 0,
              cardPoints: 0
            });
          }
          const player = scorersMap.get(goal.playerId)!;
          player.goals += 1;
          player.goalPoints = player.goals * 3; // 3 poin per gol
        });

        // Hitung poin dari pertandingan dan kartu
        matches.forEach((match: MatchType) => {
          if (match.status === 'completed') {
            const homeTeamPlayers = teams.find(t => t.id === match.homeTeamId)?.players || [];
            const awayTeamPlayers = teams.find(t => t.id === match.awayTeamId)?.players || [];

            // Berikan poin untuk pemain yang bermain
            [...homeTeamPlayers, ...awayTeamPlayers].forEach(player => {
              if (scorersMap.has(player.id)) {
                const playerStats = scorersMap.get(player.id)!;
                playerStats.matchesPlayed += 1;
                playerStats.matchPoints += 1; // 1 poin per pertandingan
                
                // Bonus poin untuk tim yang menang
                if (match.homeScore > match.awayScore && homeTeamPlayers.some(p => p.id === player.id)) {
                  playerStats.matchPoints += 2; // 2 poin bonus untuk menang
                } else if (match.awayScore > match.homeScore && awayTeamPlayers.some(p => p.id === player.id)) {
                  playerStats.matchPoints += 2; // 2 poin bonus untuk menang
                } else if (match.homeScore === match.awayScore) {
                  playerStats.matchPoints += 1; // 1 poin bonus untuk seri
                }

                // Hitung kartu kuning dan merah
                const isHomeTeamPlayer = homeTeamPlayers.some(p => p.id === player.id);
                const playerCards = isHomeTeamPlayer ? match.cards.home : match.cards.away;
                
                playerCards.forEach(card => {
                  if (card.playerId === player.id) {
                    if (card.type === 'yellow') {
                      playerStats.yellowCards += 1;
                      playerStats.cardPoints -= 1; // -1 poin untuk kartu kuning
                    } else if (card.type === 'red') {
                      playerStats.redCards += 1;
                      playerStats.cardPoints -= 3; // -3 poin untuk kartu merah
                    }
                  }
                });
              }
            });
          }
        });

        // Hitung total poin dan sort
        const bestPlayersList = Array.from(scorersMap.values())
          .map(player => ({
            ...player,
            totalPoints: player.goalPoints + player.assistPoints + player.matchPoints + player.cardPoints
          }))
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 10);

        // Inisialisasi data kiper
        const keepersMap = new Map<string, PlayerStats>();

        const isGoalkeeper = (position?: string) => {
          if (!position) return false;
          const pos = position.toLowerCase().trim();
          return ['goalkeeper', 'kiper', 'penjaga gawang', 'gk', 'kipper'].includes(pos);
        };

        teams.forEach(team => {
          team.players
            .filter(player => isGoalkeeper(player.position)) // Pastikan hanya kiper
            .forEach(player => {
              keepersMap.set(player.id, {
                id: player.id,
                name: player.name,
                teamName: team.name,
                position: player.position, // Tambahkan posisi
                goals: 0,
                assists: 0,
                cleanSheets: 0,
                matchesPlayed: 0,
                rating: 0,
                goalPoints: 0,
                assistPoints: 0,
                matchPoints: 0,
                totalPoints: 0,
                yellowCards: 0,
                redCards: 0,
                cardPoints: 0
              });
            });
        });

        // Hitung statistik kiper dari pertandingan
        matches.forEach(match => {
          if (match.status === 'completed') {
            const homeTeam = teams.find(t => t.id === match.homeTeamId);
            const awayTeam = teams.find(t => t.id === match.awayTeamId);
            
            // Cari kiper dari kedua tim
            const homeKeepers = homeTeam?.players.filter(p => isGoalkeeper(p.position)) || [];
            const awayKeepers = awayTeam?.players.filter(p => isGoalkeeper(p.position)) || [];

            // Update statistik kiper tim tuan rumah
            homeKeepers.forEach(keeper => {
              if (keepersMap.has(keeper.id)) {
                const keeperStats = keepersMap.get(keeper.id)!;
                keeperStats.matchesPlayed += 1;
                keeperStats.matchPoints += 1; // 1 poin per pertandingan

                // Clean sheet
                if (match.awayScore === 0) {
                  keeperStats.cleanSheets += 1;
                  keeperStats.goalPoints += 4; // 4 poin per clean sheet
                }

                // Bonus poin untuk hasil pertandingan
                if (match.homeScore > match.awayScore) {
                  keeperStats.matchPoints += 2; // Menang
                } else if (match.homeScore === match.awayScore) {
                  keeperStats.matchPoints += 1; // Seri
                }

                // Hitung kartu
                match.cards.home.forEach(card => {
                  if (card.playerId === keeper.id) {
                    if (card.type === 'yellow') {
                      keeperStats.yellowCards += 1;
                      keeperStats.cardPoints -= 1;
                    } else if (card.type === 'red') {
                      keeperStats.redCards += 1;
                      keeperStats.cardPoints -= 3;
                    }
                  }
                });
              }
            });

            // Update statistik kiper tim tamu
            awayKeepers.forEach(keeper => {
              if (keepersMap.has(keeper.id)) {
                const keeperStats = keepersMap.get(keeper.id)!;
                keeperStats.matchesPlayed += 1;
                keeperStats.matchPoints += 1; // 1 poin per pertandingan

                // Clean sheet
                if (match.homeScore === 0) {
                  keeperStats.cleanSheets += 1;
                  keeperStats.goalPoints += 4; // 4 poin per clean sheet
                }

                // Bonus poin untuk hasil pertandingan
                if (match.awayScore > match.homeScore) {
                  keeperStats.matchPoints += 2; // Menang
                } else if (match.homeScore === match.awayScore) {
                  keeperStats.matchPoints += 1; // Seri
                }

                // Hitung kartu
                match.cards.away.forEach(card => {
                  if (card.playerId === keeper.id) {
                    if (card.type === 'yellow') {
                      keeperStats.yellowCards += 1;
                      keeperStats.cardPoints -= 1;
                    } else if (card.type === 'red') {
                      keeperStats.redCards += 1;
                      keeperStats.cardPoints -= 3;
                    }
                  }
                });
              }
            });
          }
        });

        // Sort dan set state
        const sortedScorers = Array.from(scorersMap.values())
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 10);
        
        // Sort kiper berdasarkan total poin
        const sortedKeepers = Array.from(keepersMap.values())
          .map(keeper => ({
            ...keeper,
            totalPoints: keeper.goalPoints + keeper.matchPoints + keeper.cardPoints
          }))
          .filter(keeper => keeper.matchesPlayed > 0)
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, 5);

        setTopScorers(sortedScorers);
        setBestKeepers(sortedKeepers);
        setBestPlayers(bestPlayersList);
        setLoading(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Gagal memuat data penghargaan",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Memuat Data...</h2>
          <p className="text-muted-foreground">Mohon tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Penghargaan Pemain</h1>
        <p className="text-muted-foreground">
          Daftar pemain terbaik berdasarkan performa di turnamen
        </p>
      </div>

      <Tabs defaultValue="topscorers" className="w-full space-y-6">
        <TabsList className="h-12 w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="topscorers"
            className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Top Skor
          </TabsTrigger>
          <TabsTrigger
            value="bestplayers"
            className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Star className="mr-2 h-4 w-4" />
            Pemain Terbaik
          </TabsTrigger>
          <TabsTrigger
            value="bestkeepers"
            className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Shield className="mr-2 h-4 w-4" />
            Kiper Terbaik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topscorers" className="space-y-6">
          <div className="grid gap-4">
            {topScorers.map((player, index) => (
              <Card key={player.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-l-4 border-emerald-500 bg-card p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        <span className="font-bold text-white">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-sm text-muted-foreground">{player.teamName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Goal className="h-5 w-5 text-emerald-500" />
                      <span className="text-xl font-bold text-emerald-600">
                        {player.goals}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="bestplayers" className="space-y-6">
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 -ml-2"
                    onClick={() => setShowBestPlayerPoints(!showBestPlayerPoints)}
                  >
                    <Info className="mt-1 h-5 w-5 flex-shrink-0 text-yellow-600" />
                    <span>Sistem Poin Pemain Terbaik</span>
                    {showBestPlayerPoints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {showBestPlayerPoints && (
                  <div className="mt-4 space-y-2">
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Goal className="h-4 w-4" />
                        <span>Gol: 3 poin per gol</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Medal className="h-4 w-4" />
                        <span>Kemenangan Tim: 2 poin</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        <span>Pertandingan Seri: 1 poin</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4" />
                        <span>Bermain: 1 poin per pertandingan</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-600">
                        <span>Kartu Kuning: -1 poin</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-700">
                        <span>Kartu Merah: -3 poin</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              {bestPlayers.map((player, index) => (
                <Card key={player.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between border-l-4 border-yellow-500 bg-card p-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          <span className="font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <p className="text-sm text-muted-foreground">{player.teamName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          <span className="text-xl font-bold text-yellow-600">
                            {player.totalPoints}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Goal className="h-4 w-4" />
                            <span>{player.goals}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <CircleDot className="h-4 w-4" />
                            <span>{player.matchesPlayed} main</span>
                          </div>
                          {(player.yellowCards > 0 || player.redCards > 0) && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-2">
                                {player.yellowCards > 0 && (
                                  <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-yellow-700">
                                    {player.yellowCards}🟡
                                  </span>
                                )}
                                {player.redCards > 0 && (
                                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                                    {player.redCards}🔴
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bestkeepers" className="space-y-6">
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0">
              <div className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 -ml-2"
                    onClick={() => setShowBestKeeperPoints(!showBestKeeperPoints)}
                  >
                    <Info className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <span>Sistem Poin Kiper Terbaik</span>
                    {showBestKeeperPoints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {showBestKeeperPoints && (
                  <div className="mt-4 space-y-2">
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Clean Sheet: 4 poin</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Medal className="h-4 w-4" />
                        <span>Kemenangan Tim: 2 poin</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        <span>Pertandingan Seri: 1 poin</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4" />
                        <span>Bermain: 1 poin per pertandingan</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-600">
                        <span>Kartu Kuning: -1 poin</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-700">
                        <span>Kartu Merah: -3 poin</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              {bestKeepers.map((keeper, index) => (
                <Card key={keeper.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between border-l-4 border-emerald-500 bg-card p-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          <span className="font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold">{keeper.name}</p>
                          <p className="text-sm text-muted-foreground">{keeper.teamName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-emerald-500" />
                          <span className="text-xl font-bold text-emerald-600">
                            {keeper.totalPoints}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            <span>{keeper.cleanSheets} Clean Sheet</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <CircleDot className="h-4 w-4" />
                            <span>{keeper.matchesPlayed} main</span>
                          </div>
                          {(keeper.yellowCards > 0 || keeper.redCards > 0) && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-2">
                                {keeper.yellowCards > 0 && (
                                  <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-yellow-700">
                                    {keeper.yellowCards}🟡
                                  </span>
                                )}
                                {keeper.redCards > 0 && (
                                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                                    {keeper.redCards}🔴
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 