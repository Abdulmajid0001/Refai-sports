import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Grid3X3, Users, Move, Save, RotateCcw, Download, Upload,
  Eye, Settings, ChevronDown, ChevronUp, Layers, Play, Pause
} from "lucide-react";
import { toast } from "sonner";
import { formations, getFormationsByFormat, searchFormations, type Formation, type Position, type FormatType } from "./formations";

interface FormationEngineProps {
  teamId?: string;
  teamName?: string;
  teamColor?: string;
  teamLogo?: string;
}

type DisplayMode = "ai_pitch" | "sequential" | "scroll" | "video" | "hybrid";

export function FormationEngine({ teamId, teamName, teamColor, teamLogo }: FormationEngineProps) {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>("11");
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [customPositions, setCustomPositions] = useState<Position[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tacticalNotes, setTacticalNotes] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("ai_pitch");
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealIndex, setRevealIndex] = useState(0);

  const formatFormations = getFormationsByFormat(selectedFormat);
  const filteredFormations = searchQuery
    ? searchFormations(searchQuery).filter((f) => f.format === selectedFormat)
    : formatFormations;

  const handleFormationSelect = useCallback((formation: Formation) => {
    setSelectedFormation(formation);
    setCustomPositions([...formation.positions]);
    setTacticalNotes(formation.tacticalNotes || []);
    toast.success(`Loaded ${formation.name} formation`);
  }, []);

  const handlePlayerDrag = useCallback((playerId: string, newX: number, newY: number) => {
    setCustomPositions((prev) =>
      prev.map((p) =>
        p.id === playerId ? { ...p, x: newX, y: newY } : p
      )
    );
  }, []);

  const handleDragStart = (playerId: string) => {
    setIsDragging(true);
    setDraggedPlayer(playerId);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedPlayer(null);
  };

  const handlePitchClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !draggedPlayer) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    handlePlayerDrag(draggedPlayer, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
    handleDragEnd();
  }, [isDragging, draggedPlayer, handlePlayerDrag]);

  const resetFormation = useCallback(() => {
    if (selectedFormation) {
      setCustomPositions([...selectedFormation.positions]);
      toast.success("Formation reset");
    }
  }, [selectedFormation]);

  const saveFormation = useCallback(() => {
    const formationData = {
      positions: customPositions,
      notes: tacticalNotes,
      savedAt: new Date().toISOString(),
    };
    // In production, save to Supabase
    console.log("Saving formation:", formationData);
    toast.success("Formation saved");
  }, [customPositions, tacticalNotes]);

  const startReveal = useCallback(() => {
    setIsRevealing(true);
    setRevealIndex(0);
    const interval = setInterval(() => {
      setRevealIndex((prev) => {
        if (prev >= customPositions.length - 1) {
          clearInterval(interval);
          setIsRevealing(false);
          return prev;
        }
        return prev + 1;
      });
    }, 500);
  }, [customPositions.length]);

  const addTacticalNote = useCallback(() => {
    setTacticalNotes((prev) => [...prev, "New tactical note"]);
  }, []);

  return (
    <Card className="border-purple-900/50 bg-slate-950/90">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid3X3 className="h-4 w-4 text-purple-400" />
          Formation Engine
          <Badge variant="outline" className="ml-auto text-xs">
            {formations.length} formations
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Format selector */}
        <div className="flex flex-wrap gap-1.5">
          {(["3", "4", "5", "7", "8", "9", "11"] as FormatType[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={selectedFormat === f ? "default" : "outline"}
              className={`text-xs h-7 ${selectedFormat === f ? "bg-purple-600" : ""}`}
              onClick={() => setSelectedFormat(f)}
            >
              {f}-aside ({getFormationsByFormat(f).length})
            </Button>
          ))}
        </div>

        {/* Search */}
        <Input
          placeholder="Search formations..."
          className="h-8 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Formation list */}
        <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
          {filteredFormations.slice(0, 20).map((f) => (
            <div
              key={f.id}
              className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${
                selectedFormation?.id === f.id ? "bg-purple-600 text-white" : "bg-slate-800 hover:bg-slate-700"
              }`}
              onClick={() => handleFormationSelect(f)}
            >
              <Grid3X3 className="h-3 w-3" />
              <span className="font-medium">{f.name}</span>
              {f.description && (
                <span className="text-slate-400 truncate flex-1">{f.description}</span>
              )}
            </div>
          ))}
        </div>

        {/* Pitch with drag-and-drop */}
        <div className="relative aspect-[3/2] bg-green-800 rounded-lg overflow-hidden border-2 border-white/30"
          onClick={handlePitchClick}
        >
          {/* Field markings */}
          <div className="absolute inset-4 border border-white/20">
            {/* Center line */}
            <div className="absolute top-1/2 left-0 right-0 border-t border-white/20" />
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/20 rounded-full" />
            {/* Goal areas */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 border-b border-white/20" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-6 border-t border-white/20" />
          </div>

          {/* Player positions */}
          {customPositions.map((pos, idx) => {
            const isVisible = !isRevealing || idx <= revealIndex;
            return (
              <div
                key={pos.id}
                className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-move transition-all duration-300 ${
                  pos.zone === "goalkeeper"
                    ? "bg-yellow-500 text-black"
                    : pos.zone === "defense"
                    ? "bg-blue-500 text-white"
                    : pos.zone === "midfield"
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                } ${draggedPlayer === pos.id ? "opacity-50 scale-110" : ""} ${
                  !isVisible ? "opacity-0 scale-0" : "opacity-100 scale-100"
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%)`,
                  backgroundColor: pos.zone === "goalkeeper" ? undefined : teamColor || undefined,
                }}
                draggable
                onDragStart={() => handleDragStart(pos.id)}
                onDragEnd={handleDragEnd}
              >
                {idx + 1}
              </div>
            );
          })}
        </div>

        {/* Display mode */}
        <div className="flex flex-wrap gap-1.5">
          {(["ai_pitch", "sequential", "scroll", "video", "hybrid"] as DisplayMode[]).map((dm) => (
            <Button
              key={dm}
              size="sm"
              variant={displayMode === dm ? "default" : "outline"}
              className={`text-xs h-6 ${displayMode === dm ? "bg-purple-600" : ""}`}
              onClick={() => setDisplayMode(dm)}
            >
              {dm.replace("_", " ")}
            </Button>
          ))}
          <Button size="sm" variant="outline" className="text-xs h-6" onClick={startReveal} disabled={isRevealing}>
            <Play className="h-3 w-3 mr-1" />
            Reveal
          </Button>
        </div>

        {/* Tactical notes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tactical Notes</span>
            <Button size="sm" variant="ghost" className="h-5 text-xs" onClick={addTacticalNote}>
              + Add
            </Button>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {tacticalNotes.map((note, idx) => (
              <Input
                key={idx}
                value={note}
                onChange={(e) => {
                  setTacticalNotes((prev) =>
                    prev.map((n, i) => (i === idx ? e.target.value : n))
                  );
                }}
                className="h-7 text-xs"
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetFormation} disabled={!selectedFormation}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={saveFormation} disabled={customPositions.length === 0}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" disabled={!selectedFormation}>
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
