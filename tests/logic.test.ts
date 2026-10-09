// Testes da lógica da sua cobra. Rode com `npm test`.
//
// Usamos o test runner que já vem no Node (node:test), sem nenhuma biblioteca
// extra. Conforme você for implementando os TODOs de src/app/logic.ts, escreva
// testes novos aqui: eles rodam no GitHub Actions antes de cada deploy.

import test from "node:test";
import assert from "node:assert/strict";
import { info, start, move, end } from "../src/app/logic";
import { handler } from "../src/app/index";

const DIRECTIONS = ["up", "down", "left", "right"] as const;

// Monta um estado de jogo mínimo para os testes.
function gameState(head: { x: number; y: number }, neck: { x: number; y: number }) {
  const you = {
    id: "minha-cobra",
    name: "MinhaCobra",
    health: 100,
    body: [head, neck, { x: neck.x, y: neck.y - 1 }],
    head,
    length: 3,
    latency: "50",
    shout: "",
  };

  return {
    game: {
      id: "partida-de-teste",
      ruleset: { name: "standard", version: "v1.2.3" },
      map: "standard",
      timeout: 500,
    },
    turn: 4,
    board: {
      height: 11,
      width: 11,
      food: [{ x: 5, y: 5 }],
      hazards: [],
      snakes: [you],
    },
    you,
  } as any;
}

// T1 — info retorna os campos obrigatórios
test("info devolve os campos obrigatórios", () => {
  const response = info() as any;

  assert.equal(response.apiversion, "1");
  assert.ok("author" in response);
  assert.ok("color" in response);
  assert.ok("head" in response);
  assert.ok("tail" in response);
});

// T2 — move retorna sempre uma direção válida
test("move devolve sempre uma direção válida", () => {
  const state = gameState({ x: 5, y: 4 }, { x: 4, y: 4 });

  for (let i = 0; i < 50; i++) {
    assert.ok(DIRECTIONS.includes(move(state).move as any));
  }
});

// T3 — nunca volta por cima do pescoço
test("nunca volta por cima do pescoço", () => {
  const casos: Array<[{ x: number; y: number }, string]> = [
    [{ x: 4, y: 4 }, "left"],   // pescoço à esquerda
    [{ x: 6, y: 4 }, "right"],  // pescoço à direita
    [{ x: 5, y: 3 }, "down"],   // pescoço abaixo
    [{ x: 5, y: 5 }, "up"],     // pescoço acima
  ];

  for (const [neck, proibida] of casos) {
    const state = gameState({ x: 5, y: 4 }, neck);

    for (let i = 0; i < 50; i++) {
      assert.notEqual(
        move(state).move,
        proibida,
        `a cobra andou para trás (${proibida})`
      );
    }
  }
});

// T4 — evita parede quando tem outra opção
test("evita parede quando tem opção", () => {
  // Cobra no canto inferior esquerdo, pescoço à direita -> só pode ir para cima
  // (left = fora, down = fora, right = pescoço bloqueado)
  const state = gameState({ x: 0, y: 0 }, { x: 1, y: 0 });

  for (let i = 0; i < 50; i++) {
    const chosen = move(state).move;
    assert.ok(DIRECTIONS.includes(chosen as any), `direção inválida: ${chosen}`);
    // Não pode ir para a esquerda (x=-1) nem para baixo (y=-1)
    assert.notEqual(chosen, "left", "foi para fora do tabuleiro (esquerda)");
    assert.notEqual(chosen, "down", "foi para fora do tabuleiro (baixo)");
  }
});

// T5 — evita o próprio corpo quando tem opção
test("evita próprio corpo quando tem opção", () => {
  // Cabeça em (5,4), corpo bloqueando para a esquerda (pescoço) e para cima
  // Restam: right e down
  const head = { x: 5, y: 4 };
  const neck = { x: 4, y: 4 };  // pescoço à esquerda
  const bodyBlock = { x: 5, y: 5 };  // corpo acima
  const state = {
    ...gameState(head, neck),
  };
  // Sobrescrever o body para incluir o bloco acima
  state.you.body = [head, neck, bodyBlock, { x: 4, y: 3 }];
  state.board.snakes = [state.you];

  for (let i = 0; i < 50; i++) {
    const chosen = move(state).move;
    assert.ok(DIRECTIONS.includes(chosen as any));
    assert.notEqual(chosen, "left", "voltou pelo pescoço");
    assert.notEqual(chosen, "up", "bateu no próprio corpo");
  }
});

// T6 — comportamento definido quando não há safe moves
test("comportamento definido quando não há safe moves", () => {
  // Cobra completamente encurralada — todas as direções são inseguras.
  // O importante é não lançar exceção e retornar uma direção válida.
  const head = { x: 0, y: 0 };
  const neck = { x: 0, y: 1 };  // pescoço acima (bloqueia up)
  const state = gameState(head, neck);
  // A cobra já não pode ir para left (x=-1), down (y=-1), ou up (pescoço)
  // Só resta right, que é um safe move. Para testar o fallback real,
  // adicionamos corpo à direita também:
  state.you.body = [head, neck, { x: 1, y: 0 }, { x: 0, y: 1 }];
  state.board.snakes = [state.you];

  // Mesmo encurralada, deve retornar sem lançar exceção e retornar direção válida
  assert.doesNotThrow(() => {
    const result = move(state);
    assert.ok(DIRECTIONS.includes(result.move as any), `direção inválida: ${result.move}`);
  });
});

// start e end não lançam exceções com estado válido
test("start e end não quebram com estado de jogo válido", () => {
  const state = gameState({ x: 5, y: 4 }, { x: 4, y: 4 });

  assert.doesNotThrow(() => start(state as any));
  assert.doesNotThrow(() => end(state as any));
});

function apiGatewayEvent(method: string, path: string, body?: any) {
  const ehRaiz = path === "/" || path === "";
  return {
    resource: ehRaiz ? "/" : "/{proxy+}",
    path,
    httpMethod: method,
    headers: { "Content-Type": "application/json" },
    multiValueHeaders: {},
    queryStringParameters: null,
    pathParameters: ehRaiz ? null : { proxy: path.replace(/^\//, "") },
    requestContext: { stage: "dev", path, httpMethod: method },
    body: body === undefined ? null : JSON.stringify(body),
    isBase64Encoded: false,
  } as any;
}

test("GET / devolve os metadados da cobra", async () => {
  const res = await (handler as any)(apiGatewayEvent("GET", "/"), {});
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.equal(body.apiversion, "1");
});

test("POST /start responde ok", async () => {
  const state = gameState({ x: 5, y: 4 }, { x: 4, y: 4 });
  const res = await (handler as any)(apiGatewayEvent("POST", "/start", state), {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, "ok");
});

test("POST /move responde com direção válida", async () => {
  const state = gameState({ x: 5, y: 4 }, { x: 4, y: 4 });
  const res = await (handler as any)(apiGatewayEvent("POST", "/move", state), {});
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body);
  assert.ok(DIRECTIONS.includes(body.move));
});

test("POST /end responde ok", async () => {
  const state = gameState({ x: 5, y: 4 }, { x: 4, y: 4 });
  const res = await (handler as any)(apiGatewayEvent("POST", "/end", state), {});
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, "ok");
});

test("rota inexistente retorna HTTP 404", async () => {
  const res = await (handler as any)(apiGatewayEvent("GET", "/rota-inexistente"), {});
  assert.equal(res.statusCode, 404);
});

test("método inválido em rota existente retorna HTTP 404", async () => {
  const res = await (handler as any)(apiGatewayEvent("GET", "/move"), {});
  assert.equal(res.statusCode, 404);
});
