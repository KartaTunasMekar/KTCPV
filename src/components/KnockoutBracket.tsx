import { KnockoutMatch, KnockoutStage } from "@/types/knockout";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useState } from "react";
import { Button } from "./ui/button";

interface KnockoutBracketProps {
  knockoutStage: KnockoutStage;
  onMatchClick?: (match: KnockoutMatch) => void;
}

export function KnockoutBracket({ knockoutStage, onMatchClick }: KnockoutBracketProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => setShowInfo(!showInfo)}
        >
          <Info className="h-4 w-4" />
          <span>Informasi Sistem Knockout</span>
          {showInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {showInfo && (
        <Alert>
          <AlertDescription className="ml-2">
            <p className="font-medium mb-2">Sistem Pertandingan Knockout:</p>
            
            <p className="text-sm mb-4">Tombol "Atur Tim yang Lolos" akan secara otomatis mengambil 2 tim teratas dari setiap grup (Juara & Runner-up) berdasarkan klasemen akhir grup, lalu menempatkan mereka ke dalam pertandingan perempat final sesuai dengan bagan di bawah ini.</p>
            
            <p className="font-medium mt-4">Perempat Final:</p>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>QF1: Juara Grup A vs Runner-up Grup B</li>
              <li>QF2: Juara Grup B vs Runner-up Grup A</li>
              <li>QF3: Juara Grup C vs Runner-up Grup D</li>
              <li>QF4: Juara Grup D vs Runner-up Grup C</li>
            </ul>

            <p className="font-medium mt-4">Semifinal (Otomatis):</p>
            <ul className="list-disc ml-6 mt-1 space-y-1">
              <li>SF1: Pemenang QF1 vs Pemenang QF3</li>
              <li>SF2: Pemenang QF2 vs Pemenang QF4</li>
              <li className="text-sm text-muted-foreground mt-1">Tim akan otomatis masuk ke semifinal setelah hasil perempat final diinput</li>
            </ul>

            <p className="font-medium mt-4">Final (Otomatis):</p>
            <ul className="list-disc ml-6 mt-1">
              <li>Pemenang SF1 vs Pemenang SF2</li>
              <li className="text-sm text-muted-foreground mt-1">Tim akan otomatis masuk ke final setelah hasil semifinal diinput</li>
            </ul>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="font-medium mb-2">Input Hasil Pertandingan (Perempat Final, Semifinal, dan Final):</p>
              <p className="text-sm mb-2">Untuk semua tahap knockout (perempat final, semifinal, dan final), klik pada kartu pertandingan untuk membuka form input hasil. Sama seperti di halaman "Input Hasil", Anda dapat mengisi:</p>
              <ul className="list-disc ml-4 space-y-1 text-sm">
                <li>Skor pertandingan</li>
                <li>Detail gol (menit dan pemain yang mencetak)</li>
                <li>Kartu kuning dan merah</li>
                <li>Tanggal dan waktu pertandingan</li>
                <li>Tempat pertandingan</li>
              </ul>
              <p className="mt-2 text-sm text-muted-foreground">Tim pemenang akan otomatis maju ke babak berikutnya setelah hasil pertandingan disimpan. Proses input hasil sama untuk semua tahap knockout.</p>
            </div>

            <div className="mt-4 text-sm text-muted-foreground space-y-2">
              <p>Pastikan semua pertandingan grup telah selesai dan klasemen akhir sudah benar sebelum menggunakan tombol "Atur Tim yang Lolos".</p>
              <p>Setelah hasil pertandingan diinput, tim pemenang akan otomatis maju ke babak berikutnya. Anda tidak perlu mengatur tim untuk semifinal dan final secara manual.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-8 p-4">
        {/* Quarter Finals */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4">Perempat Final</h3>
          <div className="space-y-4">
            {knockoutStage.quarterFinals.map((match) => (
              <Card
                key={match.id}
                className={cn(
                  "p-4 cursor-pointer hover:bg-accent transition-colors",
                  match.winner && "border-green-500"
                )}
                onClick={() => onMatchClick?.(match)}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{match.homeTeamName || "Belum Ditentukan"}</span>
                      <span className="font-semibold">{match.homeScore || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{match.awayTeamName || "Belum Ditentukan"}</span>
                      <span className="font-semibold">{match.awayScore || 0}</span>
                    </div>
                  </div>
                  {(match.date || match.time || match.venue) && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {(match.date || match.time) && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            {match.date} {match.time}
                          </span>
                        </div>
                      )}
                      {match.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{match.venue}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Semi Finals */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4">Semi Final</h3>
          <div className="space-y-4">
            {knockoutStage.semiFinals.map((match) => (
              <Card
                key={match.id}
                className={cn(
                  "p-4 cursor-pointer hover:bg-accent transition-colors",
                  match.winner && "border-green-500"
                )}
                onClick={() => onMatchClick?.(match)}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{match.homeTeamName || "Belum Ditentukan"}</span>
                      <span className="font-semibold">{match.homeScore || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{match.awayTeamName || "Belum Ditentukan"}</span>
                      <span className="font-semibold">{match.awayScore || 0}</span>
                    </div>
                  </div>
                  {(match.date || match.time || match.venue) && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {(match.date || match.time) && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            {match.date} {match.time}
                          </span>
                        </div>
                      )}
                      {match.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{match.venue}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Final */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4">Final</h3>
          <div className="space-y-4">
            {knockoutStage.final.map((match) => (
              <Card
                key={match.id}
                className={cn(
                  "p-4 cursor-pointer hover:bg-accent transition-colors",
                  match.winner && "border-green-500"
                )}
                onClick={() => onMatchClick?.(match)}
              >
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span>{match.homeTeamName || "Belum Ditentukan"}</span>
                      <span className="font-semibold">{match.homeScore || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{match.awayTeamName || "Belum Ditentukan"}</span>
                      <span className="font-semibold">{match.awayScore || 0}</span>
                    </div>
                  </div>
                  {(match.date || match.time || match.venue) && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {(match.date || match.time) && (
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>
                            {match.date} {match.time}
                          </span>
                        </div>
                      )}
                      {match.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{match.venue}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {match.winner && (
                    <div className="mt-2 text-center text-green-500 font-semibold">
                      Juara: {match.winner.name}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 