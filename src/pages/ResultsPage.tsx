import { useEffect, useState } from 'react';
import { Search, Trophy, Goal, Award, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Match, Player, Card as CardType } from '../types';
import { getMatchesFromFirestore, updateMatchResult, addGoal, getTeams, updatePlayerStats, updateTeamStats } from '../lib/firestoreService';
import { toast } from '../components/ui/use-toast';

const ResultsPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [teams, setTeams] = useState<any[]>([]);
  const [goalScorers, setGoalScorers] = useState<{
    home: Array<{ playerId: string; minute: number }>;
    away: Array<{ playerId: string; minute: number }>;
  }>({
    home: [],
    away: []
  });
  const [cards, setCards] = useState<{
    home: CardType[];
    away: CardType[];
  }>({
    home: [],
    away: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchesData, teamsData] = await Promise.all([
        getMatchesFromFirestore(),
        getTeams()
      ]);

      // Filter pertandingan yang valid
      const validMatches = matchesData.filter(match => {
        const hasValidTeams = match.homeTeamId && match.awayTeamId;
        const hasValidSchedule = match.date && match.time;
        const matchDateTime = new Date(`${match.date} ${match.time}`);
        const isValidDate = !isNaN(matchDateTime.getTime());

        return hasValidTeams && hasValidSchedule && isValidDate;
      });

      // Urutkan berdasarkan tanggal dan waktu
      const sortedMatches = validMatches.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`);
        const dateB = new Date(`${b.date} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setMatches(sortedMatches);
      setTeams(teamsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil data pertandingan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get player name by ID
  const getPlayerNameById = (playerId: string, teamId?: string) => {
    if (!playerId) return 'Unknown Player';
    
    // If teamId is provided, search only in that team
    if (teamId) {
      const team = teams.find(t => t.id === teamId);
      if (team && team.players) {
        const player = team.players.find((p: Player) => p.id === playerId);
        if (player) return player.name;
      }
    } else {
      // Search in all teams
      for (const team of teams) {
        if (team.players) {
          const player = team.players.find((p: Player) => p.id === playerId);
          if (player) return player.name;
        }
      }
    }
    
    return 'Unknown Player';
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setHomeScore(match.homeScore || 0);
    setAwayScore(match.awayScore || 0);
    
    // Reset pencetak gol
    setGoalScorers({ home: [], away: [] });
    
    // Muat kartu yang ada jika ada
    if (match.cards && match.cards.home && match.cards.away) {
      setCards({
        home: match.cards.home.map((card: CardType) => ({
          ...card,
          matchId: match.id
        })),
        away: match.cards.away.map((card: CardType) => ({
          ...card,
          matchId: match.id
        }))
      });
    } else {
      // Reset kartu jika tidak ada
      setCards({ home: [], away: [] });
    }
  };

  const handleAddGoalScorer = (team: 'home' | 'away') => {
    setGoalScorers(prev => ({
      ...prev,
      [team]: [...prev[team], { playerId: '', minute: 0 }]
    }));
  };

  const handleGoalScorerChange = (
    team: 'home' | 'away',
    index: number,
    field: 'playerId' | 'minute',
    value: string | number
  ) => {
    setGoalScorers(prev => {
      const newScorers = {
        home: [...prev.home],
        away: [...prev.away]
      };
      if (field === 'playerId') {
        newScorers[team][index].playerId = value as string;
      } else {
        newScorers[team][index].minute = value as number;
      }
      return newScorers;
    });
  };

  const validateGoalScorers = () => {
    const totalGoals = goalScorers.home.length + goalScorers.away.length;
    return totalGoals === (homeScore + awayScore) &&
      goalScorers.home.length === homeScore &&
      goalScorers.away.length === awayScore &&
      goalScorers.home.every(g => g.playerId && g.minute > 0 && g.minute <= 90) &&
      goalScorers.away.every(g => g.playerId && g.minute > 0 && g.minute <= 90);
  };

  const handleAddCard = (team: 'home' | 'away') => {
    if (!selectedMatch) return;
    
    setCards(prev => ({
      ...prev,
      [team]: [...prev[team], { 
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        playerId: '', 
        type: 'yellow', 
        minute: 0,
        matchId: selectedMatch.id
      }]
    }));
  };

  const handleCardChange = (
    team: 'home' | 'away',
    index: number,
    field: 'playerId' | 'type' | 'minute',
    value: string | number
  ) => {
    setCards(prev => {
      const newCards = {
        home: [...prev.home],
        away: [...prev.away]
      };
      if (field === 'minute') {
        newCards[team][index].minute = value as number;
      } else if (field === 'type') {
        newCards[team][index].type = value as 'yellow' | 'red';
      } else {
        newCards[team][index].playerId = value as string;
      }
      return newCards;
    });
  };

  const validateCards = () => {
    // Validasi kartu tim tuan rumah
    const homeCardsValid = cards.home.every(c => 
      c.playerId && 
      c.playerId.trim() !== '' && 
      c.minute > 0 && 
      c.minute <= 90 && 
      (c.type === 'yellow' || c.type === 'red')
    );
    
    // Validasi kartu tim tamu
    const awayCardsValid = cards.away.every(c => 
      c.playerId && 
      c.playerId.trim() !== '' && 
      c.minute > 0 && 
      c.minute <= 90 && 
      (c.type === 'yellow' || c.type === 'red')
    );
    
    return homeCardsValid && awayCardsValid;
  };

  const handleSubmitResult = async () => {
    if (!selectedMatch) return;

    try {
      if (!validateGoalScorers()) {
        toast({
          title: "Error",
          description: "Pastikan jumlah pencetak gol sesuai dengan skor dan semua data pencetak gol telah diisi dengan benar",
          variant: "destructive"
        });
        return;
      }

      if (!validateCards()) {
        toast({
          title: "Error",
          description: "Pastikan semua data kartu telah diisi dengan benar",
          variant: "destructive"
        });
        return;
      }

      // Pastikan semua kartu memiliki id dan matchId
      const processedCards = {
        home: cards.home.map((card: CardType) => {
          const player = getTeamPlayers(selectedMatch.homeTeamId).find((p: Player) => p.id === card.playerId);
          return {
            ...card,
            id: card.id || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            matchId: selectedMatch.id,
            playerName: player?.name || 'Unknown Player'
          };
        }),
        away: cards.away.map((card: CardType) => {
          const player = getTeamPlayers(selectedMatch.awayTeamId).find((p: Player) => p.id === card.playerId);
          return {
            ...card,
            id: card.id || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            matchId: selectedMatch.id,
            playerName: player?.name || 'Unknown Player'
          };
        })
      };

      // Kurangi statistik dari data lama
      if (selectedMatch.goals && selectedMatch.goals.length > 0) {
        await Promise.all(
          selectedMatch.goals.map(goal => 
            updatePlayerStats(goal.playerId, { goals: -1 }) // Kurangi gol
          )
        );
      }

      // Kurangi statistik kartu lama
      if (selectedMatch.cards) {
        await Promise.all([
          ...(selectedMatch.cards.home || []).map(card => updatePlayerStats(card.playerId, {
            yellowCards: card.type === 'yellow' ? -1 : 0,
            redCards: card.type === 'red' ? -1 : 0
          })),
          ...(selectedMatch.cards.away || []).map(card => updatePlayerStats(card.playerId, {
            yellowCards: card.type === 'yellow' ? -1 : 0,
            redCards: card.type === 'red' ? -1 : 0
          }))
        ]);
      }

      // Update match result dengan goals kosong untuk menghapus data lama
      await updateMatchResult({
        ...selectedMatch,
        homeScore,
        awayScore,
        status: 'completed',
        cards: processedCards,
        goals: [] // Reset goals sebelum menambahkan yang baru
      });

      // Siapkan data gol baru
      const homeTeamPlayers = getTeamPlayers(selectedMatch.homeTeamId);
      const awayTeamPlayers = getTeamPlayers(selectedMatch.awayTeamId);
      
      const allGoals = [
        ...goalScorers.home.map(g => {
          const player = homeTeamPlayers.find((p: Player) => p.id === g.playerId);
          return {
            id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            matchId: selectedMatch.id,
            teamId: selectedMatch.homeTeamId,
            playerId: g.playerId,
            minute: g.minute,
            playerName: player?.name || getPlayerNameById(g.playerId, selectedMatch.homeTeamId),
            teamName: selectedMatch.homeTeamName
          };
        }),
        ...goalScorers.away.map(g => {
          const player = awayTeamPlayers.find((p: Player) => p.id === g.playerId);
          return {
            id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            matchId: selectedMatch.id,
            teamId: selectedMatch.awayTeamId,
            playerId: g.playerId,
            minute: g.minute,
            playerName: player?.name || getPlayerNameById(g.playerId, selectedMatch.awayTeamId),
            teamName: selectedMatch.awayTeamName
          };
        })
      ];

      // Hapus semua gol lama dan tambahkan gol baru
      await Promise.all([
        // Tambahkan gol baru satu per satu
        ...allGoals.map(goal => addGoal(goal)),
        // Update statistik pemain
        ...allGoals.map(goal => updatePlayerStats(goal.playerId, { goals: 1 })),
        ...processedCards.home.map((card: CardType) => updatePlayerStats(card.playerId, {
          yellowCards: card.type === 'yellow' ? 1 : 0,
          redCards: card.type === 'red' ? 1 : 0
        })),
        ...processedCards.away.map((card: CardType) => updatePlayerStats(card.playerId, {
          yellowCards: card.type === 'yellow' ? 1 : 0,
          redCards: card.type === 'red' ? 1 : 0
        })),
        // Update statistik tim
        updateTeamStats(selectedMatch.homeTeamId, {
          played: 1,
          won: homeScore > awayScore ? 1 : 0,
          drawn: homeScore === awayScore ? 1 : 0,
          lost: homeScore < awayScore ? 1 : 0,
          goalsFor: homeScore,
          goalsAgainst: awayScore,
          points: homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0
        }),
        updateTeamStats(selectedMatch.awayTeamId, {
          played: 1,
          won: awayScore > homeScore ? 1 : 0,
          drawn: awayScore === homeScore ? 1 : 0,
          lost: awayScore < homeScore ? 1 : 0,
          goalsFor: awayScore,
          goalsAgainst: homeScore,
          points: awayScore > homeScore ? 3 : awayScore === homeScore ? 1 : 0
        })
      ]);

      // Update match result lagi dengan data gol yang baru
      await updateMatchResult({
        ...selectedMatch,
        homeScore,
        awayScore,
        status: 'completed',
        cards: processedCards,
        goals: allGoals
      });

      toast({
        title: "Berhasil",
        description: "Hasil pertandingan berhasil disimpan",
      });

      fetchData(); // Reload data to get updated matches
      setSelectedMatch(null);
      setHomeScore(0);
      setAwayScore(0);
      setGoalScorers({ home: [], away: [] });
      setCards({ home: [], away: [] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan hasil pertandingan",
        variant: "destructive"
      });
    }
  };

  // Fungsi untuk mengelompokkan pemain berdasarkan posisi
  const getPlayersByPosition = (players: Player[]) => {
    const positions = {
      'Penjaga Gawang': players.filter(p => {
        const pos = (p.position || '').toLowerCase().trim();
        return ['goalkeeper', 'kiper', 'penjaga gawang', 'gk', 'kipper'].includes(pos);
      }),
      'Bek': players.filter(p => {
        const pos = (p.position || '').toLowerCase().trim();
        return ['bek', 'defender', 'back', 'defence', 'defense', 'cb', 'rb', 'lb', 'wb'].includes(pos);
      }),
      'Gelandang': players.filter(p => {
        const pos = (p.position || '').toLowerCase().trim();
        return ['gelandang', 'midfielder', 'midfield', 'tengah', 'mid', 'cm', 'cdm', 'cam', 'dm', 'am'].includes(pos);
      }),
      'Penyerang': players.filter(p => {
        const pos = (p.position || '').toLowerCase().trim();
        return ['penyerang', 'striker', 'forward', 'wing', 'winger', 'cf', 'st', 'rw', 'lw', 'ss'].includes(pos);
      })
    };
    return positions;
  };

  // Update fungsi getTeamPlayers untuk mengelompokkan pemain
  const getTeamPlayers = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.players || [];
  };

  // Komponen untuk menampilkan dropdown pemain berdasarkan posisi
  const PlayerSelectByPosition = ({ 
    teamId, 
    value, 
    onChange, 
    disabled = false 
  }: { 
    teamId: string | undefined;
    value: string; 
    onChange: (value: string) => void; 
    disabled?: boolean;
  }) => {
    const players = teamId ? getTeamPlayers(teamId) : [];
    const playersByPosition = getPlayersByPosition(players);

    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || !teamId}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
      >
        <option value="">Pilih Pemain</option>
        {Object.entries(playersByPosition).map(([position, players]) => (
          players.length > 0 && (
            <optgroup key={position} label={position}>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} - {player.number}
                </option>
              ))}
            </optgroup>
          )
        ))}
      </select>
    );
  };

  // Filter matches berdasarkan status dan pencarian
  const getFilteredMatches = () => {
    let filtered = matches.filter(match => {
      const matchesSearch = `${match.homeTeamName} vs ${match.awayTeamName}`.toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus = activeTab === 'scheduled' ?
        match.status !== 'completed' :
        match.status === 'completed';
      return matchesSearch && matchesStatus;
    });

    // Urutkan berdasarkan tanggal
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      // Untuk tab "selesai", urutkan dari terlama ke terbaru
      if (activeTab === 'completed') {
        return dateA.getTime() - dateB.getTime();
      }
      // Untuk tab "belum selesai", tetap urutkan dari terbaru
      return dateA.getTime() - dateB.getTime();
    });

    return filtered;
  };

  const getMatchSummary = (match: Match) => {
    if (!match) return null;

    // Pastikan kedua skor ada dan bukan undefined
    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    // Pastikan array goals ada
    const goals = match.goals || [];

    const getResult = () => {
      if (homeScore > awayScore) {
        return {
          winner: match.homeTeamName,
          loser: match.awayTeamName,
          isDraw: false
        };
      } else if (homeScore < awayScore) {
        return {
          winner: match.awayTeamName,
          loser: match.homeTeamName,
          isDraw: false
        };
      } else {
        return {
          isDraw: true
        };
      }
    };

    const result = getResult();

    return (
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 py-4">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-300" />
            Ringkasan Pertandingan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 shadow-sm border border-blue-100/50 dark:border-gray-700/50 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tim Tuan Rumah */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-md">
                  <img
                    src={match.homeTeamLogo || '/team-placeholder.png'}
                    alt={match.homeTeamName}
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">{match.homeTeamName}</span>
              </div>
              
              {/* Skor */}
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{homeScore}</span>
                <span className="text-xl text-gray-400">-</span>
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{awayScore}</span>
              </div>
              
              {/* Tim Tamu */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-md">
                  <img
                    src={match.awayTeamLogo || '/team-placeholder.png'}
                    alt={match.awayTeamName}
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">{match.awayTeamName}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Status:</span>
                {result.isDraw ? (
                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">Pertandingan Imbang</span>
                ) : (
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {result.winner} memenangkan pertandingan
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Detail Pencetak Gol */}
          {goals && goals.length > 0 ? (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-4 text-blue-700 dark:text-blue-400 flex items-center">
                <Goal className="w-5 h-5 mr-2" />
                Detail Pencetak Gol
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-gray-800 dark:to-blue-900/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                  <h5 className="text-sm font-medium mb-3 text-blue-700 dark:text-blue-400 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-blue-200 dark:border-blue-800 mr-2">
                      <img
                        src={match.homeTeamLogo || '/team-placeholder.png'}
                        alt={match.homeTeamName}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    {match.homeTeamName}
                  </h5>
                  <ul className="space-y-2">
                    {goals
                      .filter(goal => goal.teamId === match.homeTeamId)
                      .sort((a, b) => a.minute - b.minute)
                      .map((goal, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-blue-100 dark:border-gray-700">
                          <Goal className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <div className="flex-1">
                            <span className="font-medium">
                              {goal.playerName || getPlayerNameById(goal.playerId, match.homeTeamId)}
                            </span>
                          </div>
                          <div className="flex items-center bg-blue-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-blue-200 dark:border-gray-600 px-2 py-1">
                            <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">{goal.minute}'</span>
                          </div>
                        </li>
                      ))}
                    {goals.filter(goal => goal.teamId === match.homeTeamId).length === 0 && (
                      <li className="text-gray-500 dark:text-gray-400 text-sm italic">Tidak ada gol</li>
                    )}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-gray-800 dark:to-indigo-900/20 p-4 rounded-xl border border-indigo-200/50 dark:border-indigo-800/30 shadow-sm">
                  <h5 className="text-sm font-medium mb-3 text-indigo-700 dark:text-indigo-400 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-indigo-200 dark:border-indigo-800 mr-2">
                      <img
                        src={match.awayTeamLogo || '/team-placeholder.png'}
                        alt={match.awayTeamName}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    {match.awayTeamName}
                  </h5>
                  <ul className="space-y-2">
                    {goals
                      .filter(goal => goal.teamId === match.awayTeamId)
                      .sort((a, b) => a.minute - b.minute)
                      .map((goal, idx) => (
                        <li key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-indigo-100 dark:border-gray-700">
                          <Goal className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                          <div className="flex-1">
                            <span className="font-medium">
                              {goal.playerName || getPlayerNameById(goal.playerId, match.awayTeamId)}
                            </span>
                          </div>
                          <div className="flex items-center bg-indigo-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-indigo-200 dark:border-gray-600 px-2 py-1">
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">{goal.minute}'</span>
                          </div>
                        </li>
                      ))}
                    {goals.filter(goal => goal.teamId === match.awayTeamId).length === 0 && (
                      <li className="text-gray-500 dark:text-gray-400 text-sm italic">Tidak ada gol</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            homeScore > 0 || awayScore > 0 ? (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <p className="text-amber-600 dark:text-amber-400 text-sm flex items-center">
                    <span className="mr-2">⚠️</span>
                    Data pencetak gol tidak tersedia. Silakan input ulang hasil pertandingan untuk menambahkan detail pencetak gol.
                  </p>
                </div>
              </div>
            ) : null
          )}

          {/* Detail Kartu */}
          {match.cards && match.cards.home && match.cards.away && (match.cards.home.length > 0 || match.cards.away.length > 0) &&
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-4 text-amber-700 dark:text-amber-400 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Detail Kartu
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tim Tuan Rumah */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-gray-800 dark:to-amber-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
                  <h5 className="text-sm font-medium mb-3 text-amber-700 dark:text-amber-400 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-amber-200 dark:border-amber-800 mr-2">
                      <img
                        src={match.homeTeamLogo || '/team-placeholder.png'}
                        alt={match.homeTeamName}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    {match.homeTeamName}
                  </h5>
                  <div className="space-y-2">
                    {match.cards.home.map((card) => (
                      <div key={card.id} className="flex items-center gap-2">
                        <div className={`w-3 h-4 ${card.type === 'yellow' ? 'bg-yellow-400' : 'bg-red-600'} rounded`} />
                        <span className="text-sm">
                          {card.playerName} ({card.minute}')
                        </span>
                      </div>
                    ))}
                    {match.cards.home.length === 0 && (
                      <p className="text-sm text-muted-foreground">Tidak ada kartu</p>
                    )}
                  </div>
                </div>

                {/* Tim Tamu */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-gray-800 dark:to-amber-900/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
                  <h5 className="text-sm font-medium mb-3 text-amber-700 dark:text-amber-400 flex items-center">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-amber-200 dark:border-amber-800 mr-2">
                      <img
                        src={match.awayTeamLogo || '/team-placeholder.png'}
                        alt={match.awayTeamName}
                        className="w-4 h-4 object-contain"
                      />
                    </div>
                    {match.awayTeamName}
                  </h5>
                  <div className="space-y-2">
                    {match.cards.away.map((card) => (
                      <div key={card.id} className="flex items-center gap-2">
                        <div className={`w-3 h-4 ${card.type === 'yellow' ? 'bg-yellow-400' : 'bg-red-600'} rounded`} />
                        <span className="text-sm">
                          {card.playerName} ({card.minute}')
                        </span>
                      </div>
                    ))}
                    {match.cards.away.length === 0 && (
                      <p className="text-sm text-muted-foreground">Tidak ada kartu</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          }
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-xl p-6 border border-blue-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Input Hasil Pertandingan</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full md:w-auto grid grid-cols-2 md:flex bg-blue-100/50 dark:bg-gray-800/50 p-1 rounded-full">
            <TabsTrigger value="scheduled" className="flex-1 md:flex-initial rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm">
              Belum Selesai
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 md:flex-initial rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm">
              Selesai
            </TabsTrigger>
          </TabsList>

          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400" />
              <Input
                placeholder="Cari pertandingan berdasarkan nama tim..."
                className="pl-12 py-6 bg-white dark:bg-gray-800 border-blue-100 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-gray-700"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 dark:border-blue-400 absolute top-0 left-0"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getFilteredMatches().map((match) => (
                <Card 
                  key={match.id} 
                  className={`overflow-visible transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 border-0 ${
                    selectedMatch?.id === match.id ? 'ring-4 ring-blue-400/30 dark:ring-blue-500/30 shadow-xl scale-[1.02]' : 'hover:scale-[1.01]'
                  }`}
                >
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 py-4 rounded-t-lg">
                    <CardTitle className="text-sm font-medium flex flex-col items-center text-white">
                      <span className="text-blue-100 dark:text-blue-100 text-xs uppercase tracking-wider">
                        {new Date(match.date).toLocaleDateString('id-ID', { weekday: 'long' })}
                      </span>
                      <span className="text-white font-bold text-lg mt-1">
                        {new Date(match.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-blue-100 dark:text-blue-100 mt-1 bg-blue-600/40 dark:bg-blue-800/40 px-3 py-1 rounded-full text-xs">
                        {match.time}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-6">
                      {/* Tim dan Skor */}
                      <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 shadow-sm border border-blue-100/50 dark:border-gray-700/50">
                        {/* Tim Tuan Rumah */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-md">
                              <img
                                src={match.homeTeamLogo || '/team-placeholder.png'}
                                alt={match.homeTeamName}
                                className="w-9 h-9 object-contain"
                              />
                            </div>
                            <span className="font-bold truncate text-gray-800 dark:text-gray-200 text-lg">{match.homeTeamName}</span>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              className="w-16 h-16 text-center font-bold text-xl bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-lg shadow-inner"
                              value={selectedMatch?.id === match.id ? homeScore : match.homeScore || 0}
                              onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                              disabled={selectedMatch?.id !== match.id}
                            />
                          </div>
                        </div>

                        {/* Garis Pemisah */}
                        <div className="flex items-center justify-center my-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-800 to-transparent"></div>
                          <span className="px-4 py-1 text-blue-600 dark:text-blue-400 text-sm font-medium bg-white dark:bg-gray-800 rounded-full border border-blue-200 dark:border-blue-800 mx-2 shadow-sm">VS</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 dark:via-blue-800 to-transparent"></div>
                        </div>

                        {/* Tim Tamu */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-md">
                              <img
                                src={match.awayTeamLogo || '/team-placeholder.png'}
                                alt={match.awayTeamName}
                                className="w-9 h-9 object-contain"
                              />
                            </div>
                            <span className="font-bold truncate text-gray-800 dark:text-gray-200 text-lg">{match.awayTeamName}</span>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              className="w-16 h-16 text-center font-bold text-xl bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg shadow-inner"
                              value={selectedMatch?.id === match.id ? awayScore : match.awayScore || 0}
                              onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                              disabled={selectedMatch?.id !== match.id}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div className="flex justify-end space-x-3">
                        {selectedMatch?.id === match.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMatch(null);
                                setHomeScore(0);
                                setAwayScore(0);
                                setGoalScorers({ home: [], away: [] });
                                setCards({ home: [], away: [] });
                              }}
                              className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl px-4 py-2"
                            >
                              Batal
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSubmitResult()}
                              disabled={loading}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-4 py-2 shadow-md hover:shadow-lg transition-all duration-200"
                            >
                              {loading ? 'Menyimpan...' : 'Simpan Hasil'}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSelectMatch(match)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-full rounded-xl py-3 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
                          >
                            Input Hasil
                          </Button>
                        )}
                      </div>

                      {/* Detail Input */}
                      {selectedMatch?.id === match.id && (
                        <div className="mt-8 border-t border-blue-100 dark:border-gray-700 pt-8 space-y-8">
                          {/* Pencetak Gol */}
                          <div className="space-y-6">
                            {/* Tim Tuan Rumah */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-gray-800 dark:to-blue-900/20 p-5 rounded-xl border border-blue-200/50 dark:border-blue-800/30 shadow-sm">
                              <h4 className="font-semibold mb-4 text-blue-700 dark:text-blue-400 flex items-center text-lg">
                                <Goal className="w-5 h-5 mr-2" />
                                Pencetak Gol {match.homeTeamName}
                              </h4>
                              {goalScorers.home.map((scorer, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                  <PlayerSelectByPosition
                                    teamId={selectedMatch.homeTeamId}
                                    value={scorer.playerId}
                                    onChange={(value) => handleGoalScorerChange('home', index, 'playerId', value)}
                                  />
                                  <Input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={scorer.minute || ''}
                                    onChange={(e) => handleGoalScorerChange('home', index, 'minute', parseInt(e.target.value) || 0)}
                                    placeholder="Menit"
                                    className="w-24"
                                  />
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddGoalScorer('home')}
                                disabled={goalScorers.home.length >= homeScore}
                                className="mt-3 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-1"
                              >
                                <span className="text-lg">+</span> Tambah Pencetak Gol
                              </Button>
                              {homeScore > 0 && goalScorers.home.length < homeScore && (
                                <div className="flex items-center gap-2 mt-3 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                  <span className="text-amber-600 dark:text-amber-400 text-xs">
                                    Masih ada {homeScore - goalScorers.home.length} gol yang belum diinput
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Tim Tamu */}
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-gray-800 dark:to-indigo-900/20 p-5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/30 shadow-sm">
                              <h4 className="font-semibold mb-4 text-indigo-700 dark:text-indigo-400 flex items-center text-lg">
                                <Goal className="w-5 h-5 mr-2" />
                                Pencetak Gol {match.awayTeamName}
                              </h4>
                              {goalScorers.away.map((scorer, index) => (
                                <div key={index} className="flex items-center gap-2 mb-2">
                                  <PlayerSelectByPosition
                                    teamId={selectedMatch.awayTeamId}
                                    value={scorer.playerId}
                                    onChange={(value) => handleGoalScorerChange('away', index, 'playerId', value)}
                                  />
                                  <Input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={scorer.minute || ''}
                                    onChange={(e) => handleGoalScorerChange('away', index, 'minute', parseInt(e.target.value) || 0)}
                                    placeholder="Menit"
                                    className="w-24"
                                  />
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddGoalScorer('away')}
                                disabled={goalScorers.away.length >= awayScore}
                                className="mt-3 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg flex items-center gap-1"
                              >
                                <span className="text-lg">+</span> Tambah Pencetak Gol
                              </Button>
                              {awayScore > 0 && goalScorers.away.length < awayScore && (
                                <div className="flex items-center gap-2 mt-3 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800/30">
                                  <span className="text-amber-600 dark:text-amber-400 text-xs">
                                    Masih ada {awayScore - goalScorers.away.length} gol yang belum diinput
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Kartu */}
                          <div className="space-y-6 mt-8">
                            {/* Tim Tuan Rumah */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-gray-800 dark:to-amber-900/20 p-5 rounded-xl border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
                              <h4 className="font-semibold mb-4 text-amber-700 dark:text-amber-400 flex items-center text-lg">
                                <Award className="w-5 h-5 mr-2" />
                                Kartu {match.homeTeamName}
                              </h4>
                              {cards.home.map((card, index) => (
                                <div key={card.id} className="flex items-center gap-2 mb-2">
                                  <PlayerSelectByPosition
                                    teamId={selectedMatch?.homeTeamId}
                                    value={card.playerId}
                                    onChange={(value) => handleCardChange('home', index, 'playerId', value)}
                                  />
                                  <select
                                    value={card.type}
                                    onChange={(e) => handleCardChange('home', index, 'type', e.target.value)}
                                    className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                  >
                                    <option value="yellow">Kuning</option>
                                    <option value="red">Merah</option>
                                  </select>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={card.minute || ''}
                                    onChange={(e) => handleCardChange('home', index, 'minute', parseInt(e.target.value) || 0)}
                                    placeholder="Menit"
                                    className="w-24"
                                  />
                                </div>
                              ))}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAddCard('home')} 
                                className="mt-3 border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg flex items-center gap-1"
                              >
                                <span className="text-lg">+</span> Tambah Kartu
                              </Button>
                            </div>

                            {/* Tim Tamu */}
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-gray-800 dark:to-amber-900/20 p-5 rounded-xl border border-amber-200/50 dark:border-amber-800/30 shadow-sm">
                              <h4 className="font-semibold mb-4 text-amber-700 dark:text-amber-400 flex items-center text-lg">
                                <Award className="w-5 h-5 mr-2" />
                                Kartu {match.awayTeamName}
                              </h4>
                              {cards.away.map((card, index) => (
                                <div key={card.id} className="flex items-center gap-2 mb-2">
                                  <PlayerSelectByPosition
                                    teamId={selectedMatch?.awayTeamId}
                                    value={card.playerId}
                                    onChange={(value) => handleCardChange('away', index, 'playerId', value)}
                                  />
                                  <select
                                    value={card.type}
                                    onChange={(e) => handleCardChange('away', index, 'type', e.target.value)}
                                    className="w-32 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                  >
                                    <option value="yellow">Kuning</option>
                                    <option value="red">Merah</option>
                                  </select>
                                  <Input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={card.minute || ''}
                                    onChange={(e) => handleCardChange('away', index, 'minute', parseInt(e.target.value) || 0)}
                                    placeholder="Menit"
                                    className="w-24"
                                  />
                                </div>
                              ))}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAddCard('away')} 
                                className="mt-3 border-amber-300 text-amber-600 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg flex items-center gap-1"
                              >
                                <span className="text-lg">+</span> Tambah Kartu
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && getFilteredMatches().length === 0 && (
            <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                  <Trophy className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                </div>
                {activeTab === 'scheduled' ? (
                  <>
                    <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Tidak ada pertandingan yang belum selesai</p>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Semua pertandingan telah selesai atau belum ada jadwal pertandingan yang ditambahkan
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Tidak ada pertandingan yang sudah selesai</p>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Belum ada hasil pertandingan yang diinput
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </Tabs>

        {activeTab === 'completed' && getFilteredMatches().map((match) => (
          <div key={match.id} className="mb-6">
            {getMatchSummary(match)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsPage;
