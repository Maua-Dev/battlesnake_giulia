// Modelos que representam o estado do jogo enviado pelo Battlesnake.
// Você não precisa mexer neste arquivo, mas vale a pena ler: é o mapa
// completo de tudo que a sua cobra consegue "enxergar" a cada turno.
//
// Documentação: https://docs.battlesnake.com/api

/** Uma posição no tabuleiro. Origem (0,0) no canto inferior esquerdo. */
export interface Coord {
  x: number;
  y: number;
}

/** Uma cobra em jogo — pode ser a sua ou uma adversária. */
export interface Snake {
  id: string;
  name: string;
  /** Vai de 0 a 100. Chegou a 0, a cobra morre de fome. */
  health: number;
  /** Corpo inteiro, da cabeça (índice 0) até a cauda (último). */
  body: Coord[];
  head: Coord;
  length: number;
  latency?: string;
  shout?: string;
}

/** O tabuleiro no turno atual. */
export interface Board {
  height: number;
  width: number;
  /** Comidas disponíveis. Comer devolve vida a 100 e aumenta o corpo em 1. */
  food: Coord[];
  /** Casas perigosas (só aparecem em alguns modos). */
  hazards: Coord[];
  /** Todas as cobras vivas, incluindo a sua. */
  snakes: Snake[];
}

/** Metadados da partida. */
export interface Game {
  id: string;
  ruleset: Record<string, unknown>;
  map?: string;
  /** Tempo máximo, em milissegundos, para responder o /move. */
  timeout: number;
}

/** O pacote completo que chega em /start, /move e /end. */
export interface GameState {
  game: Game;
  turn: number;
  board: Board;
  you: Snake;
}
