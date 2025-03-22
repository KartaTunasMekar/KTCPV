import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plus, Trash2 } from 'lucide-react';
import { Team, Player } from "../types";
import { cn } from "../lib/utils";
import { deletePlayer } from "../lib/firestoreService";
import { useToast } from "./ui/use-toast";

// Fungsi untuk memeriksa validitas foto
const isValidPhoto = (photo: string): boolean => {
  if (!photo) return false;
  if (photo.trim() === '') return false;
  if (photo === '00' || photo === '"00"' || photo === '""00""') return false;
  return photo.startsWith('data:image/') || photo.startsWith('http');
};

// Fungsi untuk membersihkan data pemain
const cleanPlayerData = (player: Player): Player => {
  return {
    ...player,
    number: player.number === 0 ? 99 : player.number,
    photo: isValidPhoto(player.photo) ? player.photo : ''
  };
};

interface TeamCardProps {
  team: Team;
  onAddPlayer: () => void;
  onPlayerDeleted?: () => void;
}

export const TeamCard = ({ team, onAddPlayer, onPlayerDeleted }: TeamCardProps) => {
  const [expanded, setExpanded] = React.useState(false);
  const { toast } = useToast();

  const getPlayerInitials = (name: string) => {
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Fungsi untuk mendapatkan urutan posisi
  const getPositionOrder = (position: string): number => {
    const pos = position.toLowerCase();
    if (pos.includes('penjaga gawang') || pos.includes('kiper')) return 0;
    if (pos.includes('bek')) return 1;
    if (pos.includes('gelandang')) return 2;
    if (pos.includes('penyerang')) return 3;
    return 4;
  };

  // Fungsi untuk mengurutkan pemain
  const sortPlayers = (players: Player[]): Player[] => {
    return [...players].sort((a, b) => {
      // Urutkan berdasarkan posisi
      const positionOrder = getPositionOrder(a.position) - getPositionOrder(b.position);
      if (positionOrder !== 0) return positionOrder;
      
      // Jika posisi sama, urutkan berdasarkan nomor punggung
      return (a.number || 99) - (b.number || 99);
    });
  };

  // Bersihkan data pemain dari nilai "00" dan urutkan
  const cleanedPlayers = sortPlayers(team.players?.map(cleanPlayerData) || []);

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayer(playerId, team.id);
      toast({
        title: "Berhasil",
        description: "Pemain berhasil dihapus",
      });
      if (onPlayerDeleted) {
        onPlayerDeleted();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus pemain",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 border-primary/20 bg-primary/10">
              {team.logo ? (
                <AvatarImage src={team.logo} alt={team.name} />
              ) : (
                <AvatarFallback className="text-base sm:text-lg font-bold">
                  {getPlayerInitials(team.name)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-base sm:text-lg">{team.name}</CardTitle>
              <p className="text-xs sm:text-sm text-primary">Grup {team.groupId}</p>
              <p className={cn(
                "text-xs sm:text-sm",
                cleanedPlayers.length < 11 ? "text-destructive font-semibold" : 
                cleanedPlayers.length === 11 ? "text-amber-500 font-semibold" : 
                "text-muted-foreground"
              )}>
                {cleanedPlayers.length || 0} pemain
                {cleanedPlayers.length < 11 && " (kurang dari minimal)"}
                {cleanedPlayers.length > 20 && " (melebihi maksimal)"}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={onAddPlayer}>
            <Plus className="h-3 w-3 mr-1" /> Pemain
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {expanded && (
          <div className="p-2 sm:p-4 space-y-2 sm:space-y-4">
            <div className="space-y-2">
              {/* Penjaga Gawang */}
              {cleanedPlayers.filter(p => getPositionOrder(p.position) === 0).length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2">Penjaga Gawang</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {cleanedPlayers
                      .filter(p => getPositionOrder(p.position) === 0)
                      .map(player => (
                        <div key={player.id} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-primary/20">
                            {isValidPhoto(player.photo) ? (
                              <AvatarImage src={player.photo} alt={player.name} />
                            ) : (
                              <AvatarFallback className="text-[10px] sm:text-xs font-medium bg-primary/10">
                                {getPlayerInitials(player.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="w-4 sm:w-6 text-center font-medium">{player.number}</span>
                          <span className="flex-1 truncate">{player.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 sm:h-8 text-destructive hover:text-destructive hover:bg-destructive/10 px-1 sm:px-2"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Bek */}
              {cleanedPlayers.filter(p => getPositionOrder(p.position) === 1).length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2">Bek</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {cleanedPlayers
                      .filter(p => getPositionOrder(p.position) === 1)
                      .map(player => (
                        <div key={player.id} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-primary/20">
                            {isValidPhoto(player.photo) ? (
                              <AvatarImage src={player.photo} alt={player.name} />
                            ) : (
                              <AvatarFallback className="text-[10px] sm:text-xs font-medium bg-primary/10">
                                {getPlayerInitials(player.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="w-4 sm:w-6 text-center font-medium">{player.number}</span>
                          <span className="flex-1 truncate">{player.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 sm:h-8 text-destructive hover:text-destructive hover:bg-destructive/10 px-1 sm:px-2"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Gelandang */}
              {cleanedPlayers.filter(p => getPositionOrder(p.position) === 2).length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2">Gelandang</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {cleanedPlayers
                      .filter(p => getPositionOrder(p.position) === 2)
                      .map(player => (
                        <div key={player.id} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-primary/20">
                            {isValidPhoto(player.photo) ? (
                              <AvatarImage src={player.photo} alt={player.name} />
                            ) : (
                              <AvatarFallback className="text-[10px] sm:text-xs font-medium bg-primary/10">
                                {getPlayerInitials(player.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="w-4 sm:w-6 text-center font-medium">{player.number}</span>
                          <span className="flex-1 truncate">{player.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 sm:h-8 text-destructive hover:text-destructive hover:bg-destructive/10 px-1 sm:px-2"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Penyerang */}
              {cleanedPlayers.filter(p => getPositionOrder(p.position) === 3).length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2">Penyerang</h4>
                  <div className="space-y-1 sm:space-y-2">
                    {cleanedPlayers
                      .filter(p => getPositionOrder(p.position) === 3)
                      .map(player => (
                        <div key={player.id} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 border border-primary/20">
                            {isValidPhoto(player.photo) ? (
                              <AvatarImage src={player.photo} alt={player.name} />
                            ) : (
                              <AvatarFallback className="text-[10px] sm:text-xs font-medium bg-primary/10">
                                {getPlayerInitials(player.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span className="w-4 sm:w-6 text-center font-medium">{player.number}</span>
                          <span className="flex-1 truncate">{player.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 sm:h-8 text-destructive hover:text-destructive hover:bg-destructive/10 px-1 sm:px-2"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full h-8 text-xs sm:text-sm hover:bg-primary/5"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Sembunyikan Pemain" : "Lihat Pemain"}
        </Button>
      </CardContent>
    </Card>
  );
}; 