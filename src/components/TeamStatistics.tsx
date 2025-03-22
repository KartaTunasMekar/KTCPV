import { useMemo } from 'react';
import { Match } from '../types';
import { Card } from './ui/card';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface TeamStatisticsProps {
  matches: Match[];
  teamId?: string;
}

interface ScheduleConflict {
  type: 'same_day' | 'consecutive_days';
  matches: Match[];
}

const TeamStatistics = ({ matches, teamId }: TeamStatisticsProps) => {
  const statistics = useMemo(() => {
    if (!teamId) {
      return {
        totalMatches: matches.length,
        averageRestDays: 0,
        restDistribution: {} as Record<number, number>,
        matchesByTime: {} as Record<string, number>,
        conflicts: [] as ScheduleConflict[]
      };
    }

    // Filter matches for selected team
    const teamMatches = matches.filter(match => 
      match.homeTeamId === teamId || match.awayTeamId === teamId
    );

    // Sort matches by date and time
    const sortedMatches = [...teamMatches].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // Check for schedule conflicts
    const conflicts: ScheduleConflict[] = [];

    // 1. Check for multiple matches in same day
    const matchesByDate = sortedMatches.reduce((acc, match) => {
      (acc[match.date] = acc[match.date] || []).push(match);
      return acc;
    }, {} as Record<string, Match[]>);

    Object.entries(matchesByDate).forEach(([_, dateMatches]) => {
      if (dateMatches.length > 1) {
        conflicts.push({
          type: 'same_day',
          matches: dateMatches
        });
      }
    });

    // 2. Check for consecutive days
    for (let i = 1; i < sortedMatches.length; i++) {
      const prevMatch = new Date(sortedMatches[i-1].date);
      const currentMatch = new Date(sortedMatches[i].date);
      const diffTime = Math.abs(currentMatch.getTime() - prevMatch.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        conflicts.push({
          type: 'consecutive_days',
          matches: [sortedMatches[i-1], sortedMatches[i]]
        });
      }
    }

    // Calculate rest days between matches
    const restDays: number[] = [];
    for (let i = 1; i < sortedMatches.length; i++) {
      const prevMatch = new Date(sortedMatches[i-1].date);
      const currentMatch = new Date(sortedMatches[i].date);
      const diffTime = Math.abs(currentMatch.getTime() - prevMatch.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      restDays.push(diffDays);
    }

    // Calculate average rest days
    const averageRestDays = restDays.length > 0 
      ? restDays.reduce((a, b) => a + b, 0) / restDays.length 
      : 0;

    // Calculate rest days distribution
    const restDistribution = restDays.reduce((acc, days) => {
      acc[days] = (acc[days] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Calculate matches by time slot
    const matchesByTime = teamMatches.reduce((acc, match) => {
      acc[match.time] = (acc[match.time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalMatches: teamMatches.length,
      averageRestDays,
      restDistribution,
      matchesByTime,
      conflicts
    };
  }, [matches, teamId]);

  if (!teamId) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Pertandingan</h3>
          <p className="text-2xl font-bold">{statistics.totalMatches}</p>
        </Card>
      </div>
    );
  }

  const hasConflicts = statistics.conflicts.length > 0;

  return (
    <div className="space-y-6">
      {hasConflicts && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Peringatan Jadwal</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {statistics.conflicts.map((conflict, index) => {
                if (conflict.type === 'same_day') {
                  const date = new Date(conflict.matches[0].date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                  return (
                    <div key={index} className="text-sm">
                      ⚠️ Tim bermain {conflict.matches.length} kali pada {date}:
                      <ul className="ml-6 list-disc">
                        {conflict.matches.map((match, idx) => (
                          <li key={idx}>
                            {match.time} - vs {match.homeTeamId === teamId ? match.awayTeamName : match.homeTeamName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                } else {
                  const dates = conflict.matches.map(m => 
                    new Date(m.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })
                  );
                  return (
                    <div key={index} className="text-sm">
                      ⚠️ Tim bermain pada hari berturut-turut:
                      <ul className="ml-6 list-disc">
                        {conflict.matches.map((match, idx) => (
                          <li key={idx}>
                            {dates[idx]} - {match.time} vs {match.homeTeamId === teamId ? match.awayTeamName : match.homeTeamName}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              })}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-4 ${hasConflicts ? 'border-red-500 border-2' : ''}`}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Pertandingan</h3>
          <p className="text-2xl font-bold">{statistics.totalMatches}</p>
        </Card>

        <Card className={`p-4 ${hasConflicts ? 'border-red-500 border-2' : ''}`}>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Rata-rata Hari Istirahat</h3>
          <p className="text-2xl font-bold">{statistics.averageRestDays.toFixed(1)} hari</p>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Jadwal Terbanyak</h3>
          <p className="text-2xl font-bold">
            {Object.entries(statistics.matchesByTime)
              .sort(([,a], [,b]) => b - a)[0]?.[0] || '-'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Distribusi Hari Istirahat</h3>
          <div className="space-y-2">
            {Object.entries(statistics.restDistribution)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([days, count]) => (
                <div key={days} className="flex justify-between items-center">
                  <span>{days} hari:</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-primary/20 rounded" 
                      style={{ width: `${count * 30}px` }} />
                    <span className="text-sm">{count}x</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Distribusi Waktu Pertandingan</h3>
          <div className="space-y-2">
            {Object.entries(statistics.matchesByTime)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([time, count]) => (
                <div key={time} className="flex justify-between items-center">
                  <span>{time}:</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-primary/20 rounded" 
                      style={{ width: `${count * 30}px` }} />
                    <span className="text-sm">{count}x</span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeamStatistics; 