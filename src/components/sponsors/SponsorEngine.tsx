import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Megaphone, Image, Video, DollarSign, TrendingUp, Clock,
  Play, Pause, Eye, Trash2, Plus, Settings, RefreshCw,
  BarChart3, Target, Zap, Monitor, Smartphone, Tv
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface AdSlot {
  id: string;
  name: string;
  type: "banner" | "overlay" | "replay_sponsor" | "halftime" | "corner_graphic" | "scoreboard_logo";
  position: string;
  dimensions: { width: number; height: number };
  pricePerView: number;
  minDuration: number;
  maxDuration: number;
  active: boolean;
}

interface SponsorAd {
  id: string;
  slotId: string;
  sponsorName: string;
  creativeUrl: string;
  clickUrl?: string;
  impressionCount: number;
  clickCount: number;
  spend: number;
  budget: number;
  status: "active" | "paused" | "completed" | "draft";
  startDate: Date;
  endDate?: Date;
  targeting?: {
    leagues?: string[];
    teams?: string[];
    regions?: string[];
  };
}

interface SponsorEngineProps {
  leagueId?: string;
  matchId?: string;
}

const defaultAdSlots: AdSlot[] = [
  {
    id: "slot-banner-top",
    name: "Top Banner",
    type: "banner",
    position: "top",
    dimensions: { width: 728, height: 90 },
    pricePerView: 0.02,
    minDuration: 5,
    maxDuration: 30,
    active: true,
  },
  {
    id: "slot-overlay-goal",
    name: "Goal Replay Sponsor",
    type: "replay_sponsor",
    position: "overlay",
    dimensions: { width: 300, height: 100 },
    pricePerView: 0.15,
    minDuration: 3,
    maxDuration: 10,
    active: true,
  },
  {
    id: "slot-halftime",
    name: "Halftime Ad Break",
    type: "halftime",
    position: "fullscreen",
    dimensions: { width: 1920, height: 1080 },
    pricePerView: 0.50,
    minDuration: 15,
    maxDuration: 60,
    active: true,
  },
  {
    id: "slot-corner",
    name: "Corner Graphic",
    type: "corner_graphic",
    position: "bottom_right",
    dimensions: { width: 200, height: 150 },
    pricePerView: 0.05,
    minDuration: 10,
    maxDuration: 60,
    active: true,
  },
  {
    id: "slot-scoreboard",
    name: "Scoreboard Logo",
    type: "scoreboard_logo",
    position: "scoreboard",
    dimensions: { width: 80, height: 40 },
    pricePerView: 0.10,
    minDuration: 30,
    maxDuration: 300,
    active: true,
  },
];

export function SponsorEngine({ leagueId, matchId }: SponsorEngineProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [adSlots, setAdSlots] = useState<AdSlot[]>(defaultAdSlots);
  const [activeAds, setActiveAds] = useState<SponsorAd[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AdSlot | null>(null);
  const [stats, setStats] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    totalSpend: 0,
    estimatedRevenue: 0,
  });

  // New ad form
  const [newAd, setNewAd] = useState({
    sponsorName: "",
    creativeUrl: "",
    clickUrl: "",
    budget: 100,
    slotId: "",
  });

  // Load sponsor data
  const loadData = useCallback(async () => {
    setIsLoading(true);

    // Load ad slots for league
    if (leagueId) {
      const { data: slotsData } = await supabase
        .from("ad_slots")
        .select("*")
        .eq("league_id", leagueId);

      if (slotsData && slotsData.length > 0) {
        setAdSlots(slotsData as AdSlot[]);
      }
    }

    // Load active ads
    const adsQuery = supabase
      .from("sponsor_ads")
      .select("*")
      .eq("status", "active");

    if (leagueId) {
      adsQuery.contains("targeting->leagues", [leagueId]);
    }

    const { data: adsData } = await adsQuery;

    if (adsData) {
      setActiveAds(
        adsData.map((ad: any) => ({
          id: ad.id,
          slotId: ad.slot_id,
          sponsorName: ad.sponsor_name,
          creativeUrl: ad.creative_url,
          clickUrl: ad.click_url,
          impressionCount: ad.impression_count || 0,
          clickCount: ad.click_count || 0,
          spend: ad.spend || 0,
          budget: ad.budget,
          status: ad.status,
          startDate: new Date(ad.start_date),
          endDate: ad.end_date ? new Date(ad.end_date) : undefined,
          targeting: ad.targeting,
        }))
      );
    }

    // Calculate stats
    const totalImpressions = (adsData || []).reduce((sum: number, ad: any) => sum + (ad.impression_count || 0), 0);
    const totalClicks = (adsData || []).reduce((sum: number, ad: any) => sum + (ad.click_count || 0), 0);
    const totalSpend = (adsData || []).reduce((sum: number, ad: any) => sum + (ad.spend || 0), 0);
    const estimatedRevenue = totalImpressions * 0.03; // Average revenue

    setStats({
      totalImpressions,
      totalClicks,
      totalSpend,
      estimatedRevenue,
    });

    setIsLoading(false);
  }, [leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create new ad
  const createAd = useCallback(async () => {
    if (!newAd.sponsorName || !newAd.creativeUrl || !newAd.slotId) {
      toast.error("Fill all required fields");
      return;
    }

    const slot = adSlots.find((s) => s.id === newAd.slotId);
    if (!slot) return;

    const { error } = await supabase.from("sponsor_ads").insert({
      slot_id: newAd.slotId,
      sponsor_name: newAd.sponsorName,
      creative_url: newAd.creativeUrl,
      click_url: newAd.clickUrl,
      budget: newAd.budget,
      status: "draft",
      start_date: new Date().toISOString(),
      targeting: leagueId ? { leagues: [leagueId] } : {},
    });

    if (error) {
      toast.error("Failed to create ad");
    } else {
      toast.success("Ad created successfully");
      setNewAd({
        sponsorName: "",
        creativeUrl: "",
        clickUrl: "",
        budget: 100,
        slotId: "",
      });
      loadData();
    }
  }, [newAd, adSlots, leagueId, loadData]);

  // Toggle ad status
  const toggleAdStatus = useCallback(async (adId: string, currentStatus: SponsorAd["status"]) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";

    const { error } = await supabase
      .from("sponsor_ads")
      .update({ status: newStatus })
      .eq("id", adId);

    if (error) {
      toast.error("Failed to update ad");
    } else {
      toast.success(`Ad ${newStatus}`);
      loadData();
    }
  }, [loadData]);

  // Delete ad
  const deleteAd = useCallback(async (adId: string) => {
    if (!confirm("Delete this ad?")) return;

    const { error } = await supabase.from("sponsor_ads").delete().eq("id", adId);

    if (error) {
      toast.error("Failed to delete ad");
    } else {
      toast.success("Ad deleted");
      loadData();
    }
  }, [loadData]);

  // Record impression
  const recordImpression = useCallback(async (adId: string, slotType: AdSlot["type"]) => {
    const ad = activeAds.find((a) => a.id === adId);
    if (!ad) return;

    const slot = adSlots.find((s) => s.id === ad.slotId);
    const cost = slot?.pricePerView || 0;

    await supabase
      .from("sponsor_ads")
      .update({
        impression_count: ad.impressionCount + 1,
        spend: ad.spend + cost,
      })
      .eq("id", adId);
  }, [activeAds, adSlots]);

  // Record click
  const recordClick = useCallback(async (adId: string) => {
    const ad = activeAds.find((a) => a.id === adId);
    if (!ad) return;

    await supabase
      .from("sponsor_ads")
      .update({
        click_count: ad.clickCount + 1,
      })
      .eq("id", adId);
  }, [activeAds]);

  return (
    <div className="space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-cyan-400" />
              Sponsor Engine
            </CardTitle>
            <Button size="sm" variant="outline" onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
              <Eye className="h-4 w-4 mx-auto text-blue-400 mb-1" />
              <div className="text-lg font-bold text-white">{stats.totalImpressions.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">Impressions</div>
            </div>
            <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
              <Target className="h-4 w-4 mx-auto text-green-400 mb-1" />
              <div className="text-lg font-bold text-white">{stats.totalClicks.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">Clicks</div>
            </div>
            <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
              <DollarSign className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
              <div className="text-lg font-bold text-white">${stats.totalSpend.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">Ad Spend</div>
            </div>
            <div className="p-2 bg-slate-800/50 rounded border border-slate-700 text-center">
              <TrendingUp className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
              <div className="text-lg font-bold text-white">${stats.estimatedRevenue.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400">Est. Revenue</div>
            </div>
          </div>

          {/* Ad Slots */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400">Available Ad Slots</div>
            <div className="grid grid-cols-2 gap-2">
              {adSlots.map((slot) => {
                const activeAdsCount = activeAds.filter((a) => a.slotId === slot.id && a.status === "active").length;
                return (
                  <button
                    key={slot.id}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedSlot?.id === slot.id
                        ? "border-cyan-500 bg-cyan-950/30"
                        : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{slot.name}</span>
                      <Badge variant={slot.active ? "default" : "secondary"} className="text-[10px]">
                        {slot.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{slot.dimensions.width}x{slot.dimensions.height}</span>
                      <span>•</span>
                      <span>${slot.pricePerView}/view</span>
                      <span>•</span>
                      <span className="text-cyan-400">{activeAdsCount} ads</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create New Ad */}
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="text-xs font-semibold text-slate-400">Create New Ad</div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Sponsor Name"
                value={newAd.sponsorName}
                onChange={(e) => setNewAd((prev) => ({ ...prev, sponsorName: e.target.value }))}
              />
              <select
                value={newAd.slotId}
                onChange={(e) => setNewAd((prev) => ({ ...prev, slotId: e.target.value }))}
                className="px-2 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded text-white"
              >
                <option value="">Select Slot</option>
                {adSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.name} (${slot.pricePerView}/view)
                  </option>
                ))}
              </select>
              <Input
                placeholder="Creative URL (image/video)"
                value={newAd.creativeUrl}
                onChange={(e) => setNewAd((prev) => ({ ...prev, creativeUrl: e.target.value }))}
                className="col-span-2"
              />
              <Input
                placeholder="Click URL (optional)"
                value={newAd.clickUrl}
                onChange={(e) => setNewAd((prev) => ({ ...prev, clickUrl: e.target.value }))}
              />
              <Input
                type="number"
                placeholder="Budget ($)"
                value={newAd.budget}
                onChange={(e) => setNewAd((prev) => ({ ...prev, budget: Number(e.target.value) }))}
              />
            </div>
            <Button size="sm" onClick={createAd} disabled={isLoading} className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Create Ad
            </Button>
          </div>

          {/* Active Ads */}
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <div className="text-xs font-semibold text-slate-400">Active Ads ({activeAds.length})</div>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {activeAds.map((ad) => {
                const slot = adSlots.find((s) => s.id === ad.slotId);
                return (
                  <div
                    key={ad.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {slot?.type === "halftime" ? (
                          <Video className="h-4 w-4 text-purple-400" />
                        ) : (
                          <Image className="h-4 w-4 text-blue-400" />
                        )}
                        <span className="text-sm font-medium text-white">{ad.sponsorName}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {slot?.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleAdStatus(ad.id, ad.status)}
                        >
                          {ad.status === "active" ? (
                            <Pause className="h-3 w-3 text-yellow-400" />
                          ) : (
                            <Play className="h-3 w-3 text-green-400" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400"
                          onClick={() => deleteAd(ad.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Impressions: </span>
                        <span className="text-white">{ad.impressionCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Clicks: </span>
                        <span className="text-white">{ad.clickCount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Spend: </span>
                        <span className="text-white">${ad.spend.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Budget: </span>
                        <span className="text-white">${ad.budget.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${Math.min(100, (ad.spend / ad.budget) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {Math.round((ad.spend / ad.budget) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Insertion Preview */}
          {matchId && (
            <div className="space-y-2 border-t border-slate-700 pt-3">
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-2">
                <Zap className="h-3 w-3 text-yellow-400" />
                Dynamic Insertion Preview
              </div>
              <div className="p-3 bg-slate-800/30 rounded-lg border border-dashed border-slate-600">
                <div className="flex items-center justify-center gap-4">
                  <Monitor className="h-6 w-6 text-slate-400" />
                  <Tv className="h-6 w-6 text-slate-400" />
                  <Smartphone className="h-6 w-6 text-slate-400" />
                </div>
                <div className="text-center text-xs text-slate-400 mt-2">
                  Ads will be dynamically inserted during live broadcast
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
