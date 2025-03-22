import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader, Upload } from 'lucide-react';
import { Team } from "../types";
import { saveTeamToFirestore, updateTeam } from "../lib/firestoreService";
import { useToast } from "./ui/use-toast";
import { groups } from "../lib/utils";
import { doc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

interface TeamFormProps {
  team?: Team;
  onClose: (shouldRefresh?: boolean) => void;
  onSave: (team: Team) => void;
}

export function TeamForm({ team, onClose, onSave }: TeamFormProps) {
  const [name, setName] = useState(team?.name || "");
  const [groupId, setGroupId] = useState(team?.groupId || "");
  const [logo, setLogo] = useState(team?.logo || "");
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logo || null);
  
  const { toast } = useToast();
  const isEditing = !!team;

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Create a preview
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setLogo(result); // Set logo value to base64 string
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const teamData = {
        id: team?.id || doc(collection(db, 'teams')).id,
        name,
        groupId,
        logo,
        players: team?.players || []
      };

      if (team) {
        await updateTeam(teamData);
      } else {
        await saveTeamToFirestore(teamData);
      }

      toast({
        title: "Berhasil",
        description: `Tim ${name} telah ${team ? 'diperbarui' : 'ditambahkan'}.`,
      });

      onSave(teamData);
      onClose(true);
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan tim. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="team-form-description">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tim" : "Tambah Tim Baru"}</DialogTitle>
          <DialogDescription id="team-form-description">
            {isEditing ? "Edit informasi tim yang sudah ada" : "Tambahkan tim baru ke turnamen"}
          </DialogDescription>
          <div className="mt-1 text-xs text-muted-foreground">
            Setiap tim harus memiliki minimal 11 pemain dan maksimal 20 pemain.
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4" id="team-form-content">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Tim</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama tim"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="group">Grup</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger id="group">
                <SelectValue placeholder="Pilih grup" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group} value={group}>Grup {group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logo">Logo Tim</Label>
            <div className="flex flex-col items-center gap-4">
              {logoPreview && (
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-muted flex items-center justify-center bg-muted">
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("logo")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {logoPreview ? "Ganti Logo" : "Unggah Logo"}
                </Button>
                
                {logoPreview && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setLogoPreview(null);
                      setLogo("");
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
              {isEditing ? "Perbarui Tim" : "Tambah Tim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
