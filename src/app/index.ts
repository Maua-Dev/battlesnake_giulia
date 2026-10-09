// Ponte entre o AWS Lambda e a lógica da sua cobra.
//
// Você NÃO precisa mexer aqui. Este arquivo monta um servidor Express com as
// quatro rotas do Battlesnake e o embrulha com `serverless-http`, que traduz
// o evento do API Gateway em uma requisição HTTP comum.
//
// Rotas da API (https://docs.battlesnake.com/api):
//   GET  /        -> aparência da cobra
//   POST /start   -> a partida começou
//   POST /move    -> escolha a jogada deste turno
//   POST /end     -> a partida acabou

import express, { Request, Response, NextFunction } from "express";
import serverless from "serverless-http";
import { info, start, move, end } from "./logic";
import { GameState } from "./models";

export const app = express();

// Remove o prefixo do stage (ex: /dev, /staging, /prod) se presente.
//
// Dependendo de como a API é exposta, o caminho pode chegar ao Express com o
// nome do stage na frente ("/dev/move" em vez de "/move"). Sem esta
// normalização, o POST /move não casa com nenhuma rota.
app.use((req: Request, _res: Response, next: NextFunction) => {
  const stagePrefixRegex = /^\/(?:dev|homolog|prod|staging)(\/.*)?$/;
  const match = req.url.match(stagePrefixRegex);
  if (match) {
    req.url = match[1] || "/";
  }
  next();
});

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json(info());
});

app.post("/start", (req: Request, res: Response) => {
  start(req.body as GameState);
  res.send("ok");
});

app.post("/move", (req: Request, res: Response) => {
  res.json(move(req.body as GameState));
});

app.post("/end", (req: Request, res: Response) => {
  end(req.body as GameState);
  res.send("ok");
});

// Qualquer outro caminho ou método inexistente devolve 404 Not Found.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found" });
});

// Erro de parse do JSON -> 400
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`corpo da requisição inválido: ${err.message}`);
  res.status(400).json({ error: err.message });
});

// Handler para a Lambda (nome configurado no Terraform/IAC)
export const handler = serverless(app);
