import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trophy } from 'lucide-react';
import { Standing } from "../types";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useState } from "react";

interface DashboardStandingsProps {
  standings: Standing[];
}

export const DashboardStandings = ({ standings }: DashboardStandingsProps) => {
  const [selectedGroup, setSelectedGroup] = useState("A");

  // Kelompokkan standings berdasarkan grup
  const groupedStandings = standings.reduce<Record<string, Standing[]>>((acc, standing) => {
    if (!acc[standing.groupId]) {
      acc[standing.groupId] = [];
    }
    acc[standing.groupId].push(standing);
    return acc;
  }, {});

  // Urutkan grup (A, B, C, D)
  const sortedGroups = Object.keys(groupedStandings).sort();

  // Urutkan tim dalam setiap grup berdasarkan poin
  sortedGroups.forEach(group => {
    groupedStandings[group].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
  });

  // Fungsi untuk menghitung performa 5 pertandingan terakhir
  const calculatePerformance = (standing: Standing) => {
    const total = standing.wins + standing.draws + standing.losses;
    if (total === 0) return "-";
    
    const winRate = (standing.wins / total) * 100;
    if (winRate >= 70) return "Sangat Baik";
    if (winRate >= 50) return "Baik";
    if (winRate >= 30) return "Cukup";
    return "Kurang";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5 text-primary" />
            Klasemen
          </CardTitle>
          <Tabs defaultValue={selectedGroup} onValueChange={setSelectedGroup}>
            <TabsList>
              {sortedGroups.map(group => (
                <TabsTrigger key={group} value={group}>
                  Grup {group}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
            <div className="text-center">Pos</div>
            <div className="col-span-2">Tim</div>
            <div className="text-center">JM</div>
            <div className="text-center">M</div>
            <div className="text-center">S</div>
            <div className="text-center">K</div>
            <div className="text-center">GM</div>
            <div className="text-center">GK</div>
            <div className="text-center">SG</div>
            <div className="text-center">Performa</div>
            <div className="text-center">Poin</div>
          </div>
          
          {/* Team Rows */}
          <div className="space-y-1">
            {groupedStandings[selectedGroup]?.map((standing, index) => (
              <div
                key={standing.id}
                className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/50 rounded-sm text-sm hover:bg-muted/70 transition-colors"
              >
                <div className="text-center">
                  <span className={`w-6 h-6 inline-flex items-center justify-center rounded-full ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    'bg-muted-foreground/20'
                  } text-sm font-medium`}>
                    {index + 1}
                  </span>
                </div>
                <div className="col-span-2 font-medium truncate">{standing.teamName}</div>
                <div className="text-center">{standing.matchesPlayed}</div>
                <div className="text-center">{standing.wins}</div>
                <div className="text-center">{standing.draws}</div>
                <div className="text-center">{standing.losses}</div>
                <div className="text-center">{standing.goalsFor}</div>
                <div className="text-center">{standing.goalsAgainst}</div>
                <div className="text-center">{standing.goalDifference}</div>
                <div className="text-center text-xs">{calculatePerformance(standing)}</div>
                <div className="text-center font-semibold text-primary">{standing.points}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 text-center">
          <Button asChild variant="outline">
            <Link to="/standings">Lihat Klasemen Lengkap</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 