import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader, Upload } from 'lucide-react';
import { Team, Player } from "../types";
import { useToast } from "./ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { compressAndConvertToBase64 } from "../lib/imageUtils";
import { addPlayer, updatePlayer } from "../lib/firestoreService";

interface PlayerFormProps {
  team: Team;
  player?: Player;
  onClose: (shouldRefresh?: boolean) => void;
}

// Fungsi untuk memeriksa apakah foto valid
const isValidPhoto = (photo: string | null | undefined): boolean => {
  if (!photo) return false;
  if (typeof photo !== 'string') return false;
  if (photo.trim() === '') return false;
  // Pastikan foto adalah base64 image yang valid
  return photo.startsWith('data:image/');
};

export function PlayerForm({ team, player, onClose }: PlayerFormProps) {
  const [name, setName] = useState(player?.name || "");
  const [number, setNumber] = useState(player?.number?.toString() || "");
  const [position, setPosition] = useState(player?.position || "");
  
  // Periksa apakah foto valid dengan logika baru
  const initialPhoto = player?.photo && isValidPhoto(player.photo) ? player.photo : null;
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhoto);
  
  const { toast } = useToast();
  const isEditing = !!player;

  const positions = [
    "Penjaga Gawang",
    "Bek",
    "Gelandang",
    "Penyerang"
  ];

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        
        // Kompres dan konversi gambar ke base64
        const compressedBase64 = await compressAndConvertToBase64(file);
        
        // Update state
        setPhotoPreview(compressedBase64);
        setPhoto(compressedBase64);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Gagal memproses foto. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !number || !position) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    // Validasi nomor punggung
    const playerNumber = parseInt(number);
    if (isNaN(playerNumber) || playerNumber < 1 || playerNumber > 99) {
      toast({
        title: "Error",
        description: "Nomor punggung harus antara 1-99",
        variant: "destructive",
      });
      return;
    }

    // Cek duplikasi nomor punggung
    const existingPlayer = team.players.find(p => 
      p.number === playerNumber && (!player || p.id !== player.id)
    );

    if (existingPlayer) {
      toast({
        title: "Error",
        description: `Nomor punggung ${playerNumber} sudah digunakan oleh ${existingPlayer.name}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const playerData: Player = {
        id: player?.id || uuidv4(),
        name,
        number: playerNumber,
        position,
        teamId: team.id,
        teamName: team.name,
        photo: photo || '',
        yellowCards: player?.yellowCards || 0,
        redCards: player?.redCards || 0,
        suspended: player?.suspended || false
      };

      if (isEditing) {
        await updatePlayer(playerData);
      } else {
        await addPlayer(playerData);
      }

      toast({
        title: isEditing ? "Pemain Diperbarui" : "Pemain Ditambahkan",
        description: `${name} telah berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'} ke tim ${team.name}`,
      });
      
      onClose(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Gagal ${isEditing ? 'memperbarui' : 'menambahkan'} pemain. Silakan coba lagi.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="player-form-description">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Pemain" : "Tambah Pemain Baru"}</DialogTitle>
          <DialogDescription id="player-form-description">
            {isEditing ? "Edit informasi pemain yang sudah ada" : "Tambahkan pemain baru ke tim"}
          </DialogDescription>
          <div className="mt-1 text-xs text-muted-foreground">
            Setiap tim harus memiliki minimal 11 pemain dan maksimal 20 pemain.
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Pemain</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama pemain"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="number">Nomor Punggung</Label>
            <Input
              id="number"
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Masukkan nomor punggung"
              min="1"
              max="99"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Posisi</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position">
                <SelectValue placeholder="Pilih posisi pemain" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photo">Foto Pemain</Label>
            <div className="flex flex-col items-center gap-4">
              {photoPreview && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-muted flex items-center justify-center bg-muted">
                  <img src={photoPreview} alt="Player Photo Preview" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("photo")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {photoPreview ? "Ganti Foto" : "Unggah Foto"}
                </Button>
                
                {photoPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhoto(null);
                    }}
                  >
                    Hapus
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Perbarui Pemain" : "Tambah Pemain"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
