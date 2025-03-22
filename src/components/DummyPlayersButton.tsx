import { useState } from 'react';
import { Button } from './ui/button';
import { Loader, UserPlus } from 'lucide-react';
import { addDummyPlayersToTeams } from '../scripts/addDummyPlayers';
import { useToast } from './ui/use-toast';

interface DummyPlayersButtonProps {
  onSuccess?: () => void; // Callback untuk refresh data setelah berhasil
}

export const DummyPlayersButton = ({ onSuccess }: DummyPlayersButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddDummyPlayers = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const success = await addDummyPlayersToTeams();
      
      if (success) {
        toast({
          title: 'Berhasil',
          description: 'Pemain dummy berhasil ditambahkan ke semua tim',
          variant: 'default',
        });
        
        // Panggil callback onSuccess jika ada
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: 'Gagal',
          description: 'Terjadi kesalahan saat menambahkan pemain dummy',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menambahkan pemain dummy',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="secondary" // Ubah dari default ke secondary untuk warna berbeda
      onClick={handleAddDummyPlayers}
      disabled={loading}
      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white"
    >
      {loading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      {loading ? 'Menambahkan Pemain Dummy...' : 'Tambah Pemain Dummy'}
    </Button>
  );
}; 