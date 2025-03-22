import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  CollectionReference,
  Query,
  getDoc
} from 'firebase/firestore';
import type { Team, Player, Match, Goal, Card, Standing } from '../types';
import { KnockoutMatch } from "@/types/knockout";

/**
 * Menyimpan atau memperbarui data tim ke Firestore
 * @param team Data tim yang akan disimpan
 * @returns Tim yang berhasil disimpan
 */
export const saveTeamToFirestore = async (team: Team): Promise<Team> => {
  try {
    if (team.id) {
      const docRef = doc(db, "teams", team.id);
      await setDoc(docRef, { ...team }, { merge: true });
      return team;
    } else {
      const docRef = await addDoc(collection(db, "teams"), team);
      return { ...team, id: docRef.id };
    }
  } catch (error) {
    throw new Error("Gagal menyimpan tim ke Firebase");
  }
};

/**
 * Menghapus tim dari Firestore
 * @param teamId ID tim yang akan dihapus
 */
export const deleteTeamFromFirestore = async (teamId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "teams", teamId));
  } catch (error) {
    throw new Error("Gagal menghapus tim dari Firebase");
  }
};

/**
 * Menghapus semua tim dari Firestore
 * @param teamIds ID tim yang akan dihapus
 */
export const deleteAllTeamsFromFirestore = async (teamIds: string[]): Promise<void> => {
  try {
    const deletePromises = teamIds.map(teamId => {
      const teamRef = doc(db, 'teams', teamId);
      return deleteDoc(teamRef);
    });
    await Promise.all(deletePromises);
  } catch (error) {
    throw new Error("Gagal menghapus semua tim dari Firebase");
  }
};

/**
 * Mengambil semua tim dari Firestore
 */
export const getTeamsFromFirestore = async (groupId?: string): Promise<Team[]> => {
  try {
    let teamsRef: CollectionReference | Query = collection(db, "teams");
    if (groupId && groupId !== 'all') {
      teamsRef = query(teamsRef, where('groupId', '==', groupId));
    }
    const snapshot = await getDocs(teamsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    throw new Error("Gagal mengambil tim dari Firebase");
  }
};

// Fungsi untuk menyimpan jadwal pertandingan ke Firestore
export const saveMatchToFirestore = async (match: Match): Promise<Match> => {
  try {
    const { homeTeamLogo, awayTeamLogo, ...matchData } = match;
    if (match.id) {
      // Periksa apakah dokumen ada sebelum mengupdate
      const docRef = doc(db, 'matches', match.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Dokumen ada, lakukan update
        await updateDoc(docRef, matchData);
      } else {
        // Dokumen tidak ada, lakukan set
        await setDoc(docRef, matchData);
      }
      return match;
    } else {
      const docRef = await addDoc(collection(db, 'matches'), matchData);
      return { ...match, id: docRef.id };
    }
  } catch (error) {
    throw error;
  }
};

// Fungsi untuk menghapus semua jadwal dari Firestore
export const deleteAllMatchesFromFirestore = async () => {
  try {
    const matchesRef = collection(db, 'matches');
    const matchesSnapshot = await getDocs(matchesRef);

    const deletePromises = matchesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    throw error;
  }
};

// Collections
const TEAMS = 'teams';
const MATCHES = 'matches';
const GOALS = 'goals';
const CARDS = 'cards';
const STANDINGS = 'standings';

// Team Operations
export const getTeams = async (): Promise<Team[]> => {
  const querySnapshot = await getDocs(collection(db, TEAMS));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
};

export const addTeam = async (team: Team): Promise<void> => {
  await setDoc(doc(db, TEAMS, team.id), team);
};

export const updateTeam = async (team: Team): Promise<void> => {
  await updateDoc(doc(db, TEAMS, team.id), { ...team });
};

export const deleteTeam = async (teamId: string): Promise<void> => {
  await deleteDoc(doc(db, TEAMS, teamId));
};

// Match Operations
export const getMatchesFromFirestore = async (): Promise<Match[]> => {
  try {
    const matchesCollection = collection(db, 'matches');
    const matchesSnapshot = await getDocs(matchesCollection);
    const matchesData = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Match[];

    // Ambil data gol untuk setiap pertandingan
    const goalsCollection = collection(db, 'goals');
    const goalsSnapshot = await getDocs(goalsCollection);
    const goalsData = goalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];

    // Kelompokkan gol berdasarkan matchId
    const goalsByMatch: Record<string, Goal[]> = {};
    goalsData.forEach(goal => {
      if (!goalsByMatch[goal.matchId]) {
        goalsByMatch[goal.matchId] = [];
      }
      goalsByMatch[goal.matchId].push(goal);
    });

    // Tambahkan gol ke pertandingan yang sesuai
    const matchesWithGoals = matchesData.map(match => {
      const matchGoals = goalsByMatch[match.id] || [];
      return {
        ...match,
        goals: matchGoals
      };
    });

    // Ambil data tim untuk mendapatkan logo
    const teams = await getTeamsFromFirestore();

    // Tambahkan logo tim ke setiap pertandingan
    const matchesWithLogos = matchesWithGoals.map(match => {
      const homeTeam = teams.find(team => team.id === match.homeTeamId);
      const awayTeam = teams.find(team => team.id === match.awayTeamId);
      return {
        ...match,
        homeTeamLogo: homeTeam?.logo || '',
        awayTeamLogo: awayTeam?.logo || ''
      };
    });

    return matchesWithLogos;
  } catch (error) {
    throw error;
  }
};

export const addMatch = async (match: Match): Promise<void> => {
  await setDoc(doc(db, MATCHES, match.id), match);
};

export const updateMatch = async (match: Match): Promise<void> => {
  try {
    // Hapus properti logo sebelum menyimpan ke Firestore
    const { homeTeamLogo, awayTeamLogo, ...matchData } = match;
    
    // Periksa apakah dokumen ada sebelum mengupdate
    const docRef = doc(db, MATCHES, match.id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Dokumen ada, lakukan update
      await updateDoc(docRef, matchData);
    } else {
      // Dokumen tidak ada, lakukan set
      await setDoc(docRef, matchData);
    }
    
    if (match.status === 'completed') {
      await updateStandings();
    }
  } catch (error) {
    throw error;
  }
};

export const deleteMatchFromFirestore = async (matchId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, MATCHES, matchId));
  } catch (error) {
    throw error;
  }
};

// Player Operations
export const getPlayers = async (): Promise<Player[]> => {
  // Ambil semua tim
  const teamsSnapshot = await getDocs(collection(db, TEAMS));
  const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
  
  // Gabungkan semua pemain dari setiap tim
  const allPlayers: Player[] = [];
  teams.forEach(team => {
    if (team.players && team.players.length > 0) {
      allPlayers.push(...team.players);
    }
  });
  
  return allPlayers;
};

export const addPlayer = async (player: Player): Promise<Player> => {
  try {
    // Validasi foto sebelum menyimpan
    const cleanedPlayer = {
      ...player,
      photo: player.photo && player.photo.startsWith('data:image/') ? player.photo : ''
    };

    // Update array players di dokumen tim
    if (cleanedPlayer.teamId) {
      const teamRef = doc(db, TEAMS, cleanedPlayer.teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        const players = teamData.players || [];
        
        // Periksa apakah pemain sudah ada
        const playerExists = players.some(p => p.id === cleanedPlayer.id);
        
        // Validasi jumlah maksimal pemain (20 pemain)
        if (!playerExists && players.length >= 20) {
          throw new Error(`Tim ${teamData.name} sudah memiliki 20 pemain (jumlah maksimal).`);
        }
        
        if (!playerExists) {
          // Tambahkan pemain baru ke array players
          const updatedPlayers = [...players, cleanedPlayer];
          await updateDoc(teamRef, {
            players: updatedPlayers
          });
        } else {
          // Update data pemain yang sudah ada
          const updatedPlayers = players.map(p => 
            p.id === cleanedPlayer.id ? cleanedPlayer : p
          );
          await updateDoc(teamRef, {
            players: updatedPlayers
          });
        }
      } else {
        throw new Error(`Tim dengan ID ${cleanedPlayer.teamId} tidak ditemukan`);
      }
    }
    
    return cleanedPlayer;
  } catch (error) {
    throw error;
  }
};

export const updatePlayer = async (player: Player): Promise<Player> => {
  try {
    // Validasi foto sebelum menyimpan
    const cleanedPlayer = {
      ...player,
      photo: player.photo && player.photo.startsWith('data:image/') ? player.photo : ''
    };

    // Update pemain di array players tim
    if (cleanedPlayer.teamId) {
      const teamRef = doc(db, TEAMS, cleanedPlayer.teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        const players = teamData.players || [];
        
        // Update data pemain
        const updatedPlayers = players.map(p => 
          p.id === cleanedPlayer.id ? cleanedPlayer : p
        );
        
        await updateDoc(teamRef, {
          players: updatedPlayers
        });
      } else {
        throw new Error(`Tim dengan ID ${cleanedPlayer.teamId} tidak ditemukan`);
      }
    }
    
    return cleanedPlayer;
  } catch (error) {
    throw error;
  }
};

export const deletePlayer = async (playerId: string, teamId: string): Promise<void> => {
  try {
    const teamRef = doc(db, TEAMS, teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (teamDoc.exists()) {
      const teamData = teamDoc.data() as Team;
      const players = teamData.players || [];
      
      // Validasi jumlah minimal pemain (11 pemain)
      if (players.length <= 11) {
        throw new Error(`Tim ${teamData.name} hanya memiliki ${players.length} pemain. Minimal harus ada 11 pemain dalam tim.`);
      }
      
      // Filter pemain yang akan dihapus
      const updatedPlayers = players.filter(p => p.id !== playerId);
      
      await updateDoc(teamRef, {
        players: updatedPlayers
      });
    } else {
      throw new Error(`Tim dengan ID ${teamId} tidak ditemukan`);
    }
  } catch (error) {
    throw error;
  }
};

// Goal Operations
export const getGoalsFromFirestore = async (): Promise<Goal[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, GOALS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
  } catch (error) {
    throw error;
  }
};

export const addGoal = async (goalData: Goal): Promise<string> => {
  try {
    // Tambahkan gol ke koleksi goals
    const goalsCollection = collection(db, 'goals');
    const goalRef = await addDoc(goalsCollection, goalData);
    
    // Update pertandingan untuk menambahkan referensi ke gol
    const matchRef = doc(db, 'matches', goalData.matchId);
    const matchDoc = await getDoc(matchRef);
    
    if (matchDoc.exists()) {
      const matchData = matchDoc.data();
      const goals = matchData.goals || [];
      
      // Tambahkan gol baru ke array goals di dokumen pertandingan
      // Gunakan spread operator untuk properti goalData kecuali id
      // karena id sudah ada dari goalRef.id
      const { id, ...goalDataWithoutId } = goalData;
      await updateDoc(matchRef, {
        goals: [...goals, { id: goalRef.id, ...goalDataWithoutId }]
      });
    }
    
    return goalRef.id;
  } catch (error) {
    throw error;
  }
};

// Card Operations
export const getCardsFromFirestore = async (): Promise<Card[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, CARDS));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Card));
  } catch (error) {
    throw error;
  }
};

export const addCard = async (card: Card): Promise<void> => {
  await setDoc(doc(db, CARDS, card.id), card);
};

// Standings Operations
export const getStandings = async (): Promise<Standing[]> => {
  const querySnapshot = await getDocs(collection(db, STANDINGS));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Standing));
};

export const updateStandings = async (): Promise<void> => {
  try {
    const matches = await getMatchesFromFirestore();
    const teams = await getTeams();

    // Reset standings
    const initialStandings: Standing[] = teams.map(team => ({
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
    }));

    // Calculate standings from completed matches
    const completedMatches = matches.filter(match => match.status === 'completed');
    completedMatches.forEach((match: Match) => {
      const homeStanding = initialStandings.find(s => s.teamId === match.homeTeamId);
      const awayStanding = initialStandings.find(s => s.teamId === match.awayTeamId);

      if (homeStanding && awayStanding) {
        homeStanding.matchesPlayed++;
        awayStanding.matchesPlayed++;

        const homeScore = match.homeScore || 0;
        const awayScore = match.awayScore || 0;

        homeStanding.goalsFor += homeScore;
        homeStanding.goalsAgainst += awayScore;
        awayStanding.goalsFor += awayScore;
        awayStanding.goalsAgainst += homeScore;

        if (homeScore > awayScore) {
          homeStanding.wins++;
          homeStanding.points += 3;
          awayStanding.losses++;
        } else if (homeScore < awayScore) {
          awayStanding.wins++;
          awayStanding.points += 3;
          homeStanding.losses++;
        } else {
          homeStanding.draws++;
          awayStanding.draws++;
          homeStanding.points += 1;
          awayStanding.points += 1;
        }

        homeStanding.goalDifference = homeStanding.goalsFor - homeStanding.goalsAgainst;
        awayStanding.goalDifference = awayStanding.goalsFor - awayStanding.goalsAgainst;
      }
    });

    // Save updated standings to Firestore
    for (const standing of initialStandings) {
      await setDoc(doc(db, STANDINGS, standing.id), standing);
    }
  } catch (error) {
    throw error;
  }
};

// Fungsi untuk mencari pertandingan yang bisa dijadwalkan pada tanggal tertentu
const findSchedulableMatches = (
  date: string,
  matches: Array<Omit<Match, 'id' | 'homeTeamLogo' | 'awayTeamLogo'>>,
  scheduledMatches: Array<Omit<Match, 'id' | 'homeTeamLogo' | 'awayTeamLogo'>>,
  count: number
): Array<Omit<Match, 'id' | 'homeTeamLogo' | 'awayTeamLogo'>> => {
  const schedulableMatches: Array<Omit<Match, 'id' | 'homeTeamLogo' | 'awayTeamLogo'>> = [];
  const usedTeams = new Set<string>();
  const teamsPlayCount = new Map<string, number>();
  const lastMatchDate = new Map<string, string>();

  scheduledMatches.forEach(match => {
    teamsPlayCount.set(match.homeTeamId, (teamsPlayCount.get(match.homeTeamId) || 0) + 1);
    teamsPlayCount.set(match.awayTeamId, (teamsPlayCount.get(match.awayTeamId) || 0) + 1);
    lastMatchDate.set(match.homeTeamId, match.date);
    lastMatchDate.set(match.awayTeamId, match.date);
  });

  const matchesWithPriority = matches.map(match => {
    const homeTeamGames = teamsPlayCount.get(match.homeTeamId) || 0;
    const awayTeamGames = teamsPlayCount.get(match.awayTeamId) || 0;
    const homeTeamLastMatch = lastMatchDate.get(match.homeTeamId);
    const awayTeamLastMatch = lastMatchDate.get(match.awayTeamId);

    const homeTeamRestDays = homeTeamLastMatch ?
      Math.floor((new Date(date).getTime() - new Date(homeTeamLastMatch).getTime()) / (1000 * 60 * 60 * 24)) :
      Infinity;
    const awayTeamRestDays = awayTeamLastMatch ?
      Math.floor((new Date(date).getTime() - new Date(awayTeamLastMatch).getTime()) / (1000 * 60 * 60 * 24)) :
      Infinity;

    return {
      match,
      priority: (
        (5 - homeTeamGames) * 10 +
        (5 - awayTeamGames) * 10 +
        Math.min(homeTeamRestDays, awayTeamRestDays) * 5
      )
    };
  }).sort((a, b) => b.priority - a.priority);

  for (const { match } of matchesWithPriority) {
    if (schedulableMatches.length >= count) break;

    if (match.date === '' &&
      !usedTeams.has(match.homeTeamId) &&
      !usedTeams.has(match.awayTeamId)) {

      const homeTeamLastMatch = lastMatchDate.get(match.homeTeamId);
      const awayTeamLastMatch = lastMatchDate.get(match.awayTeamId);

      const isValidRestPeriod = (!homeTeamLastMatch ||
        Math.floor((new Date(date).getTime() - new Date(homeTeamLastMatch).getTime()) / (1000 * 60 * 60 * 24)) >= 2) &&
        (!awayTeamLastMatch ||
          Math.floor((new Date(date).getTime() - new Date(awayTeamLastMatch).getTime()) / (1000 * 60 * 60 * 24)) >= 2);

      if (isValidRestPeriod) {
        schedulableMatches.push(match);
        usedTeams.add(match.homeTeamId);
        usedTeams.add(match.awayTeamId);
      }
    }
  }

  return schedulableMatches;
};

// Generate match schedule
export const generateMatchSchedule = async (startDate?: string): Promise<void> => {
  try {
    const teams = await getTeams();

    // Group teams by their group
    const teamsByGroup = teams.reduce<Record<string, Team[]>>((acc, team) => {
      if (!acc[team.groupId]) {
        acc[team.groupId] = [];
      }
      acc[team.groupId].push(team);
      return acc;
    }, {});

    const availableTimes = ['13:30', '14:45', '16:00'];
    type NewMatch = Omit<Match, 'id' | 'homeTeamLogo' | 'awayTeamLogo'>;
    const allMatches: NewMatch[] = [];
    const matchesPerDay = 3;

    // Generate matches for each group using round robin
    Object.entries(teamsByGroup).forEach(([groupId, groupTeams]) => {
      const n = groupTeams.length;

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const team1 = groupTeams[i];
          const team2 = groupTeams[j];

          const newMatch: NewMatch = {
            homeTeamId: team1.id,
            homeTeamName: team1.name,
            awayTeamId: team2.id,
            awayTeamName: team2.name,
            groupId,
            date: '',
            time: '',
            venue: "Stadion Gelora Babakan Girihieum",
            homeScore: 0,
            awayScore: 0,
            status: "scheduled",
            goals: [],
            cards: {
              home: [],
              away: []
            }
          };

          allMatches.push(newMatch);
        }
      }
    });

    const tournamentStartDate = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() + 1));
    tournamentStartDate.setHours(0, 0, 0, 0);

    const scheduledMatches: NewMatch[] = [];
    let currentDate = new Date(tournamentStartDate);
    const maxDays = 30;
    let remainingMatches = [...allMatches];
    let retryCount = 0;
    const maxRetries = 10;

    while (retryCount < maxRetries) {
      scheduledMatches.length = 0;
      remainingMatches = [...allMatches];
      currentDate = new Date(tournamentStartDate);
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5;

      remainingMatches.sort(() => Math.random() - 0.5);

      for (let day = 0; day < maxDays && remainingMatches.length > 0; day++) {
        const dateStr = currentDate.toISOString().split('T')[0];

        const matchesToSchedule = findSchedulableMatches(dateStr, remainingMatches, scheduledMatches, matchesPerDay);

        if (matchesToSchedule.length === matchesPerDay) {
          consecutiveFailures = 0;

          matchesToSchedule.forEach((match, index) => {
            match.date = dateStr;
            match.time = availableTimes[index];
            scheduledMatches.push(match);
            remainingMatches = remainingMatches.filter(m =>
              !(m.homeTeamId === match.homeTeamId && m.awayTeamId === match.awayTeamId)
            );
          });
        } else {
          consecutiveFailures++;

          if (consecutiveFailures >= maxConsecutiveFailures) {
            break;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (remainingMatches.length === 0) {
        const matchesByDate = scheduledMatches.reduce((acc, match) => {
          acc[match.date] = (acc[match.date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const matchesByTeam = new Map<string, number>();
        scheduledMatches.forEach(match => {
          matchesByTeam.set(match.homeTeamId, (matchesByTeam.get(match.homeTeamId) || 0) + 1);
          matchesByTeam.set(match.awayTeamId, (matchesByTeam.get(match.awayTeamId) || 0) + 1);
        });

        const isValidDistribution =
          Object.values(matchesByDate).every(count => count === matchesPerDay) &&
          Array.from(matchesByTeam.values()).every(count => count === 5);

        if (isValidDistribution) {
          break;
        }
      }

      retryCount++;
      if (retryCount === maxRetries) {
        throw new Error('Tidak dapat membuat jadwal yang valid setelah beberapa percobaan');
      }
    }

    // Urutkan pertandingan berdasarkan tanggal dan waktu
    scheduledMatches.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    // Hapus semua pertandingan yang ada terlebih dahulu
    await deleteAllMatchesFromFirestore();

    // Simpan jadwal pertandingan dengan ID baru
    for (const match of scheduledMatches) {
      // Buat ID baru untuk setiap pertandingan
      const newMatchId = doc(collection(db, MATCHES)).id;
      const matchData = { ...match, id: newMatchId };
      
      // Gunakan setDoc untuk memastikan dokumen dibuat
      await setDoc(doc(db, MATCHES, newMatchId), matchData);
    }
  } catch (error) {
    throw error;
  }
};

// Fungsi untuk menyimpan gol ke Firestore
export const saveGoalToFirestore = async (goal: Goal): Promise<Goal> => {
  try {
    if (goal.id) {
      const docRef = doc(db, GOALS, goal.id);
      await updateDoc(docRef, { ...goal });
      return goal;
    } else {
      const docRef = await addDoc(collection(db, GOALS), goal);
      return { ...goal, id: docRef.id };
    }
  } catch (error) {
    throw new Error("Gagal menyimpan gol ke Firebase");
  }
};

// Fungsi untuk menyimpan kartu ke Firestore
export const saveCardToFirestore = async (card: Card): Promise<Card> => {
  try {
    if (card.id) {
      const docRef = doc(db, CARDS, card.id);
      await updateDoc(docRef, { ...card });
      return card;
    } else {
      const docRef = await addDoc(collection(db, CARDS), card);
      return { ...card, id: docRef.id };
    }
  } catch (error) {
    throw new Error("Gagal menyimpan kartu ke Firebase");
  }
};

// Fungsi untuk menyimpan klasemen ke Firestore
export const saveStandingToFirestore = async (standing: Standing): Promise<Standing> => {
  try {
    if (standing.id) {
      const docRef = doc(db, STANDINGS, standing.id);
      await updateDoc(docRef, { ...standing });
      return standing;
    } else {
      const docRef = await addDoc(collection(db, STANDINGS), standing);
      return { ...standing, id: docRef.id };
    }
  } catch (error) {
    throw new Error("Gagal menyimpan klasemen ke Firebase");
  }
};

// Update match result
export const updateMatchResult = async (match: Match): Promise<void> => {
  try {
    const matchRef = doc(db, MATCHES, match.id);
    await updateDoc(matchRef, {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      cards: match.cards
    });
  } catch (error) {
    throw error;
  }
};

export const updatePlayerStats = async (playerId: string, stats: {
  goals?: number;
  yellowCards?: number;
  redCards?: number;
}) => {
  const playerRef = doc(db, 'players', playerId);
  const playerDoc = await getDoc(playerRef);

  if (playerDoc.exists()) {
    const currentStats = playerDoc.data();
    await updateDoc(playerRef, {
      goals: (currentStats.goals || 0) + (stats.goals || 0),
      yellowCards: (currentStats.yellowCards || 0) + (stats.yellowCards || 0),
      redCards: (currentStats.redCards || 0) + (stats.redCards || 0),
    });
  }
};

export const updateTeamStats = async (teamId: string, stats: {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}) => {
  const teamRef = doc(db, 'teams', teamId);
  const teamDoc = await getDoc(teamRef);

  if (teamDoc.exists()) {
    const currentStats = teamDoc.data();
    await updateDoc(teamRef, {
      played: (currentStats.played || 0) + stats.played,
      won: (currentStats.won || 0) + stats.won,
      drawn: (currentStats.drawn || 0) + stats.drawn,
      lost: (currentStats.lost || 0) + stats.lost,
      goalsFor: (currentStats.goalsFor || 0) + stats.goalsFor,
      goalsAgainst: (currentStats.goalsAgainst || 0) + stats.goalsAgainst,
      points: (currentStats.points || 0) + stats.points,
    });
  }
};

export async function addKnockoutMatch(data: {
  round: "QUARTER" | "SEMI" | "FINAL";
  matchNumber: number;
  nextMatchNumber?: number;
  date: string;
  time: string;
  venue: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
}) {
  try {
    const matchesRef = collection(db, "matches");
    const newMatch = {
      ...data,
      groupId: "knockout",
      homeScore: 0,
      awayScore: 0,
      status: "scheduled",
      goals: [],
      cards: {
        home: [],
        away: [],
      },
    };

    await addDoc(matchesRef, newMatch);
  } catch (error) {
    console.error("Error adding knockout match:", error);
    throw error;
  }
}

export async function setupKnockoutStage() {
  try {
    // Setup Quarter Finals (4 matches)
    for (let i = 1; i <= 4; i++) {
      await addKnockoutMatch({
        round: "QUARTER",
        matchNumber: i,
        nextMatchNumber: Math.ceil(i / 2),
        date: "",
        time: "",
        venue: "Stadion Gelora Babakan Girihieum",
        homeTeamId: "",
        awayTeamId: "",
        homeTeamName: "",
        awayTeamName: "",
      });
    }

    // Setup Semi Finals (2 matches)
    for (let i = 1; i <= 2; i++) {
      await addKnockoutMatch({
        round: "SEMI",
        matchNumber: i,
        nextMatchNumber: 1,
        date: "",
        time: "",
        venue: "Stadion Gelora Babakan Girihieum",
        homeTeamId: "",
        awayTeamId: "",
        homeTeamName: "",
        awayTeamName: "",
      });
    }

    // Setup Final (1 match)
    await addKnockoutMatch({
      round: "FINAL",
      matchNumber: 1,
      date: "",
      time: "",
      venue: "Stadion Gelora Babakan Girihieum",
      homeTeamId: "",
      awayTeamId: "",
      homeTeamName: "",
      awayTeamName: "",
    });

    return true;
  } catch (error) {
    console.error("Error setting up knockout stage:", error);
    throw error;
  }
}

export async function setQualifiedTeams() {
  try {
    // Get all standings
    const standingsRef = collection(db, "standings");
    const standingsSnapshot = await getDocs(standingsRef);
    const standings = standingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Standing[];

    // Group standings by group
    const groupedStandings = standings.reduce((acc, standing) => {
      if (!acc[standing.groupId]) {
        acc[standing.groupId] = [];
      }
      acc[standing.groupId].push(standing);
      return acc;
    }, {} as Record<string, Standing[]>);

    // Sort each group by points, goal difference, and goals for
    Object.values(groupedStandings).forEach(group => {
      group.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });
    });

    // Get all quarter-final matches
    const matchesRef = collection(db, "matches");
    const quarterFinalsQuery = query(matchesRef, where("round", "==", "QUARTER"));
    const quarterFinalsSnapshot = await getDocs(quarterFinalsQuery);
    const quarterFinals = quarterFinalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as KnockoutMatch[];

    // Sort quarter finals by match number
    const sortedQuarterFinals = quarterFinals.sort((a, b) => a.matchNumber - b.matchNumber);

    // Assign teams to quarter-final matches according to the system:
    // QF1: Winner A vs Runner-up B
    // QF2: Winner B vs Runner-up A
    // QF3: Winner C vs Runner-up D
    // QF4: Winner D vs Runner-up C
    const matchAssignments = [
      { winner: "A", runnerUp: "B" },  // QF1
      { winner: "B", runnerUp: "A" },  // QF2
      { winner: "C", runnerUp: "D" },  // QF3
      { winner: "D", runnerUp: "C" }   // QF4
    ];

    // Update quarter-final matches with qualified teams
    for (let i = 0; i < sortedQuarterFinals.length; i++) {
      const match = sortedQuarterFinals[i];
      const assignment = matchAssignments[i];

      // Find the group IDs that match our assignment
      const winnerGroupId = Object.keys(groupedStandings).find(
        groupId => groupId === assignment.winner
      );
      const runnerUpGroupId = Object.keys(groupedStandings).find(
        groupId => groupId === assignment.runnerUp
      );

      if (!winnerGroupId || !runnerUpGroupId) {
        console.error(`Could not find groups for winner ${assignment.winner} or runner-up ${assignment.runnerUp}`);
        continue;
      }

      const homeTeam = groupedStandings[winnerGroupId][0]; // Winner (1st place)
      const awayTeam = groupedStandings[runnerUpGroupId][1]; // Runner-up (2nd place)

      if (homeTeam && awayTeam) {
        await updateDoc(doc(db, "matches", match.id), {
          homeTeamId: homeTeam.teamId,
          homeTeamName: homeTeam.teamName,
          awayTeamId: awayTeam.teamId,
          awayTeamName: awayTeam.teamName,
          status: "scheduled", // Reset status
          homeScore: 0, // Reset score
          awayScore: 0, // Reset score
          winner: null, // Reset winner
          goals: [], // Reset goals
          cards: { home: [], away: [] } // Reset cards
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error setting qualified teams:", error);
    throw error;
  }
}

export async function deleteQuarterFinalMatches() {
  try {
    // Get all knockout matches
    const matchesRef = collection(db, "matches");
    const knockoutQuery = query(
      matchesRef, 
      where("round", "in", ["QUARTER", "SEMI", "FINAL"])
    );
    const knockoutSnapshot = await getDocs(knockoutQuery);
    
    // Delete each knockout match
    const deletePromises = knockoutSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    return true;
  } catch (error) {
    console.error("Error deleting knockout matches:", error);
    throw error;
  }
}
