import { Match } from "./index";

export type KnockoutRound = "QUARTER" | "SEMI" | "FINAL";

export interface KnockoutWinner {
  id: string;
  name: string;
}

export interface KnockoutMatch extends Match {
  round: KnockoutRound;
  matchNumber: number; // Untuk menentukan urutan pertandingan
  nextMatchNumber?: number; // Nomor pertandingan berikutnya jika tim ini menang
  winner?: KnockoutWinner; // Tim yang menang di pertandingan ini
}

export interface KnockoutStage {
  quarterFinals: KnockoutMatch[];
  semiFinals: KnockoutMatch[];
  final: KnockoutMatch[];
} 