import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Mic, MicOff, Volume2, VolumeX, Settings, Zap,
  Play, Pause, RefreshCw, Clock, CheckCircle, XCircle,
  AlertTriangle, Command, History
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCommand {
  id: string;
  command: string;
  action: string;
  timestamp: Date;
  success: boolean;
  response?: string;
}

interface VoiceControlSystemProps {
  matchId: string;
  isEnabled?: boolean;
  onCommand?: (command: string) => Promise<boolean>;
}

const supportedCommands = [
  { phrase: "start match", action: "match.start", description: "Begin the match" },
  { phrase: "pause match", action: "match.pause", description: "Pause the match" },
  { phrase: "end match", action: "match.end", description: "End the match" },
  { phrase: "goal home", action: "goal.home", description: "Goal for home team" },
  { phrase: "goal away", action: "goal.away", description: "Goal for away team" },
  { phrase: "yellow card", action: "card.yellow", description: "Issue yellow card" },
  { phrase: "red card", action: "card.red", description: "Issue red card" },
  { phrase: "substitution", action: "substitution", description: "Open substitution dialog" },
  { phrase: "show replay", action: "replay.show", description: "Show instant replay" },
  { phrase: "hide replay", action: "replay.hide", description: "Hide replay overlay" },
  { phrase: "var check", action: "var.check", description: "Start VAR review" },
  { phrase: "var confirm", action: "var.confirm", description: "Confirm VAR decision" },
  { phrase: "var reject", action: "var.reject", description: "Reject VAR decision" },
  { phrase: "show stats", action: "stats.show", description: "Display match statistics" },
  { phrase: "hide stats", action: "stats.hide", description: "Hide statistics overlay" },
  { phrase: "next camera", action: "camera.next", description: "Switch to next camera" },
  { phrase: "camera one", action: "camera.1", description: "Switch to camera 1" },
  { phrase: "camera two", action: "camera.2", description: "Switch to camera 2" },
  { phrase: "camera three", action: "camera.3", description: "Switch to camera 3" },
  { phrase: "slow motion", action: "replay.slow", description: "Enable slow motion" },
  { phrase: "normal speed", action: "replay.normal", description: "Normal playback speed" },
  { phrase: "undo", action: "action.undo", description: "Undo last action" },
  { phrase: "help", action: "system.help", description: "Show available commands" },
];

export function VoiceControlSystem({ matchId, isEnabled = false, onCommand }: VoiceControlSystemProps) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript.toLowerCase().trim();
          const conf = Math.round(result[0].confidence * 100);

          setCurrentTranscript(transcript);
          setConfidence(conf);

          if (result.isFinal) {
            processCommand(transcript, conf);
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            toast.error("Microphone access denied");
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          if (isListening) {
            // Restart if still supposed to be listening
            try {
              recognition.start();
            } catch (e) {
              setIsListening(false);
            }
          }
        };

        recognitionRef.current = recognition;
      }

      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Start/stop listening
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setCurrentTranscript("");
      toast.info("Voice control stopped");
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening for commands...");
      } catch (e) {
        toast.error("Failed to start voice recognition");
      }
    }
  }, [isListening]);

  // Process recognized command
  const processCommand = useCallback(async (transcript: string, conf: number) => {
    if (conf < 70) {
      toast.warning(`Low confidence (${conf}%): "${transcript}"`);
      return;
    }

    setIsProcessing(true);

    // Find matching command
    const matchedCommand = supportedCommands.find(
      (cmd) => transcript.includes(cmd.phrase) || cmd.phrase.split(" ").every((word) => transcript.includes(word))
    );

    const command: VoiceCommand = {
      id: `cmd-${Date.now()}`,
      command: transcript,
      action: matchedCommand?.action || "unknown",
      timestamp: new Date(),
      success: !!matchedCommand,
      response: matchedCommand ? `Executing: ${matchedCommand.description}` : "Command not recognized",
    };

    setLastCommand(command);
    setCommandHistory((prev) => [command, ...prev.slice(0, 19)]);

    // Execute command
    if (matchedCommand) {
      if (onCommand) {
        const success = await onCommand(matchedCommand.action);
        command.success = success;
      }

      // Log to database
      await supabase.from("voice_commands").insert({
        match_id: matchId,
        command: transcript,
        action: matchedCommand.action,
        success: true,
        confidence: conf,
      });

      // Audio feedback
      if (!isMuted && synthRef.current) {
        const utterance = new SpeechSynthesisUtterance(command.response || "");
        utterance.rate = 1.2;
        synthRef.current.speak(utterance);
      }

      toast.success(`Command: ${matchedCommand.phrase}`);
    } else {
      toast.error("Command not recognized");
    }

    setCurrentTranscript("");
    setIsProcessing(false);
  }, [matchId, onCommand, isMuted]);

  // Speak feedback
  const speak = useCallback((text: string) => {
    if (!isMuted && synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current.speak(utterance);
    }
  }, [isMuted]);

  // Clear history
  const clearHistory = useCallback(() => {
    setCommandHistory([]);
    toast.info("Command history cleared");
  }, []);

  return (
    <Card className="border-cyan-900/50 bg-slate-950/90">
      <CardHeader className="py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mic className="h-4 w-4 text-cyan-400" />
            Voice Control System
            {isListening && (
              <Badge variant="default" className="animate-pulse bg-red-500">
                LISTENING
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-slate-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-green-400" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Main Control */}
        <div className="flex items-center gap-3">
          <Button
            className={`flex-1 h-12 ${isListening ? "bg-red-600 hover:bg-red-500" : "bg-cyan-600 hover:bg-cyan-500"}`}
            onClick={toggleListening}
            disabled={!isEnabled}
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Listening
              </>
            )}
          </Button>
        </div>

        {/* Current Transcript */}
        {(currentTranscript || isProcessing) && (
          <div className="p-3 bg-cyan-950/30 border border-cyan-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              {isProcessing ? (
                <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
              ) : (
                <Mic className="h-3 w-3 text-cyan-400" />
              )}
              <span className="text-xs text-slate-400">
                {isProcessing ? "Processing..." : "Heard:"}
              </span>
            </div>
            <p className="text-sm font-medium text-white font-mono">
              "{currentTranscript}"
            </p>
            {!isProcessing && confidence > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      confidence > 90 ? "bg-green-500" : confidence > 70 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{confidence}%</span>
              </div>
            )}
          </div>
        )}

        {/* Last Command */}
        {lastCommand && (
          <div className={`p-3 rounded-lg border ${
            lastCommand.success
              ? "border-green-500/50 bg-green-500/10"
              : "border-red-500/50 bg-red-500/10"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Last Command</span>
              {lastCommand.success ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Command className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">"{lastCommand.command}"</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{lastCommand.response}</p>
          </div>
        )}

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <History className="h-3 w-3" />
                History ({commandHistory.length})
              </span>
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={clearHistory}>
                Clear
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {commandHistory.slice(0, 5).map((cmd) => (
                <div
                  key={cmd.id}
                  className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-xs"
                >
                  <div className="flex items-center gap-2">
                    {cmd.success ? (
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-400" />
                    )}
                    <span className="text-slate-300">"{cmd.command}"</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    {cmd.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supported Commands */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400">Supported Commands</div>
          <div className="grid grid-cols-2 gap-1.5">
            {supportedCommands.slice(0, 8).map((cmd) => (
              <Button
                key={cmd.action}
                size="sm"
                variant="outline"
                className="h-7 text-[10px] justify-start"
                onClick={() => processCommand(cmd.phrase, 100)}
                disabled={!isEnabled}
              >
                <Zap className="h-2.5 w-2.5 mr-1 text-cyan-400" />
                {cmd.phrase}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="w-full text-[10px]" disabled={!isEnabled}>
            View all {supportedCommands.length} commands
          </Button>
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            {recognitionRef.current ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Speech API Ready
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 text-yellow-400" />
                Speech API Unavailable
              </>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {commandHistory.length} commands this session
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
