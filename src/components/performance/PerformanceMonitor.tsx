import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity, Zap, Wifi, Server, Database, Globe, Monitor,
  RefreshCw, Clock, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle, XCircle, Cpu, HardDrive, Network, Cloud
} from "lucide-react";
import { toast } from "sonner";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: "good" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}

interface ServerMetric {
  cpu: number;
  memory: number;
  disk: number;
  network: { in: number; out: number };
  connections: number;
}

interface LatencyMetric {
  endpoint: string;
  latency: number;
  p99: number;
  requests: number;
  errors: number;
}

interface WebSocketMetric {
  connections: number;
  messagesPerSecond: number;
  avgLatency: number;
  reconnects: number;
}

export function PerformanceMonitor() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [uptime, setUptime] = useState(99.97);

  // Core metrics
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([
    { name: "Event Latency", value: 0.45, unit: "ms", threshold: 1000, status: "good", trend: "stable" },
    { name: "WebSocket Latency", value: 12, unit: "ms", threshold: 50, status: "good", trend: "stable" },
    { name: "API Response Time", value: 89, unit: "ms", threshold: 200, status: "good", trend: "down" },
    { name: "Database Query Time", value: 23, unit: "ms", threshold: 100, status: "good", trend: "stable" },
    { name: "Stream Bitrate", value: 8.5, unit: "Mbps", threshold: 4, status: "good", trend: "up" },
    { name: "Frame Rate", value: 60, unit: "fps", threshold: 30, status: "good", trend: "stable" },
  ]);

  // Server metrics
  const [serverMetrics, setServerMetrics] = useState<ServerMetric>({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: { in: 125, out: 340 },
    connections: 1247,
  });

  // WebSocket metrics
  const [wsMetrics, setWsMetrics] = useState<WebSocketMetric>({
    connections: 523,
    messagesPerSecond: 127,
    avgLatency: 8,
    reconnects: 3,
  });

  // Latency by endpoint
  const [latencyMetrics, setLatencyMetrics] = useState<LatencyMetric[]>([
    { endpoint: "/api/matches", latency: 45, p99: 89, requests: 1247, errors: 0 },
    { endpoint: "/api/events", latency: 12, p99: 34, requests: 5421, errors: 2 },
    { endpoint: "/api/replay", latency: 89, p99: 156, requests: 234, errors: 0 },
    { endpoint: "/api/var", latency: 34, p99: 67, requests: 89, errors: 0 },
    { endpoint: "/ws/live", latency: 8, p99: 23, requests: 523, errors: 0 },
  ]);

  // CDN metrics
  const [cdnMetrics, setCdnMetrics] = useState({
    cacheHitRate: 94.5,
    bandwidth: 2.4, // TB/day
    edgeNodes: 47,
    avgLatency: 23, // ms
  });

  // GPU metrics
  const [gpuMetrics, setGpuMetrics] = useState({
    utilization: 78,
    memory: 6.2, // GB
    temperature: 65, // C
    encoder: "NVENC",
  });

  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start performance monitoring
  useEffect(() => {
    if (isMonitoring) {
      monitorIntervalRef.current = setInterval(() => {
        // Simulate metric fluctuation
        setMetrics((prev) =>
          prev.map((m) => ({
            ...m,
            value: Math.max(0.1, m.value + (Math.random() - 0.5) * 0.2 * m.value),
            trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? "up" : "down") : "stable",
          }))
        );

        setServerMetrics((prev) => ({
          cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() - 0.5) * 5)),
          memory: Math.max(20, Math.min(90, prev.memory + (Math.random() - 0.5) * 2)),
          disk: prev.disk,
          network: {
            in: Math.max(50, prev.network.in + (Math.random() - 0.5) * 20),
            out: Math.max(100, prev.network.out + (Math.random() - 0.5) * 40),
          },
          connections: Math.max(500, Math.min(2000, prev.connections + Math.floor((Math.random() - 0.5) * 50))),
        }));

        setWsMetrics((prev) => ({
          connections: Math.max(100, prev.connections + Math.floor((Math.random() - 0.5) * 20)),
          messagesPerSecond: Math.max(50, prev.messagesPerSecond + Math.floor((Math.random() - 0.5) * 15)),
          avgLatency: Math.max(1, Math.min(50, prev.avgLatency + (Math.random() - 0.5) * 3)),
          reconnects: prev.reconnects + (Math.random() > 0.9 ? 1 : 0),
        }));

        setGpuMetrics((prev) => ({
          ...prev,
          utilization: Math.max(20, Math.min(98, prev.utilization + (Math.random() - 0.5) * 8)),
          temperature: Math.max(50, Math.min(85, prev.temperature + (Math.random() - 0.5) * 3)),
        }));
      }, 1000);
    }

    return () => {
      if (monitorIntervalRef.current) {
        clearInterval(monitorIntervalRef.current);
      }
    };
  }, [isMonitoring]);

  // Get status color
  const getStatusColor = (value: number, threshold: number) => {
    const ratio = value / threshold;
    if (ratio < 0.7) return "text-green-400";
    if (ratio < 0.9) return "text-yellow-400";
    return "text-red-400";
  };

  // Get status badge
  const getStatusBadge = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "good":
        return <Badge className="bg-green-500">OPTIMAL</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">WARNING</Badge>;
      case "critical":
        return <Badge variant="destructive">CRITICAL</Badge>;
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-red-400" />;
      case "down":
        return <TrendingDown className="h-3 w-3 text-green-400" />;
      default:
        return <Activity className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-cyan-400" />
              Performance Monitor
              {isMonitoring && (
                <Badge variant="default" className="animate-pulse bg-green-500">
                  LIVE
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-400 border-green-500">
                {uptime.toFixed(2)}% Uptime
              </Badge>
              <Button
                size="sm"
                variant={isMonitoring ? "destructive" : "default"}
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? "Stop" : "Start"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Core Performance Metrics */}
          <div className="grid grid-cols-3 gap-2">
            {metrics.map((metric) => (
              <div
                key={metric.name}
                className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{metric.name}</span>
                  {getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-bold ${getStatusColor(metric.value, metric.threshold)}`}>
                    {metric.value.toFixed(metric.value < 1 ? 2 : 0)}
                  </span>
                  <span className="text-xs text-slate-400">{metric.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Progress
                    value={(metric.value / metric.threshold) * 100}
                    className={`h-1 flex-1 ${
                      metric.value / metric.threshold > 0.9 ? "bg-red-900" : ""
                    }`}
                  />
                  <span className="text-[10px] text-slate-500">
                    {(metric.value / metric.threshold * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Server Resources */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Server className="h-3 w-3" />
              Server Resources
            </div>
            <div className="grid grid-cols-5 gap-2">
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <Cpu className={`h-4 w-4 mx-auto mb-1 ${serverMetrics.cpu > 80 ? "text-red-400" : "text-cyan-400"}`} />
                <div className="text-lg font-bold text-white">{serverMetrics.cpu.toFixed(0)}%</div>
                <div className="text-[10px] text-slate-400">CPU</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <HardDrive className={`h-4 w-4 mx-auto mb-1 ${serverMetrics.memory > 85 ? "text-red-400" : "text-purple-400"}`} />
                <div className="text-lg font-bold text-white">{serverMetrics.memory.toFixed(0)}%</div>
                <div className="text-[10px] text-slate-400">Memory</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <Database className="h-4 w-4 mx-auto mb-1 text-yellow-400" />
                <div className="text-lg font-bold text-white">{serverMetrics.disk}%</div>
                <div className="text-[10px] text-slate-400">Disk</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <Network className="h-4 w-4 mx-auto mb-1 text-green-400" />
                <div className="text-lg font-bold text-white">{serverMetrics.connections}</div>
                <div className="text-[10px] text-slate-400">Connections</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <Wifi className="h-4 w-4 mx-auto mb-1 text-blue-400" />
                <div className="text-sm font-bold text-white">
                  {serverMetrics.network.in.toFixed(0)}/{serverMetrics.network.out.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-400">Mbps</div>
              </div>
            </div>
          </div>

          {/* WebSocket Real-time Sync */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Wifi className="h-3 w-3" />
              WebSocket Real-time Sync
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-green-400">{wsMetrics.connections}</div>
                <div className="text-[10px] text-slate-400">Active Connections</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-cyan-400">{wsMetrics.messagesPerSecond}</div>
                <div className="text-[10px] text-slate-400">Messages/sec</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-white">{wsMetrics.avgLatency.toFixed(0)}ms</div>
                <div className="text-[10px] text-slate-400">Avg Latency</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-yellow-400">{wsMetrics.reconnects}</div>
                <div className="text-[10px] text-slate-400">Reconnects</div>
              </div>
            </div>
          </div>

          {/* GPU AI Acceleration */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Zap className="h-3 w-3" />
              GPU AI Acceleration
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className={`text-lg font-bold ${gpuMetrics.utilization > 90 ? "text-red-400" : "text-green-400"}`}>
                  {gpuMetrics.utilization.toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-400">GPU Utilization</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-white">{gpuMetrics.memory.toFixed(1)} GB</div>
                <div className="text-[10px] text-slate-400">GPU Memory</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className={`text-lg font-bold ${gpuMetrics.temperature > 80 ? "text-red-400" : "text-cyan-400"}`}>
                  {gpuMetrics.temperature}°C
                </div>
                <div className="text-[10px] text-slate-400">Temperature</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <Badge variant="outline" className="text-purple-400 border-purple-500">
                  {gpuMetrics.encoder}
                </Badge>
                <div className="text-[10px] text-slate-400 mt-1">Encoder</div>
              </div>
            </div>
          </div>

          {/* CDN Distribution */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Globe className="h-3 w-3" />
              CDN Distribution
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-green-400">{cdnMetrics.cacheHitRate}%</div>
                <div className="text-[10px] text-slate-400">Cache Hit Rate</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-white">{cdnMetrics.bandwidth} TB</div>
                <div className="text-[10px] text-slate-400">Bandwidth/day</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-cyan-400">{cdnMetrics.edgeNodes}</div>
                <div className="text-[10px] text-slate-400">Edge Nodes</div>
              </div>
              <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
                <div className="text-lg font-bold text-white">{cdnMetrics.avgLatency}ms</div>
                <div className="text-[10px] text-slate-400">Avg Latency</div>
              </div>
            </div>
          </div>

          {/* API Latency by Endpoint */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <Globe className="h-3 w-3" />
              API Latency by Endpoint
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {latencyMetrics.map((lm) => (
                <div
                  key={lm.endpoint}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs"
                >
                  <span className="font-mono text-slate-300">{lm.endpoint}</span>
                  <div className="flex items-center gap-3">
                    <span className={lm.latency < 50 ? "text-green-400" : lm.latency < 100 ? "text-yellow-400" : "text-red-400"}>
                      {lm.latency}ms
                    </span>
                    <span className="text-slate-400">p99: {lm.p99}ms</span>
                    <span className="text-slate-500">{lm.requests} req</span>
                    {lm.errors > 0 && (
                      <Badge variant="destructive" className="text-[10px]">
                        {lm.errors} err
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Targets */}
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="text-xs font-semibold text-slate-400">Performance Targets</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-slate-300">Event Latency &lt; 1s</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-slate-300">99.9% WebSocket Uptime</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-slate-300">GPU AI Processing Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-slate-300">CDN Edge Caching Active</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-slate-300">Scalable Streaming Ready</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span className="text-slate-300">Real-time Sync Enabled</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
