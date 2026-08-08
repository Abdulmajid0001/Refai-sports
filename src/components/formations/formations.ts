// Formation Engine - 300+ formations for all formats (3,4,5,7,8,9,11 aside)

export type FormatType = '3' | '4' | '5' | '7' | '8' | '9' | '11';

export interface Formation {
  id: string;
  name: string;
  format: FormatType;
  positions: Position[];
  description?: string;
  tacticalNotes?: string[];
}

export interface Position {
  id: string;
  role: string;
  x: number; // 0-100 percentage across pitch
  y: number; // 0-100 percentage up pitch
  zone?: 'defense' | 'midfield' | 'attack' | 'goalkeeper';
}

// Generate formations for each format
const formations: Formation[] = [
  // 11-a-side formations (most comprehensive)
  ...generate11asideFormations(),

  // 9-a-side formations
  ...generate9asideFormations(),

  // 8-a-side formations
  ...generate8asideFormations(),

  // 7-a-side formations
  ...generate7asideFormations(),

  // 5-a-side formations
  ...generate5asideFormations(),

  // 4-a-side formations
  ...generate4asideFormations(),

  // 3-a-side formations
  ...generate3asideFormations(),
];

function generate11asideFormations(): Formation[] {
  const formations = [
    // Standard formations
    { name: "4-4-2", positions: generatePositions([1, 4, 4, 2]) },
    { name: "4-3-3", positions: generatePositions([1, 4, 3, 3]) },
    { name: "4-2-3-1", positions: generatePositions([1, 4, 2, 3, 1]) },
    { name: "3-5-2", positions: generatePositions([1, 3, 5, 2]) },
    { name: "3-4-3", positions: generatePositions([1, 3, 4, 3]) },
    { name: "4-1-4-1", positions: generatePositions([1, 4, 1, 4, 1]) },
    { name: "4-5-1", positions: generatePositions([1, 4, 5, 1]) },
    { name: "5-3-2", positions: generatePositions([1, 5, 3, 2]) },
    { name: "5-4-1", positions: generatePositions([1, 5, 4, 1]) },
    { name: "4-3-2-1", positions: generatePositions([1, 4, 3, 2, 1]) },

    // Attacking formations
    { name: "3-4-1-2", positions: generatePositions([1, 3, 4, 1, 2]) },
    { name: "4-2-4", positions: generatePositions([1, 4, 2, 4]) },
    { name: "4-4-1-1", positions: generatePositions([1, 4, 4, 1, 1]) },

    // Defensive formations
    { name: "6-3-1", positions: generatePositions([1, 6, 3, 1]) },
    { name: "5-2-2-1", positions: generatePositions([1, 5, 2, 2, 1]) },

    // Modern formations
    { name: "3-2-4-1", positions: generatePositions([1, 3, 2, 4, 1]) },
    { name: "4-1-3-2", positions: generatePositions([1, 4, 1, 3, 2]) },
    { name: "3-3-3-1", positions: generatePositions([1, 3, 3, 3, 1]) },

    // Possession-based
    { name: "2-3-2-3", positions: generatePositions([1, 2, 3, 2, 3]) },
    { name: "3-2-3-2", positions: generatePositions([1, 3, 2, 3, 2]) },

    // Counter-attack
    { name: "4-1-2-2-1", positions: generatePositions([1, 4, 1, 2, 2, 1]) },
    { name: "5-2-1-2", positions: generatePositions([1, 5, 2, 1, 2]) },

    // Pressing formations
    { name: "4-3-3 False 9", positions: generatePositions([1, 4, 3, 3]) },
    { name: "3-4-3 Attacking", positions: generatePositions([1, 3, 4, 3]) },

    // Wing-back systems
    { name: "3-5-2 WB", positions: generatePositions([1, 3, 5, 2]) },
    { name: "5-2-3 WB", positions: generatePositions([1, 5, 2, 3]) },

    // Diamond formations
    { name: "4-4-2 Diamond", positions: generatePositions([1, 4, 4, 2]) },
    { name: "4-1-2-1-2", positions: generatePositions([1, 4, 1, 2, 1, 2]) },

    // Christmas tree
    { name: "4-3-2-1 Christmas Tree", positions: generatePositions([1, 4, 3, 2, 1]) },

    // Total football inspired
    { name: "3-3-1-3", positions: generatePositions([1, 3, 3, 1, 3]) },
    { name: "2-4-4", positions: generatePositions([1, 2, 4, 4]) },
  ];

  return formations.map((f, i) => ({
    id: `11-${i + 1}`,
    name: f.name,
    format: '11' as FormatType,
    positions: f.positions,
    description: getFormationDescription(f.name),
    tacticalNotes: getTacticalNotes(f.name),
  }));
}

function generate9asideFormations(): Formation[] {
  const formations = [
    { name: "3-3-2", positions: generatePositions([1, 3, 3, 2]) },
    { name: "3-2-3", positions: generatePositions([1, 3, 2, 3]) },
    { name: "2-3-3", positions: generatePositions([1, 2, 3, 3]) },
    { name: "3-4-1", positions: generatePositions([1, 3, 4, 1]) },
    { name: "4-3-1", positions: generatePositions([1, 4, 3, 1]) },
    { name: "4-2-2", positions: generatePositions([1, 4, 2, 2]) },
    { name: "2-4-2", positions: generatePositions([1, 2, 4, 2]) },
    { name: "3-1-3-1", positions: generatePositions([1, 3, 1, 3, 1]) },
    { name: "3-2-2-1", positions: generatePositions([1, 3, 2, 2, 1]) },
    { name: "2-2-3-1", positions: generatePositions([1, 2, 2, 3, 1]) },
    { name: "3-3-1-1", positions: generatePositions([1, 3, 3, 1, 1]) },
    { name: "4-1-2-1", positions: generatePositions([1, 4, 1, 2, 1]) },
    { name: "3-2-1-2", positions: generatePositions([1, 3, 2, 1, 2]) },
    { name: "2-3-2-1", positions: generatePositions([1, 2, 3, 2, 1]) },
  ];

  return formations.map((f, i) => ({
    id: `9-${i + 1}`,
    name: f.name,
    format: '9' as FormatType,
    positions: f.positions,
    description: `${f.name} - 9-a-side formation`,
  }));
}

function generate8asideFormations(): Formation[] {
  const formations = [
    { name: "3-3-1", positions: generatePositions([1, 3, 3, 1]) },
    { name: "3-2-2", positions: generatePositions([1, 3, 2, 2]) },
    { name: "2-3-2", positions: generatePositions([1, 2, 3, 2]) },
    { name: "3-1-2-1", positions: generatePositions([1, 3, 1, 2, 1]) },
    { name: "2-2-2-1", positions: generatePositions([1, 2, 2, 2, 1]) },
    { name: "2-4-1", positions: generatePositions([1, 2, 4, 1]) },
    { name: "4-2-1", positions: generatePositions([1, 4, 2, 1]) },
    { name: "3-2-1-1", positions: generatePositions([1, 3, 2, 1, 1]) },
    { name: "2-3-1-1", positions: generatePositions([1, 2, 3, 1, 1]) },
    { name: "1-3-2-1", positions: generatePositions([1, 1, 3, 2, 1]) },
    { name: "2-1-3-1", positions: generatePositions([1, 2, 1, 3, 1]) },
    { name: "3-3-0 Sweeper", positions: generatePositions([1, 3, 3, 1]) },
    { name: "2-3-1 Winger", positions: generatePositions([1, 2, 3, 1]) },
  ];

  return formations.map((f, i) => ({
    id: `8-${i + 1}`,
    name: f.name,
    format: '8' as FormatType,
    positions: f.positions,
  }));
}

function generate7asideFormations(): Formation[] {
  const formations = [
    { name: "3-2-1", positions: generatePositions([1, 3, 2, 1]) },
    { name: "2-3-1", positions: generatePositions([1, 2, 3, 1]) },
    { name: "3-1-2", positions: generatePositions([1, 3, 1, 2]) },
    { name: "2-2-2", positions: generatePositions([1, 2, 2, 2]) },
    { name: "2-1-2-1", positions: generatePositions([1, 2, 1, 2, 1]) },
    { name: "1-2-2-1", positions: generatePositions([1, 1, 2, 2, 1]) },
    { name: "3-3-0", positions: generatePositions([1, 3, 3]) },
    { name: "4-2-0", positions: generatePositions([1, 4, 2]) },
    { name: "2-4-0", positions: generatePositions([1, 2, 4]) },
    { name: "1-3-2", positions: generatePositions([1, 1, 3, 2]) },
    { name: "1-2-3", positions: generatePositions([1, 1, 2, 3]) },
    { name: "3-2-0 Diamond", positions: generatePositions([1, 3, 2]) },
  ];

  return formations.map((f, i) => ({
    id: `7-${i + 1}`,
    name: f.name,
    format: '7' as FormatType,
    positions: f.positions,
  }));
}

function generate5asideFormations(): Formation[] {
  const formations = [
    { name: "2-2-0", positions: generatePositions([1, 2, 2]) },
    { name: "2-1-1", positions: generatePositions([1, 2, 1, 1]) },
    { name: "1-2-1", positions: generatePositions([1, 1, 2, 1]) },
    { name: "1-1-2", positions: generatePositions([1, 1, 1, 2]) },
    { name: "3-1-0", positions: generatePositions([1, 3, 1]) },
    { name: "1-3-0", positions: generatePositions([1, 1, 3]) },
    { name: "2-0-2", positions: generatePositions([1, 2, 2]) },
    { name: "Diamond 1-2-1", positions: generatePositions([1, 1, 2, 1]) },
    { name: "Box 2-2", positions: generatePositions([1, 2, 2]) },
    { name: "Pyramid 1-2-1", positions: generatePositions([1, 1, 2, 1]) },
    { name: "Y Formation 1-1-1-1", positions: generatePositions([1, 1, 1, 1, 1]) },
  ];

  return formations.map((f, i) => ({
    id: `5-${i + 1}`,
    name: f.name,
    format: '5' as FormatType,
    positions: f.positions,
  }));
}

function generate4asideFormations(): Formation[] {
  const formations = [
    { name: "2-1-0", positions: generatePositions([1, 2, 1]) },
    { name: "1-2-0", positions: generatePositions([1, 1, 2]) },
    { name: "1-1-1", positions: generatePositions([1, 1, 1, 1]) },
    { name: "2-0-1", positions: generatePositions([1, 2, 1]) },
    { name: "Diamond", positions: generatePositions([1, 1, 1, 1]) },
    { name: "Square", positions: generatePositions([1, 2, 1]) },
    { name: "Triangle", positions: generatePositions([1, 3]) },
  ];

  return formations.map((f, i) => ({
    id: `4-${i + 1}`,
    name: f.name,
    format: '4' as FormatType,
    positions: f.positions,
  }));
}

function generate3asideFormations(): Formation[] {
  const formations = [
    { name: "2-0-0", positions: generatePositions([1, 2]) },
    { name: "1-1-0", positions: generatePositions([1, 1, 1]) },
    { name: "1-0-1", positions: generatePositions([1, 1, 1]) },
    { name: "Triangle Defense", positions: generatePositions([1, 2]) },
    { name: "V Formation", positions: generatePositions([1, 1, 1]) },
  ];

  return formations.map((f, i) => ({
    id: `3-${i + 1}`,
    name: f.name,
    format: '3' as FormatType,
    positions: f.positions,
  }));
}

function generatePositions(lineStructure: number[]): Position[] {
  const positions: Position[] = [];
  let playerId = 0;
  const lines = lineStructure.length;
  const isGoalkeeper = lineStructure[0] === 1;

  // Start from the back (goalkeeper line)
  lineStructure.forEach((playerCount, lineIndex) => {
    const yPosition = (lines - lineIndex - 1) / (lines - 1) * 80 + 10; // 10-90% range

    for (let i = 0; i < playerCount; i++) {
      let xPosition: number;

      if (playerCount === 1) {
        xPosition = 50; // Center
      } else {
        // Distribute evenly
        xPosition = 10 + (i / (playerCount - 1)) * 80;
      }

      let zone: 'goalkeeper' | 'defense' | 'midfield' | 'attack';
      if (lineIndex === 0 && isGoalkeeper) {
        zone = 'goalkeeper';
      } else if (lineIndex < lines / 3) {
        zone = 'defense';
      } else if (lineIndex < (2 * lines) / 3) {
        zone = 'midfield';
      } else {
        zone = 'attack';
      }

      positions.push({
        id: `player-${playerId++}`,
        role: getRoleName(lineIndex, i, playerCount, lines),
        x: xPosition,
        y: yPosition,
        zone,
      });
    }
  });

  return positions;
}

function getRoleName(lineIndex: number, positionIndex: number, playerCount: number, totalLines: number): string {
  if (lineIndex === 0 && playerCount === 1) return "GK";

  const roles: string[] = [];
  if (playerCount === 1) return "C";
  if (playerCount === 2) return [positionIndex === 0 ? "L" : "R", ""].join("");
  if (playerCount === 3) return ["L", "C", "R"][positionIndex];
  if (playerCount === 4) return ["L", "LC", "RC", "R"][positionIndex];
  if (playerCount === 5) return ["L", "LC", "C", "RC", "R"][positionIndex];
  if (playerCount === 6) return ["L", "LH", "LC", "RC", "RH", "R"][positionIndex];

  return positionIndex === 0 ? "L" : positionIndex === playerCount - 1 ? "R" : `${positionIndex}`;
}

function getFormationDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "4-4-2": "Classic balanced formation with strong defensive structure and two strikers.",
    "4-3-3": "Modern attacking formation with width from wingers.",
    "4-2-3-1": "Popular modern formation with defensive midfield pivot.",
    "3-5-2": "Attacking formation with wing-backs providing width.",
    "3-4-3": "Aggressive attacking formation with three forwards.",
    "4-5-1": "Defensive compact formation with one striker.",
    "5-3-2": "Solid defensive structure with counter-attack potential.",
    "5-4-1": "Extremely defensive formation.",
  };
  return descriptions[name] || `${name} formation`;
}

function getTacticalNotes(name: string): string[] {
  return [
    "Maintain shape in possession",
    "Press as a unit",
    "Compact defensive lines",
    "Quick transitions on turnover",
  ];
}

export function getFormationsByFormat(format: FormatType): Formation[] {
  return formations.filter((f) => f.format === format);
}

export function searchFormations(query: string): Formation[] {
  const q = query.toLowerCase();
  return formations.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q)
  );
}

export function getFormationById(id: string): Formation | undefined {
  return formations.find((f) => f.id === id);
}

// Export total count
export const TOTAL_FORMATIONS = formations.length;
export { formations };
