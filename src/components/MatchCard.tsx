import { Match } from "../types";
import { Card, CardContent } from "./ui/card";
import { MapPin, CheckCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const isCompleted = match.status === 'completed';

  return (
    <Card className={cn(
      isCompleted && "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 relative overflow-hidden"
    )}>
      {isCompleted && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs py-1 px-2 rounded-br-md font-medium">
          SELESAI
        </div>
      )}
      <CardContent className={cn(
        "p-4",
        isCompleted && "relative pt-6"
      )}>
        {isCompleted && (
          <div className="absolute top-2 right-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        )}
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>{match.time}</span>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{match.venue}</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className={cn(
                "font-semibold truncate",
                isCompleted && "text-green-700 dark:text-green-400 line-through decoration-1"
              )}>
                {match.homeTeamName}
              </p>
            </div>
            <div className="px-4">VS</div>
            <div className="flex-1 text-right">
              <p className={cn(
                "font-semibold truncate",
                isCompleted && "text-green-700 dark:text-green-400 line-through decoration-1"
              )}>
                {match.awayTeamName}
              </p>
            </div>
          </div>

          <div className="text-xs text-center">
            {isCompleted ? (
              <div className="space-y-1">
                <span className="font-bold text-green-700 dark:text-green-400 text-sm block">
                  {match.homeTeamName} {match.homeScore} - {match.awayScore} {match.awayTeamName}
                </span>
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-500 text-xs">
                  <span>Pertandingan telah selesai</span>
                  <span>•</span>
                  <span>Grup {match.groupId}</span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Grup {match.groupId}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard; 