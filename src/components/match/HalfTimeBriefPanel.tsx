import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  events: string[];
};

export function HalfTimeBriefPanel({ home, away, homeScore, awayScore, events }: Props) {
  const homeEvents = events.filter(e => e.toLowerCase().includes(home.toLowerCase()) || !e.toLowerCase().includes(away.toLowerCase()));
  const awayEvents = events.filter(e => e.toLowerCase().includes(away.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>Half-time briefing</span>
          <Badge variant="secondary">Auto-generated</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="text-center text-lg font-bold">
          {home} {homeScore} - {awayScore} {away}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-xs uppercase text-muted-foreground">{home}</p>
            <ul className="mt-1 space-y-1 text-xs">
              {homeEvents.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              {homeEvents.length === 0 && <li className="text-muted-foreground">No events</li>}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-xs uppercase text-muted-foreground">{away}</p>
            <ul className="mt-1 space-y-1 text-xs">
              {awayEvents.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
              {awayEvents.length === 0 && <li className="text-muted-foreground">No events</li>}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
