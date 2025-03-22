export interface Team {
  id: string;
  name: string;
  groupId: string;
  logo: string;
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  number: number;
  teamId: string;
  position: string;
  photo: string;
  teamName: string;
  yellowCards: number;
  redCards: number;
  suspended: boolean;
}

export interface Match {
  id: string;
  date: string;
  time: string;
  venue: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'completed';
  groupId: string;
  goals: Goal[];
  cards: {
    home: Card[];
    away: Card[];
  };
}

export interface Goal {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minute: number;
  playerName: string;
  teamName: string;
}

export interface Card {
  id: string;
  matchId: string;
  playerId: string;
  teamId: string;
  minute: number;
  type: 'yellow' | 'red';
  playerName: string;
  teamName: string;
}

export interface Suspension {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  reason: 'red_card' | 'yellow_accumulation';
  matchesCount: number;
  startDate: string;
  endDate: string;
}

export interface Standing {
  id: string;
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  groupId: string;
}

export interface TopScorer {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  goals: number;
}

export interface PlayerCard {
  playerId: string;
  playerName: string;
  yellowCards: number;
  redCards: number;
  isBanned: boolean;
  teamId: string;
  teamName: string;
  lastUpdated: Date;
  matchDate: string;
  matchTime: string;
  opponentTeamName: string;
  matchId: string;
  finePaid?: boolean;
  fineAmount?: number;
  finePaidDate?: string;
}
