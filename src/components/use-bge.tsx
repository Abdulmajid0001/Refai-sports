import { useState, useCallback, useRef, useEffect } from "react";
import type { BGEGraphic, BGEGraphicType, BGEDisplayMode, BGEAnimation } from "./types";
import { DEFAULT_DISPLAY_MODES, DEFAULT_DISMISS_MS } from "./types";

const STORAGE_KEY = "refai-bge-state";

export function useBGE() {
  const [activeGraphics, setActiveGraphics] = useState<BGEGraphic[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Load from storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveGraphics(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save to storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeGraphics));
    } catch {
      // Ignore storage errors
    }
  }, [activeGraphics]);

  const pushGraphic = useCallback((
    graphicType: BGEGraphicType,
    displayMode?: BGEDisplayMode,
    payload: Record<string, any> = {},
    animation?: BGEAnimation,
    templateId?: string,
    customDismissMs?: number
  ) => {
    const id = `${graphicType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const dm = displayMode ?? DEFAULT_DISPLAY_MODES[graphicType];
    const anim = animation ?? "fade";
    const dismissMs = customDismissMs ?? DEFAULT_DISMISS_MS[graphicType];

    const graphic: BGEGraphic = {
      id,
      graphicType,
      displayMode: dm,
      animation: anim,
      payload,
      templateId,
      autoDismissMs: dismissMs,
      createdAt: Date.now(),
    };

    setActiveGraphics((prev) => [...prev, graphic]);

    // Auto-dismiss if set
    if (dismissMs > 0) {
      const timer = setTimeout(() => {
        dismissGraphic(id);
      }, dismissMs);
      timersRef.current.set(id, timer);
    }

    return id;
  }, []);

  const dismissGraphic = useCallback((id: string) => {
    setActiveGraphics((prev) => prev.filter((g) => g.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismissAll = useCallback(() => {
    setActiveGraphics([]);
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const updateGraphic = useCallback((id: string, updates: Partial<BGEGraphic>) => {
    setActiveGraphics((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return {
    activeGraphics,
    pushGraphic,
    dismissGraphic,
    dismissAll,
    updateGraphic,
  };
}
