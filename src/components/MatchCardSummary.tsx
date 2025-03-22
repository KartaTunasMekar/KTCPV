import { Card as CardType } from '../types';

interface MatchCardSummaryProps {
  homeCards: CardType[];
  awayCards: CardType[];
}

export function MatchCardSummary({ homeCards, awayCards }: MatchCardSummaryProps) {
  const renderCardList = (cards: CardType[]) => {
    return (
      <div className="space-y-2">
        {cards.map((card) => (
          <div 
            key={card.id} 
            className="flex items-center gap-2"
          >
            <div 
              className={`w-3 h-4 ${
                card.type === 'yellow' ? 'bg-yellow-400' : 'bg-red-600'
              } rounded`} 
            />
            <span className="text-sm">
              {card.playerName} ({card.minute}')
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-background rounded-lg shadow">
      {/* Tim Kandang */}
      <div>
        <h3 className="font-semibold mb-2">Tim Kandang</h3>
        {homeCards.length > 0 ? (
          renderCardList(homeCards)
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada kartu</p>
        )}
      </div>

      {/* Tim Tamu */}
      <div>
        <h3 className="font-semibold mb-2">Tim Tamu</h3>
        {awayCards.length > 0 ? (
          renderCardList(awayCards)
        ) : (
          <p className="text-sm text-muted-foreground">Tidak ada kartu</p>
        )}
      </div>

      {/* Ringkasan */}
      <div className="col-span-2 mt-4 pt-4 border-t">
        <h3 className="font-semibold mb-2">Ringkasan Kartu</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p>Kartu Kuning: {homeCards.filter(c => c.type === 'yellow').length}</p>
            <p>Kartu Merah: {homeCards.filter(c => c.type === 'red').length}</p>
          </div>
          <div>
            <p>Kartu Kuning: {awayCards.filter(c => c.type === 'yellow').length}</p>
            <p>Kartu Merah: {awayCards.filter(c => c.type === 'red').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 