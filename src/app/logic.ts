import { GameState, Coord, Snake } from "./models";

export function info(): object {
  return {
    apiversion: "1",
    author: "Giulia",
    color: "#f800cb",
    head: "evil",
    tail: "block-bum",
    version: "2.0.0",
  };
}

export function start(gameState: GameState): void {
  console.log(`INICIANDO BATTLESNAKE VENCER (Partida ${gameState.game.id})`);
}

export function end(gameState: GameState): void {
  console.log(`FIM DA PARTIDA (Turno ${gameState.turn})`);
}

const MOVES: Array<[string, number, number]> = [
  ["up", 0, 1],
  ["down", 0, -1],
  ["left", -1, 0],
  ["right", 1, 0],
];

const same = (a: Coord, b: Coord) => a.x === b.x && a.y === b.y;
const distance = (a: Coord, b: Coord) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

class AdvancedGrid {
  public width: number;
  public height: number;
  public expiryMap: number[]; 

  constructor(width: number, height: number, snakes: Snake[]) {
    this.width = width;
    this.height = height;
    this.expiryMap = new Array(width * height).fill(0);

    for (const snake of snakes) {
      const len = snake.body.length;
      for (let i = 0; i < len; i++) {
        const seg = snake.body[i];
        if (this.inside(seg)) {
          const turnsRemaining = len - i;
          const idx = this.idx(seg);
          this.expiryMap[idx] = Math.max(this.expiryMap[idx], turnsRemaining);
        }
      }
    }
  }

  inside(c: Coord): boolean {
    return c.x >= 0 && c.y >= 0 && c.x < this.width && c.y < this.height;
  }

  idx(c: Coord): number {
    return c.y * this.width + c.x;
  }

  isSolidAt(c: Coord, turnOffset: number): boolean {
    if (!this.inside(c)) return true;
    return this.expiryMap[this.idx(c)] > turnOffset;
  }

  getVoronoiTerritory(myHead: Coord, myLength: number, opponents: Snake[]): number {
    const distMap = new Array(this.width * this.height).fill(Infinity);
    const ownerMap = new Array(this.width * this.height).fill(null);

    const queue: Array<{ coord: Coord; dist: number; ownerId: string; length: number }> = [];

    queue.push({ coord: myHead, dist: 0, ownerId: "me", length: myLength });
    distMap[this.idx(myHead)] = 0;

    // Adiciona cobras adversárias
    for (const opp of opponents) {
      queue.push({ coord: opp.head, dist: 0, ownerId: opp.id, length: opp.length });
      distMap[this.idx(opp.head)] = 0;
    }

    let mySpaceCount = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const [, dx, dy] of MOVES) {
        const next = { x: current.coord.x + dx, y: current.coord.y + dy };
        if (!this.inside(next) || this.isSolidAt(next, current.dist + 1)) continue;

        const nextIdx = this.idx(next);
        const nextDist = current.dist + 1;

        if (nextDist < distMap[nextIdx]) {
          distMap[nextIdx] = nextDist;
          ownerMap[nextIdx] = current.ownerId;
          queue.push({ coord: next, dist: nextDist, ownerId: current.ownerId, length: current.length });
        } else if (nextDist === distMap[nextIdx]) {
          // Em caso de empate de distância, se a cobra adversária for >= a nós, perdemos a posse da casa
          if (current.ownerId !== "me" && current.length >= myLength) {
            ownerMap[nextIdx] = "contested";
          }
        }
      }
    }

    for (let i = 0; i < ownerMap.length; i++) {
      if (ownerMap[i] === "me") mySpaceCount++;
    }

    return mySpaceCount;
  }
}

export function move(gameState: GameState): { move: string } {
  const me = gameState.you;
  const head = me.head;
  const { width, height, food } = gameState.board;
  const grid = new AdvancedGrid(width, height, gameState.board.snakes);
  const opponents = gameState.board.snakes.filter((s) => s.id !== me.id);

  let bestMove = "up";
  let highestScore = -Infinity;

  for (const [dir, dx, dy] of MOVES) {
    const target = { x: head.x + dx, y: head.y + dy };

    // 1. Morte Imediata: Parede ou segmento sólido
    if (grid.isSolidAt(target, 1)) continue;

    let score = 0;

    // 2. Head-to-Head Ativo / Preditivo
    let fatalH2H = false;
    for (const opp of opponents) {
      const oppDist = distance(opp.head, target);

      if (oppDist === 1) {
        if (opp.length >= me.length) {
          // Risco real de colisão letal no próximo turno
          fatalH2H = true;
          break;
        } else {
          // Oportunidade de eliminar cobra menor
          score += 450;
        }
      }
    }
    if (fatalH2H) continue; // Evita totalmente o movimento fatal de H2H

    // 3. Controle Espacial Dinâmico (Voronoi)
    const territorySize = grid.getVoronoiTerritory(target, me.length, opponents);
    score += territorySize * 15;

    // Penalidade massiva se o território for menor que o próprio corpo (armadilha/beco)
    if (territorySize < me.length) {
      score -= 2000;
    }

    // 4. Perseguição de Cauda (Escape de Emergência)
    const myTail = me.body[me.body.length - 1];
    const distToTail = distance(target, myTail);
    score -= distToTail * 2; // Mantém leve atração para estar perto da própria saída

    // 5. Gestão Agressiva de Comida
    if (food.length > 0) {
      const closestFood = food.reduce((prev, curr) =>
        distance(target, curr) < distance(target, prev) ? curr : prev
      );
      const foodDist = distance(target, closestFood);

      const isLargest = opponents.every((opp) => me.length > opp.length);

      if (me.health < 35) {
        // Prioridade MÁXIMA por comida em caso de fome
        score += Math.max(0, 300 - foodDist * 20);
      } else if (!isLargest) {
        // Se não for a maior cobra da mesa, busca comida para liderar
        score += Math.max(0, 100 - foodDist * 5);
      } else {
        // Se já for a maior cobra, evita comer à toa para não encher o mapa
        score -= foodDist * 2;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMove = dir;
    }
  }

  return { move: bestMove };
}