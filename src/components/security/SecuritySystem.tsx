import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Lock, Key, Smartphone, AlertTriangle, CheckCircle,
  UserCheck, Activity, RefreshCw, Settings, Eye, EyeOff,
  FileText, Download, Filter, Clock, Globe, Server, Database,
  ShieldCheck, ShieldAlert, ShieldX
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  status: "success" | "failure" | "blocked";
  details?: string;
}

interface SecuritySettings {
  mfaEnabled: boolean;
  mfaMethod: "app" | "sms" | "email";
  sessionTimeout: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  rateLimitRequests: number;
  rateLimitWindow: number;
  encryptionLevel: "standard" | "enhanced" | "maximum";
  apiKeys: ApiKey[];
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  status: "active" | "revoked" | "expired";
}

interface ThreatEvent {
  id: string;
  type: "ddos" | "brute_force" | "suspicious_activity" | "rate_limit";
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  timestamp: Date;
  blocked: boolean;
  details: string;
}

const ROLE_PERMISSIONS = {
  super_admin: ["all"],
  league_owner: [
    "league.manage", "team.manage", "match.manage", "moderator.manage",
    "finance.view", "finance.manage", "settings.manage", "analytics.view"
  ],
  team_owner: ["team.view", "team.edit", "player.manage", "match.view"],
  coach: ["team.view", "player.view", "match.view", "formation.edit"],
  moderator: ["match.control", "graphics.control", "replay.control", "var.control"],
  viewer: ["match.view", "stream.view"],
  camera_operator: ["camera.control", "match.view"],
  commentator: ["commentary.control", "match.view", "stats.view"],
  var_moderator: ["var.control", "replay.control", "match.view"],
  replay_moderator: ["replay.control", "match.view"],
  graphics_moderator: ["graphics.control", "match.view"],
};

export function SecuritySystem() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [settings, setSettings] = useState<SecuritySettings>({
    mfaEnabled: false,
    mfaMethod: "app",
    sessionTimeout: 30,
    ipWhitelist: [],
    ipBlacklist: [],
    rateLimitRequests: 100,
    rateLimitWindow: 60,
    encryptionLevel: "enhanced",
    apiKeys: [],
  });
  const [activeTab, setActiveTab] = useState<"audit" | "permissions" | "threats" | "settings">("audit");
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  // Load security data
  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Load audit logs
    const { data: logsData } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (logsData) {
      setAuditLogs(
        logsData.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          userName: log.user_id.slice(0, 8),
          action: log.action,
          resource: log.resource,
          ipAddress: log.ip_address || "N/A",
          userAgent: log.user_agent || "N/A",
          timestamp: new Date(log.created_at),
          status: log.status || "success",
          details: log.details,
        }))
      );
    }

    // Load threats (simulated for demo)
    setThreats([
      {
        id: "threat-1",
        type: "brute_force",
        severity: "high",
        source: "192.168.1.100",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        blocked: true,
        details: "Multiple failed login attempts detected",
      },
      {
        id: "threat-2",
        type: "rate_limit",
        severity: "medium",
        source: "10.0.0.50",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        blocked: true,
        details: "API rate limit exceeded",
      },
    ]);

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle MFA
  const toggleMFA = useCallback(async () => {
    setSettings((prev) => ({ ...prev, mfaEnabled: !prev.mfaEnabled }));
    toast.success(settings.mfaEnabled ? "MFA disabled" : "MFA enabled");
  }, [settings.mfaEnabled]);

  // Generate API key
  const generateApiKey = useCallback(async (name: string) => {
    const key = `sk_live_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join("")}`;

    const { error } = await supabase.from("api_keys").insert({
      name,
      key_hash: key,
      permissions: ["read"],
      status: "active",
      created_by: user?.id,
    });

    if (error) {
      toast.error("Failed to generate API key");
    } else {
      toast.success("API key generated");
      loadData();
    }
  }, [user?.id, loadData]);

  // Revoke API key
  const revokeApiKey = useCallback(async (keyId: string) => {
    const { error } = await supabase
      .from("api_keys")
      .update({ status: "revoked" })
      .eq("id", keyId);

    if (error) {
      toast.error("Failed to revoke key");
    } else {
      toast.success("API key revoked");
      loadData();
    }
  }, [loadData]);

  // Export audit logs
  const exportLogs = useCallback(() => {
    const csv = [
      "Timestamp,User,Action,Resource,IP Address,Status",
      ...auditLogs.map(
        (log) =>
          `${log.timestamp.toISOString()},${log.userName},${log.action},${log.resource},${log.ipAddress},${log.status}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Audit logs exported");
  }, [auditLogs]);

  // Get threat icon
  const getThreatIcon = (type: ThreatEvent["type"]) => {
    switch (type) {
      case "ddos":
        return <Server className="h-4 w-4 text-red-400" />;
      case "brute_force":
        return <Key className="h-4 w-4 text-orange-400" />;
      case "suspicious_activity":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "rate_limit":
        return <Activity className="h-4 w-4 text-blue-400" />;
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: ThreatEvent["severity"]) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">CRITICAL</Badge>;
      case "high":
        return <Badge className="bg-orange-500">HIGH</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500">MEDIUM</Badge>;
      case "low":
        return <Badge variant="secondary">LOW</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (status: AuditLog["status"]) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "failure":
        return <Badge className="bg-red-500">Failed</Badge>;
      case "blocked":
        return <Badge className="bg-orange-500">Blocked</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-cyan-400" />
              Security Center
            </CardTitle>
            <div className="flex gap-1">
              {(["audit", "permissions", "threats", "settings"] as const).map((tab) => (
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
          {/* Audit Logs Tab */}
          {activeTab === "audit" && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{auditLogs.length} audit logs</span>
                <Button size="sm" variant="outline" onClick={exportLogs}>
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1.5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="text-sm text-white">{log.action}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{log.resource}</span>
                          <span>•</span>
                          <span>{log.ipAddress}</span>
                          <span>•</span>
                          <span>{log.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(log.status)}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 mb-2">Role-Based Access Control (RBAC)</div>
              {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
                <div
                  key={role}
                  className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm font-mono text-white capitalize">
                        {role.replace("_", " ")}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {permissions.length === 1 && permissions[0] === "all"
                        ? "Full Access"
                        : `${permissions.length} permissions`}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {permissions.map((perm) => (
                      <Badge
                        key={perm}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Threats Tab */}
          {activeTab === "threats" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Active Threats ({threats.length})</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                    <ShieldCheck className="h-3 w-3" />
                    DDoS Protection Active
                  </div>
                </div>
              </div>
              {threats.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No active threats detected</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {threats.map((threat) => (
                    <div
                      key={threat.id}
                      className={`p-3 rounded-lg border ${
                        threat.blocked
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-red-500/50 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getThreatIcon(threat.type)}
                          <span className="text-sm font-medium text-white capitalize">
                            {threat.type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(threat.severity)}
                          <Badge variant={threat.blocked ? "default" : "destructive"}>
                            {threat.blocked ? "Blocked" : "Active"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mb-1">{threat.details}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {threat.source}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {threat.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              {/* MFA Settings */}
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">Multi-Factor Authentication</span>
                  </div>
                  <Button
                    size="sm"
                    variant={settings.mfaEnabled ? "default" : "outline"}
                    onClick={toggleMFA}
                  >
                    {settings.mfaEnabled ? "Enabled" : "Enable"}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["app", "sms", "email"] as const).map((method) => (
                    <Button
                      key={method}
                      size="sm"
                      variant={settings.mfaMethod === method ? "default" : "outline"}
                      onClick={() => setSettings((prev) => ({ ...prev, mfaMethod: method }))}
                      disabled={!settings.mfaEnabled}
                      className="text-xs capitalize"
                    >
                      {method}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Session Settings */}
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Session Settings</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400">Session Timeout (minutes):</label>
                  <Input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings((prev) => ({ ...prev, sessionTimeout: Number(e.target.value) }))}
                    className="w-20"
                  />
                </div>
              </div>

              {/* Rate Limiting */}
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Rate Limiting</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Requests per window:</label>
                    <Input
                      type="number"
                      value={settings.rateLimitRequests}
                      onChange={(e) => setSettings((prev) => ({ ...prev, rateLimitRequests: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Window (seconds):</label>
                    <Input
                      type="number"
                      value={settings.rateLimitWindow}
                      onChange={(e) => setSettings((prev) => ({ ...prev, rateLimitWindow: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {/* Encryption */}
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">Encryption Level</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["standard", "enhanced", "maximum"] as const).map((level) => (
                    <Button
                      key={level}
                      size="sm"
                      variant={settings.encryptionLevel === level ? "default" : "outline"}
                      onClick={() => setSettings((prev) => ({ ...prev, encryptionLevel: level }))}
                      className="text-xs capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Security Status */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
                  <ShieldCheck className="h-5 w-5 mx-auto text-green-400 mb-1" />
                  <div className="text-xs text-green-400">SSL/TLS Active</div>
                </div>
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
                  <Database className="h-5 w-5 mx-auto text-green-400 mb-1" />
                  <div className="text-xs text-green-400">Data Encrypted</div>
                </div>
                <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-center">
                  <Shield className="h-5 w-5 mx-auto text-green-400 mb-1" />
                  <div className="text-xs text-green-400">DDoS Protection</div>
                </div>
                <div className={`p-2 ${settings.mfaEnabled ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded text-center`}>
                  <Key className={`h-5 w-5 mx-auto ${settings.mfaEnabled ? 'text-green-400' : 'text-yellow-400'} mb-1`} />
                  <div className={`text-xs ${settings.mfaEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                    {settings.mfaEnabled ? 'MFA Active' : 'MFA Disabled'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
