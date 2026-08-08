import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database, Search, Filter, Download, Play, Archive,
  Calendar, Clock, Users, ChevronDown, ChevronUp,
  Grid, List, RefreshCw, HardDrive, Share2, Trash2,
  Eye, ExternalLink, FileVideo, BarChart3, MapPin
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface ArchivedMatch {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  score: { home: number; away: number };
  date: string;
  competition: string;
  duration: number;
  storageSize: number;
  status: "ready" | "processing" | "error";
  hasVAR: boolean;
  hasReplays: boolean;
  hasStats: boolean;
  hasTracking: boolean;
  thumbnail?: string;
}

interface MatchVaultProps {
  leagueId?: string;
  onSelectMatch?: (matchId: string) => void;
}

export function MatchVault({ leagueId, onSelectMatch }: MatchVaultProps) {
  const { user } = useAuth();
  const [matches, setMatches] = useState<ArchivedMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "size" | "teams">("date");
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<"all" | "ready" | "processing">("all");

  // Mock data for demonstration
  const mockMatches: ArchivedMatch[] = [
    {
      id: "arch-1",
      matchId: "match-1",
      homeTeam: "Arsenal FC",
      awayTeam: "Chelsea FC",
      score: { home: 2, away: 1 },
      date: "2026-06-15",
      competition: "Premier League",
      duration: 95,
      storageSize: 2.4,
      status: "ready",
      hasVAR: true,
      hasReplays: true,
      hasStats: true,
      hasTracking: true,
    },
    {
      id: "arch-2",
      matchId: "match-2",
      homeTeam: "Liverpool",
      awayTeam: "Manchester City",
      score: { home: 1, away: 1 },
      date: "2026-06-12",
      competition: "Premier League",
      duration: 93,
      storageSize: 3.1,
      status: "ready",
      hasVAR: true,
      hasReplays: true,
      hasStats: true,
      hasTracking: false,
    },
    {
      id: "arch-3",
      matchId: "match-3",
      homeTeam: "Real Madrid",
      awayTeam: "Barcelona",
      score: { home: 3, away: 2 },
      date: "2026-06-10",
      competition: "La Liga",
      duration: 102,
      storageSize: 4.2,
      status: "ready",
      hasVAR: true,
      hasReplays: true,
      hasStats: true,
      hasTracking: true,
    },
    {
      id: "arch-4",
      matchId: "match-4",
      homeTeam: "Bayern Munich",
      awayTeam: "Borussia Dortmund",
      score: { home: 2, away: 0 },
      date: "2026-06-08",
      competition: "Bundesliga",
      duration: 91,
      storageSize: 1.8,
      status: "processing",
      hasVAR: false,
      hasReplays: true,
      hasStats: true,
      hasTracking: false,
    },
  ];

  // Load archived matches
  const loadMatches = useCallback(async () => {
    setIsLoading(true);

    // In production, fetch from database
    await new Promise((resolve) => setTimeout(resolve, 800));

    let query = supabase
      .from("match_archives")
      .select(`
        id,
        match_id,
        storage_size,
        status,
        created_at,
        has_var,
        has_replays,
        has_stats,
        has_tracking,
        matches (
          home_team:teams!matches_home_team_id_fkey (name),
          away_team:teams!matches_away_team_id_fkey (name),
          home_score,
          away_score,
          scheduled_at,
          leagues (name)
        )
      `);

    if (leagueId) {
      query = query.eq("matches.league_id", leagueId);
    }

    const { data, error } = await query;

    // Use mock data for now
    setMatches(mockMatches);
    setIsLoading(false);
  }, [leagueId]);

  useEffect(() => {
    loadMatches();
  }, []);

  // Filter and sort matches
  const filteredMatches = matches
    .filter((m) => {
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          m.homeTeam.toLowerCase().includes(query) ||
          m.awayTeam.toLowerCase().includes(query) ||
          m.competition.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "size":
          return b.storageSize - a.storageSize;
        case "teams":
          return a.homeTeam.localeCompare(b.homeTeam);
        default:
          return 0;
      }
    });

  // Toggle match selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedMatches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all matches
  const selectAll = useCallback(() => {
    if (selectedMatches.size === filteredMatches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(filteredMatches.map((m) => m.id)));
    }
  }, [filteredMatches, selectedMatches.size]);

  // Download match archive
  const downloadMatch = useCallback(async (match: ArchivedMatch) => {
    toast.success(`Preparing download for ${match.homeTeam} vs ${match.awayTeam}...`);

    await supabase.from("archive_downloads").insert({
      archive_id: match.id,
      user_id: user?.id,
      downloaded_at: new Date().toISOString(),
    });

    // Simulate download
    setTimeout(() => {
      toast.success("Download ready!");
    }, 2000);
  }, [user]);

  // Download selected matches
  const downloadSelected = useCallback(async () => {
    const selectedList = matches.filter((m) => selectedMatches.has(m.id));
    toast.success(`Preparing ${selectedList.size} matches for download...`);

    for (const match of selectedList) {
      await downloadMatch(match);
    }
  }, [matches, selectedMatches, downloadMatch]);

  // Delete match archive
  const deleteMatch = useCallback(async (match: ArchivedMatch) => {
    if (!confirm(`Delete archive for ${match.homeTeam} vs ${match.awayTeam}?`)) return;

    await supabase.from("match_archives").delete().eq("id", match.id);

    setMatches((prev) => prev.filter((m) => m.id !== match.id));
    toast.success("Archive deleted");
  }, []);

  // Get total storage
  const totalStorage = matches.reduce((sum, m) => sum + m.storageSize, 0);

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Archive className="h-4 w-4 text-cyan-400" />
              Match Vault
              <Badge variant="secondary" className="text-[10px]">
                {matches.length} matches
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <HardDrive className="h-3 w-3" />
                {totalStorage.toFixed(1)} GB
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search teams, competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              size="sm"
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterStatus === "ready" ? "default" : "outline"}
              onClick={() => setFilterStatus("ready")}
            >
              Ready
            </Button>
            <Button
              size="sm"
              variant={filterStatus === "processing" ? "default" : "outline"}
              onClick={() => setFilterStatus("processing")}
            >
              Processing
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={loadMatches}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={selectAll}>
                {selectedMatches.size === filteredMatches.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedMatches.size > 0 && (
                <Badge variant="secondary">
                  {selectedMatches.size} selected
                </Badge>
              )}
              {selectedMatches.size > 0 && (
                <Button size="sm" variant="outline" onClick={downloadSelected}>
                  <Download className="h-3 w-3 mr-1" />
                  Download Selected
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="ml-2 px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white"
              >
                <option value="date">Sort by Date</option>
                <option value="size">Sort by Size</option>
                <option value="teams">Sort by Teams</option>
              </select>
            </div>
          </div>

          {/* Matches */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className={`p-3 rounded-lg border ${
                    selectedMatches.has(match.id)
                      ? "border-cyan-500 bg-cyan-950/30"
                      : "border-slate-700 bg-slate-800/50"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[10px]">
                      {match.competition}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={match.status === "ready" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {match.status}
                      </Badge>
                      <input
                        type="checkbox"
                        checked={selectedMatches.has(match.id)}
                        onChange={() => toggleSelection(match.id)}
                        className="ml-2"
                      />
                    </div>
                  </div>

                  {/* Teams */}
                  <div className="text-center mb-2">
                    <div className="text-sm font-bold text-white">
                      {match.homeTeam}
                      <span className="mx-2 text-cyan-400">{match.score.home} - {match.score.away}</span>
                      {match.awayTeam}
                    </div>
                  </div>

                  {/* Date & Duration */}
                  <div className="flex items-center justify-center gap-3 text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(match.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {match.duration}'
                    </span>
                  </div>

                  {/* Features */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {match.hasVAR && (
                      <Badge variant="outline" className="text-[10px] border-blue-500 text-blue-400">
                        VAR
                      </Badge>
                    )}
                    {match.hasReplays && (
                      <Badge variant="outline" className="text-[10px] border-green-500 text-green-400">
                        Replays
                      </Badge>
                    )}
                    {match.hasStats && (
                      <Badge variant="outline" className="text-[10px] border-purple-500 text-purple-400">
                        Stats
                      </Badge>
                    )}
                    {match.hasTracking && (
                      <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-400">
                        Tracking
                      </Badge>
                    )}
                  </div>

                  {/* Storage */}
                  <div className="text-center text-xs text-slate-500 mb-2">
                    Storage: {match.storageSize} GB
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs"
                      onClick={() => onSelectMatch?.(match.matchId)}
                      disabled={match.status !== "ready"}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => downloadMatch(match)}
                      disabled={match.status !== "ready"}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-red-400"
                      onClick={() => deleteMatch(match)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMatches.map((match) => (
                <div
                  key={match.id}
                  className={`p-3 rounded-lg border ${
                    selectedMatches.has(match.id)
                      ? "border-cyan-500 bg-cyan-950/30"
                      : "border-slate-700 bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedMatches.has(match.id)}
                        onChange={() => toggleSelection(match.id)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {match.homeTeam} {match.score.home} - {match.score.away} {match.awayTeam}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {match.competition}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(match.date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {match.duration}'
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="h-3 w-3" />
                            {match.storageSize} GB
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={match.status === "ready" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {match.status}
                      </Badge>
                      <div className="flex gap-1">
                        {match.hasVAR && <Badge variant="outline" className="text-[10px]">VAR</Badge>}
                        {match.hasReplays && <Badge variant="outline" className="text-[10px]">Replay</Badge>}
                        {match.hasTracking && <Badge variant="outline" className="text-[10px]">Track</Badge>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSelectMatch?.(match.matchId)}
                        disabled={match.status !== "ready"}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadMatch(match)}
                        disabled={match.status !== "ready"}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredMatches.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No archived matches found</p>
              {searchQuery && (
                <Button size="sm" variant="ghost" className="mt-2" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
