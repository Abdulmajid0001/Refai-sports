import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users, UserPlus, Calendar, BarChart3, Trophy, Settings,
  Shield, Mail, Clock, CheckCircle, XCircle, AlertTriangle,
  Filter, Search, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  id: string;
  name: string;
  logo_url: string;
  league_id: string;
  league_name: string;
  created_at: string;
  player_count: number;
  status: 'active' | 'suspended';
}

interface Player {
  id: string;
  user_id: string;
  team_member_id: string;
  display_name: string;
  jersey_number: number;
  position: string;
  photo_url: string;
  is_verified: boolean;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

export function TeamManagement({ teamId, leagueId }: { teamId: string; leagueId: string }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"roster" | "invites" | "settings">("roster");

  // New invite form
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState("player");

  // Load team data
  const loadTeamData = useCallback(async () => {
    setIsLoading(true);

    const { data: teamData } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        logo_url,
        league_id,
        is_suspended,
        created_at,
        leagues (name)
      `)
      .eq('id', teamId)
      .single();

    if (teamData) {
      setTeam({
        id: teamData.id,
        name: teamData.name,
        logo_url: teamData.logo_url,
        league_id: teamData.league_id,
        league_name: (teamData.leagues as any)?.name || 'Unknown',
        created_at: teamData.created_at,
        player_count: 0,
        status: teamData.is_suspended ? 'suspended' : 'active',
      });
    }

    const { data: membersData } = await supabase
      .from('team_members')
      .select('id, player_number')
      .eq('team_id', teamId);

    if (membersData) {
      const memberIds = membersData.map(m => m.id);
      const { data: profilesData } = await supabase
        .from('player_profiles')
        .select('*')
        .in('team_member_id', memberIds);

      setPlayers((profilesData || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        team_member_id: p.team_member_id,
        display_name: p.display_name,
        jersey_number: p.jersey_number,
        position: p.position,
        photo_url: p.photo_url,
        is_verified: p.is_verified,
      })));
    }

    const { data: invitesData } = await supabase
      .from('team_invites')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (invitesData) {
      setInvites(invitesData.map((i: any) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        created_at: i.created_at,
      })));
    }

    setIsLoading(false);
  }, [teamId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Send invite
  const sendInvite = async () => {
    if (!newInviteEmail) {
      toast.error("Enter an email address");
      return;
    }

    const token = Array.from({ length: 32 }, () =>
      Math.random().toString(36)[2]
    ).join('');

    const { error } = await supabase.from('team_invites').insert({
      team_id: teamId,
      email: newInviteEmail,
      token,
      role: newInviteRole,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (error) {
      toast.error("Failed to send invite");
    } else {
      toast.success(`Invite sent to ${newInviteEmail}`);
      setNewInviteEmail("");
      loadTeamData();
    }
  };

  // Cancel invite
  const cancelInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from('team_invites')
      .delete()
      .eq('id', inviteId);

    if (!error) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invite cancelled");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-cyan-400" />
              {team?.name || "Team Management"}
              {team && (
                <Badge variant={team.status === 'active' ? 'default' : 'destructive'}>
                  {team.status}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              {(["roster", "invites", "settings"] as const).map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "default" : "ghost"}
                  onClick={() => setActiveTab(tab)}
                  className="text-xs capitalize"
                >
                  {tab}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === "roster" && (
            <>
              {/* Invite Form */}
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email to invite"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                />
                <select
                  value={newInviteRole}
                  onChange={(e) => setNewInviteRole(e.target.value)}
                  className="px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
                >
                  <option value="player">Player</option>
                  <option value="coach">Coach</option>
                  <option value="assistant_coach">Assistant Coach</option>
                  <option value="manager">Manager</option>
                </select>
                <Button size="sm" onClick={sendInvite}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>

              {/* Roster */}
              <div className="grid grid-cols-2 gap-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                        {player.jersey_number || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {player.display_name}
                          {player.is_verified && (
                            <CheckCircle className="inline h-3 w-3 ml-1 text-green-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{player.position || 'No position'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {players.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No players yet. Invite players to join.</p>
                </div>
              )}
            </>
          )}

          {activeTab === "invites" && (
            <div className="space-y-2">
              {invites.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No pending invites</p>
                </div>
              ) : (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div>
                      <div className="text-sm text-white">{invite.email}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="capitalize">{invite.role}</span>
                        <span>•</span>
                        <span>{new Date(invite.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={invite.status === 'pending' ? 'secondary' : invite.status === 'accepted' ? 'default' : 'destructive'}
                      >
                        {invite.status}
                      </Badge>
                      {invite.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400"
                          onClick={() => cancelInvite(invite.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">Team Name</div>
                <Input value={team?.name} className="bg-transparent border-none p-0" />
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-xs text-slate-400 mb-1">League</div>
                <div className="text-sm text-white">{team?.league_name}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
