import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Users } from "lucide-react";
import { toast } from "sonner";

type Props = {
  matchId: string;
  role: "publisher" | "subscriber";
  name: string;
};

export function LiveStreamRoom({ matchId, role, name }: Props) {
  const [isLive, setIsLive] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (e) {
      toast.error("Camera access denied");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setMicOn(false);
  }

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Live Stream</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isLive ? "destructive" : "secondary"}>
            {isLive ? "LIVE" : "Offline"}
          </Badge>
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            {role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-video rounded-lg bg-black overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center text-white/50">
              <div className="text-center">
                <VideoOff className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">Camera off</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!cameraOn ? (
            <Button size="sm" onClick={startCamera}>
              <Video className="mr-1 h-4 w-4" /> Start Camera
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={stopCamera}>
              <VideoOff className="mr-1 h-4 w-4" /> Stop Camera
            </Button>
          )}
          <Button
            size="sm"
            variant={micOn ? "default" : "outline"}
            onClick={() => setMicOn(!micOn)}
            disabled={!cameraOn}
          >
            {micOn ? <Mic className="mr-1 h-4 w-4" /> : <MicOff className="mr-1 h-4 w-4" />}
            {micOn ? "Mute" : "Unmute"}
          </Button>
          <Button
            size="sm"
            variant={isLive ? "destructive" : "default"}
            onClick={() => setIsLive(!isLive)}
            disabled={!cameraOn}
          >
            {isLive ? "Go Offline" : "Go Live"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          LiveKit integration required for production streaming.
        </p>
      </CardContent>
    </Card>
  );
}
