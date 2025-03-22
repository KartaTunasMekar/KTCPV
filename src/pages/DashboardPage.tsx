import { Link } from "react-router-dom";
import { Calendar, List, Shield, Goal } from 'lucide-react';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getMatchesFromFirestore, getTeams, getGoalsFromFirestore } from "../lib/firestoreService";
import { useEffect, useState } from "react";
import type { Match, Team, Standing } from "../types";
import { DashboardStandings } from "../components/DashboardStandings";

const DashboardPage = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allCompletedMatches, setAllCompletedMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [topScorers, setTopScorers] = useState<Array<{
    id: string;
    name: string;
    teamName: string;
    goals: number;
    photo?: string;
  }>>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data
        const [teamsData, allMatchesData, goalsData] = await Promise.all([
          getTeams(),
          getMatchesFromFirestore(),
          getGoalsFromFirestore()
        ]);

        // Set teams data
        setTeams(teamsData);
        setAllMatches(allMatchesData);

        const today = new Date().toISOString().split('T')[0];

        // Filter and sort upcoming matches
        const allUpcomingMatches = allMatchesData.filter(match =>
          match.status === "scheduled" && match.date >= today
        );

        // Get top 5 upcoming matches for display
        const upcomingMatchesData = allUpcomingMatches
          .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
          })
          .slice(0, 5);
        setUpcomingMatches(upcomingMatchesData);

        // Filter and sort recent results
        const completedMatches = allMatchesData.filter(match =>
          match.status === "completed"
        );
        setAllCompletedMatches(completedMatches);

        // Get top 5 recent results for display
        const recentResultsData = completedMatches
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5);
        setRecentResults(recentResultsData);
        
        // Process goals data
        const scorersMap = new Map<string, {
          id: string;
          name: string;
          teamName: string;
          goals: number;
          photo?: string;
        }>();

        goalsData.forEach(goal => {
          if (!scorersMap.has(goal.playerId)) {
            // Cari foto pemain dari data tim
            const team = teamsData.find(t => t.id === goal.teamId);
            const player = team?.players.find(p => p.id === goal.playerId);
            
            scorersMap.set(goal.playerId, {
              id: goal.playerId,
              name: goal.playerName,
              teamName: goal.teamName,
              goals: 0,
              photo: player?.photo || '/player-placeholder.png'
            });
          }
          const player = scorersMap.get(goal.playerId)!;
          player.goals += 1;
        });

        // Sort and get top 5 scorers
        const sortedScorers = Array.from(scorersMap.values())
          .sort((a, b) => b.goals - a.goals)
          .slice(0, 5);
        
        setTopScorers(sortedScorers);

        // Calculate standings
        const standingsMap = new Map<string, Standing>();

        // Initialize standings for all teams
        teamsData.forEach(team => {
          standingsMap.set(team.id, {
            id: team.id,
            teamId: team.id,
            teamName: team.name,
            matchesPlayed: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
            groupId: team.groupId
          });
        });

        // Calculate standings from completed matches
        completedMatches.forEach(match => {
          if (match.homeScore !== undefined && match.awayScore !== undefined) {
            const homeTeam = standingsMap.get(match.homeTeamId);
            const awayTeam = standingsMap.get(match.awayTeamId);

            if (homeTeam && awayTeam) {
              // Update matches played
              homeTeam.matchesPlayed++;
              awayTeam.matchesPlayed++;

              // Update goals
              homeTeam.goalsFor += match.homeScore;
              homeTeam.goalsAgainst += match.awayScore;
              awayTeam.goalsFor += match.awayScore;
              awayTeam.goalsAgainst += match.homeScore;

              // Update goal difference
              homeTeam.goalDifference = homeTeam.goalsFor - homeTeam.goalsAgainst;
              awayTeam.goalDifference = awayTeam.goalsFor - awayTeam.goalsAgainst;

              // Update wins, draws, losses and points
              if (match.homeScore > match.awayScore) {
                homeTeam.wins++;
                awayTeam.losses++;
                homeTeam.points += 3;
              } else if (match.homeScore < match.awayScore) {
                awayTeam.wins++;
                homeTeam.losses++;
                awayTeam.points += 3;
              } else {
                homeTeam.draws++;
                awayTeam.draws++;
                homeTeam.points += 1;
                awayTeam.points += 1;
              }
            }
          }
        });

        setStandings(Array.from(standingsMap.values()));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero Section Skeleton */}
        <div className="relative overflow-hidden rounded-b-lg bg-gradient-to-r from-primary/50 to-accent/50 p-4 sm:p-8 -mt-6 min-h-[200px] animate-pulse">
          <div className="space-y-4 max-w-2xl">
            <div className="h-8 bg-white/20 rounded-md w-3/4"></div>
            <div className="space-y-2">
              <div className="h-6 bg-white/20 rounded-md w-1/2"></div>
              <div className="h-4 bg-white/20 rounded-md w-2/3"></div>
              <div className="h-4 bg-white/20 rounded-md w-1/2"></div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded-md w-2/3"></div>
                <div className="h-8 bg-muted rounded-md w-1/3"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mt-3 sm:mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded-md w-1/3"></div>
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-16 bg-muted/50 rounded-md"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Transparent Football Background */}
      <div className="relative overflow-hidden rounded-b-lg bg-gradient-to-r from-primary to-accent p-4 sm:p-8 -mt-6 min-h-[200px] transition-all duration-300 ease-in-out">
        {/* Football background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large transparent football in the background */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border-[12px] border-white/20 z-0">
            <div className="absolute inset-4 rounded-full border-[4px] border-white/10"></div>
            <div className="absolute inset-8 rounded-full border-[3px] border-white/10"></div>
          </div>

          {/* Small football patterns */}
          <div className="absolute bottom-10 left-10 w-20 h-20 rounded-full border-[4px] border-white/10"></div>
          <div className="absolute top-24 left-40 w-12 h-12 rounded-full border-[2px] border-white/15"></div>

          {/* Hexagon pattern for football texture */}
          <div className="absolute inset-0 opacity-10 football-pattern"></div>

          {/* Diagonal line patterns resembling football panel seams */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-white/10 transform -rotate-45"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-white/10 transform rotate-45"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-white/10 transform -rotate-30"></div>
        </div>

        {/* Content with higher z-index */}
        <div className="relative z-0 flex items-start">
          {/* Logo Karang Taruna */}
          <div className="hidden lg:block w-40 h-40 absolute -right-4 -top-8 z-0">
            <img 
              src="/karang-taruna-logo.png" 
              alt="Karang Taruna Logo" 
              className="w-full h-full object-contain drop-shadow-lg animate-float [animation-delay:200ms]"
            />
          </div>

          <div className="flex-1 max-w-2xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 text-white drop-shadow-sm transition-all duration-300">
              Selamat Datang di Karta Cup V
            </h1>
            <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
              <p className="text-base sm:text-lg font-semibold text-white/95 animate-pulse transition-all duration-300">
                Jangan Ada Sampah Diantara Kita
              </p>
              <div className="text-sm sm:text-base opacity-90 text-white/95 italic animate-pulse [animation-delay:200ms] transition-all duration-300">
                "Bersih Hati, Bersih Permainan, Bersih Lingkungan"
              </div>
              <div className="text-sm sm:text-base opacity-90 text-white/95 italic animate-pulse [animation-delay:400ms] transition-all duration-300">
                "Jaga Fair Play, Jaga Sportivitas, Jaga Kebersihan"
              </div>
              <div className="text-sm sm:text-base opacity-90 text-white/95 italic animate-pulse [animation-delay:600ms] transition-all duration-300">
                "Satu Tekad, Satu Semangat, Tanpa Sampah"
              </div>
              <div className="text-sm sm:text-base opacity-90 text-white/95 italic animate-pulse [animation-delay:800ms] transition-all duration-300">
                "Bersih dalam Bertanding, Bersih dalam Berperilaku"
              </div>
              <div className="text-sm sm:text-base opacity-90 text-white/95 italic animate-pulse [animation-delay:1000ms] transition-all duration-300">
                "Bersihkan Hati, Bersihkan Bumi"
              </div>
              <div className="mt-8">
                <img 
                  src="/tanda-tangan.png" 
                  alt="Tanda Tangan" 
                  className="h-16 object-contain drop-shadow-lg mix-blend-multiply"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 transition-all duration-300">
        <DashboardCard
          title="Total Tim"
          value={teams.length.toString()}
          icon={<Shield className="h-4 w-4 sm:h-5 sm:w-5" />}
          linkTo="/teams"
          color="primary"
        />
        <DashboardCard
          title="Total Pertandingan"
          value={(allMatches || []).length.toString()}
          icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5" />}
          linkTo="/schedule"
          color="accent"
        />
        <DashboardCard
          title="Pertandingan Selesai"
          value={(allCompletedMatches || []).length.toString()}
          icon={<List className="h-4 w-4 sm:h-5 sm:w-5" />}
          linkTo="/results"
          color="secondary"
        />
        <DashboardCard
          title="Pertandingan Tersisa"
          value={((allMatches || []).length - (allCompletedMatches || []).length).toString()}
          icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5" />}
          linkTo="/schedule"
          color="highlight"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mt-3 sm:mt-6 transition-all duration-300">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Pertandingan Mendatang
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMatches.length > 0 ? (
              <div className="space-y-3">
                {upcomingMatches.map(match => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex-1 text-right">
                      <span className="font-medium">{match.homeTeamName}</span>
                    </div>
                    <div className="px-4 text-center">
                      <div className="text-sm bg-primary/10 text-primary rounded-full px-3 py-1">
                        {new Date(match.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {match.time}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{match.awayTeamName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">Belum ada pertandingan mendatang</p>
            )}
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link to="/schedule">Lihat Semua Jadwal</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Goal className="mr-2 h-5 w-5 text-primary" />
              Top Skor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topScorers.length > 0 ? (
              <div className="space-y-3">
                {topScorers.map((scorer, index) => (
                  <div key={scorer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-amber-600' :
                        'bg-primary/10'
                      } text-white font-medium`}>
                        {index + 1}
                      </span>
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                        <img 
                          src={scorer.photo || '/player-placeholder.png'} 
                          alt={scorer.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/player-placeholder.png';
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{scorer.name}</span>
                        <span className="text-sm text-muted-foreground">{scorer.teamName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Goal className="h-4 w-4 text-primary" />
                      <span className="font-bold">{scorer.goals}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">Belum ada data top skor</p>
            )}
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link to="/awards">Lihat Semua Penghargaan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <List className="mr-2 h-5 w-5 text-primary" />
              Hasil Pertandingan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map(match => (
                  <div key={match.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex-1 text-right">
                      <span className="font-medium">{match.homeTeamName}</span>
                    </div>
                    <div className="px-4 text-center">
                      <div className="text-sm font-bold">
                        {match.homeScore} - {match.awayScore}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(match.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{match.awayTeamName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">Belum ada hasil pertandingan</p>
            )}
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link to="/results">Lihat Semua Hasil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Klasemen Section */}
      <div className="mt-6">
        <DashboardStandings standings={standings} />
      </div>
    </div>
  );
};

type DashboardCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  linkTo: string;
  color: "primary" | "secondary" | "accent" | "highlight";
};

const DashboardCard = ({ title, value, icon, linkTo, color }: DashboardCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    highlight: "bg-highlight/10 text-highlight"
  };

  return (
    <Link to={linkTo}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
              <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">{value}</p>
            </div>
            <div className={`h-8 w-8 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default DashboardPage;
