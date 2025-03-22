import { useState } from "react";
import { KnockoutMatch } from "@/types/knockout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface KnockoutMatchDialogProps {
  match: KnockoutMatch;
  isOpen: boolean;
  onClose: () => void;
  onSave: (match: KnockoutMatch) => void;
}

export function KnockoutMatchDialog({
  match,
  isOpen,
  onClose,
  onSave,
}: KnockoutMatchDialogProps) {
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() || "0");
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() || "0");
  const [date, setDate] = useState(match.date || "");
  const [time, setTime] = useState(match.time || "");
  const [venue, setVenue] = useState(match.venue || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Validasi input
      if (!date || !time || !venue) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Mohon lengkapi semua field",
        });
        return;
      }

      const updatedMatch: KnockoutMatch = {
        ...match,
        homeScore: parseInt(homeScore),
        awayScore: parseInt(awayScore),
        date,
        time,
        venue,
        status: "completed",
        winner:
          parseInt(homeScore) > parseInt(awayScore)
            ? { id: match.homeTeamId, name: match.homeTeamName }
            : parseInt(awayScore) > parseInt(homeScore)
            ? { id: match.awayTeamId, name: match.awayTeamName }
            : undefined,
      };

      await onSave(updatedMatch);
      onClose();
      
      toast({
        title: "Berhasil",
        description: "Data pertandingan berhasil disimpan",
      });
    } catch (error) {
      console.error("Error saving match:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan data pertandingan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Pertandingan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Waktu</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Venue</Label>
            <Input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{match.homeTeamName || "TBD"}</Label>
            <Input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={!match.homeTeamId}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{match.awayTeamName || "TBD"}</Label>
            <Input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={!match.awayTeamId}
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 