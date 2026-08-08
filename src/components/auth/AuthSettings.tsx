import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Smartphone, Monitor, Tablet, Shield, ShieldCheck, ShieldAlert,
  Key, Lock, Trash2, Clock, MapPin, ChevronRight, RefreshCw,
  AlertTriangle, CheckCircle, XCircle, LogOut, Fingerprint
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Session {
  id: string;
  device_name: string;
  ip_address: string;
  location?: string;
  started_at: string;
  last_activity: string;
  is_current: boolean;
}

interface Device {
  id: string;
  device_name: string;
  device_type: 'web' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip_address: string;
  last_used: string;
  is_trusted: boolean;
  is_current: boolean;
}

interface MFASetup {
  method: 'app' | 'sms' | 'email' | null;
  qrCode?: string;
  secret?: string;
  phoneNumber?: string;
  verificationCode: string;
  step: 'choose' | 'setup' | 'verify' | 'backup';
  backupCodes: string[];
}

export function AuthSettings() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<'app' | 'sms' | 'email' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<MFASetup>({
    method: null,
    verificationCode: '',
    step: 'choose',
    backupCodes: [],
  });

  // Load sessions and devices
  const loadData = useCallback(async () => {
    setIsLoading(true);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    // Load sessions
    const { data: sessionsData } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.user.id)
      .order('last_activity', { ascending: false });

    if (sessionsData) {
      setSessions(sessionsData as Session[]);
    }

    // Load devices
    const { data: devicesData } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.user.id)
      .order('last_used', { ascending: false });

    if (devicesData) {
      setDevices(devicesData as Device[]);
    }

    // Load MFA status
    const { data: profile } = await supabase
      .from('profiles')
      .select('mfa_enabled, mfa_method')
      .eq('id', user.user.id)
      .single();

    if (profile) {
      setMfaEnabled(profile.mfa_enabled || false);
      setMfaMethod(profile.mfa_method || null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Revoke session
  const revokeSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId);

    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session revoked");
    }
  };

  // Revoke all other sessions
  const revokeOtherSessions = async () => {
    const currentSession = sessions.find((s) => s.is_current);
    if (!currentSession) return;

    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .neq('id', currentSession.id);

    if (!error) {
      setSessions((prev) => prev.filter((s) => s.is_current));
      toast.success("All other sessions revoked");
    }
  };

  // Trust device
  const trustDevice = async (deviceId: string) => {
    const { error } = await supabase
      .from('user_devices')
      .update({ is_trusted: true })
      .eq('id', deviceId);

    if (!error) {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, is_trusted: true } : d))
      );
      toast.success("Device trusted");
    }
  };

  // Remove device
  const removeDevice = async (deviceId: string) => {
    const { error } = await supabase
      .from('user_devices')
      .delete()
      .eq('id', deviceId);

    if (!error) {
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast.success("Device removed");
    }
  };

  // Setup MFA method
  const setupMFA = async (method: 'app' | 'sms' | 'email') => {
    setMfaSetup({ ...mfaSetup, method, step: 'setup' });

    if (method === 'app') {
      // Generate TOTP secret
      const secret = Array.from({ length: 32 }, () =>
        Math.random().toString(36)[2].toUpperCase()
      ).join('');

      setMfaSetup((prev) => ({
        ...prev,
        secret,
        qrCode: `otpauth://totp/RefAI:me@example.com?secret=${secret}&issuer=RefAI`,
      }));
    }
  };

  // Verify MFA code
  const verifyMFACode = async () => {
    if (mfaSetup.verificationCode.length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }

    // Simulate verification
    setMfaSetup((prev) => ({
      ...prev,
      step: 'backup',
      backupCodes: Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 10).toUpperCase()
      ),
    }));
  };

  // Complete MFA setup
  const completeMFASetup = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        mfa_enabled: true,
        mfa_method: mfaSetup.method,
      })
      .eq('id', user.user.id);

    if (!error) {
      setMfaEnabled(true);
      setMfaMethod(mfaSetup.method);
      setShowMFASetup(false);
      toast.success("MFA enabled successfully");
    }
  };

  // Disable MFA
  const disableMFA = async () => {
    if (!confirm("Disable MFA? This will reduce account security.")) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        mfa_enabled: false,
        mfa_method: null,
      })
      .eq('id', user.user.id);

    if (!error) {
      setMfaEnabled(false);
      setMfaMethod(null);
      toast.success("MFA disabled");
    }
  };

  // Get device icon
  const getDeviceIcon = (type: Device['device_type']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-purple-400" />;
      case 'tablet':
        return <Tablet className="h-4 w-4 text-yellow-400" />;
      default:
        return <Monitor className="h-4 w-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* MFA Settings */}
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-cyan-400" />
            Multi-Factor Authentication
            {mfaEnabled ? (
              <Badge className="bg-green-500">Enabled</Badge>
            ) : (
              <Badge variant="secondary">Disabled</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mfaEnabled ? (
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">MFA Active</div>
                  <div className="text-xs text-slate-400">
                    Method: {mfaMethod?.toUpperCase()}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={disableMFA}>
                Disable
              </Button>
            </div>
          ) : showMFASetup ? (
            <div className="space-y-3">
              {mfaSetup.step === 'choose' && (
                <>
                  <div className="text-xs text-slate-400 mb-2">Choose MFA method:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-16 flex-col"
                      onClick={() => setupMFA('app')}
                    >
                      <Smartphone className="h-5 w-5 mb-1" />
                      <span className="text-xs">Auth App</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-16 flex-col"
                      onClick={() => setupMFA('sms')}
                    >
                      <Key className="h-5 w-5 mb-1" />
                      <span className="text-xs">SMS</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-16 flex-col"
                      onClick={() => setupMFA('email')}
                    >
                      <Lock className="h-5 w-5 mb-1" />
                      <span className="text-xs">Email</span>
                    </Button>
                  </div>
                </>
              )}

              {mfaSetup.step === 'setup' && mfaSetup.method === 'app' && (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-800 rounded-lg text-center">
                    <div className="text-xs text-slate-400 mb-2">
                      Scan with your authenticator app
                    </div>
                    <div className="font-mono text-xs bg-slate-700 p-2 rounded border border-slate-600">
                      {mfaSetup.secret}
                    </div>
                  </div>
                  <Input
                    placeholder="Enter 6-digit code"
                    value={mfaSetup.verificationCode}
                    onChange={(e) => setMfaSetup((prev) => ({
                      ...prev,
                      verificationCode: e.target.value.replace(/\D/g, '').slice(0, 6)
                    }))}
                    className="text-center text-lg tracking-widest"
                  />
                  <Button size="sm" className="w-full" onClick={verifyMFACode}>
                    Verify
                  </Button>
                </div>
              )}

              {mfaSetup.step === 'backup' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 mb-2">
                    Save these backup codes securely:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {mfaSetup.backupCodes.map((code, i) => (
                      <div key={i} className="font-mono text-xs bg-slate-800 p-2 rounded text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="w-full" onClick={completeMFASetup}>
                    Complete Setup
                  </Button>
                </div>
              )}

              <Button size="sm" variant="ghost" onClick={() => setShowMFASetup(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-white">MFA is not enabled</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Enable MFA to secure your account with an additional verification step.
              </p>
              <Button size="sm" onClick={() => setShowMFASetup(true)}>
                <Shield className="h-3 w-3 mr-1" />
                Enable MFA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-cyan-400" />
              Active Sessions ({sessions.length})
            </CardTitle>
            <Button size="sm" variant="outline" onClick={revokeOtherSessions}>
              Revoke Others
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-slate-400" />
                <div>
                  <div className="text-sm text-white">{session.device_name}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="h-3 w-3" />
                    <span>{session.ip_address}</span>
                    <span>•</span>
                    <span>Last: {new Date(session.last_activity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session.is_current ? (
                  <Badge className="bg-green-500">Current</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                    onClick={() => revokeSession(session.id)}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trusted Devices */}
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="h-4 w-4 text-cyan-400" />
            Trusted Devices ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex items-center gap-3">
                {getDeviceIcon(device.device_type)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{device.device_name}</span>
                    {device.is_trusted && (
                      <Badge variant="outline" className="text-[10px] border-green-500 text-green-400">
                        Trusted
                      </Badge>
                    )}
                    {device.is_current && (
                      <Badge className="bg-cyan-500 text-[10px]">Current</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {device.browser} • {device.os}
                  </div>
                  <div className="text-xs text-slate-500">
                    Last: {new Date(device.last_used).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!device.is_trusted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-400"
                    onClick={() => trustDevice(device.id)}
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                )}
                {!device.is_current && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400"
                    onClick={() => removeDevice(device.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
