# 🟦 Battlesnake TypeScript Template

Template de [Battlesnake](https://play.battlesnake.com) em **TypeScript**, com
**Express** rodando em **AWS Lambda** com **API Gateway**. O deploy é
automático: você programa, dá push, e o GitHub Actions devolve a URL da sua cobra.

---

## 📦 Pré-requisitos

- **Node.js 24 ou superior** — [nodejs.org/download](https://nodejs.org/en/download)
  Confira com `node --version`.
- Noções básicas de **TypeScript**, **API** e **Lambda**
- **Disposição, competitividade e força de vontade!**

Você **não** precisa instalar Terraform nem AWS CLI: quem cuida do deploy é o CD.

---

## 🚀 Como começar

1. Vá até o repositório [**devmaua_setup**](https://github.com/Maua-Dev/devmaua_setup),
   abra uma **issue** e escolha:
   - **project_name**: `battlesnake_nodejs_{seu nome}`
   - **project template**: `battlesnake_nodejs_template`
   - marque o repositório como **público**

2. Aguarde cerca de **1 minuto** e confira em
   [Repositórios da organização](https://github.com/orgs/Maua-Dev/repositories).

3. Clone e instale:
   ```bash
   git clone https://github.com/Maua-Dev/Nome_Do_Seu_Repositorio
   cd Nome_Do_Seu_Repositorio
   npm install
   ```

4. Abra [`src/app/logic.ts`](src/app/logic.ts) e comece a programar sua cobra 🐍

---

## ⭐ Onde implementar sua snake

**Você só precisa editar `src/app/logic.ts`.** Os outros arquivos existem para
levar o estado do jogo até as suas quatro funções.

### O que você deve alterar:
- `src/app/logic.ts` — **este é o seu arquivo principal**

### O que você normalmente NÃO precisa alterar:
- `src/app/index.ts` — rotas Express + handler da Lambda
- `src/app/models.ts` — interfaces TypeScript do estado do jogo
- Infraestrutura (IAC)
- GitHub Actions

---

## 📂 Estrutura do projeto

```
.
├── package.json                # dependências e scripts
├── src/app/
│   ├── logic.ts                # 👈 É AQUI QUE VOCÊ PROGRAMA
│   ├── models.ts               # interfaces TypeScript do estado do jogo
│   └── index.ts                # rotas Express + handler da Lambda — não precisa mexer
├── tests/
│   └── logic.test.ts           # testes da sua lógica
├── iac/                        # infraestrutura (não precisa mexer)
└── .github/workflows/          # testes + deploy automático
```

---

## 🧠 As quatro funções

Todas ficam em `src/app/logic.ts` e recebem o `GameState` — o JSON completo
que o servidor do Battlesnake manda a cada requisição:

| Função | Rota | Quando é chamada | O que devolve |
|---|---|---|---|
| `info()` | `GET /` | ao cadastrar a cobra e no início de cada partida | aparência (cor, cabeça, cauda) |
| `start(state)` | `POST /start` | uma vez, no começo da partida | nada |
| `move(state)` | `POST /move` | **a cada turno** | `{ move: "up" \| "down" \| "left" \| "right" }` |
| `end(state)` | `POST /end` | uma vez, no fim da partida | nada |

A cobra já vem com a lógica que **impede ela de andar para trás**. A partir daí,
os `TODO` em `move()` marcam os próximos passos:

1. não sair do tabuleiro
2. não bater no próprio corpo
3. não bater nas cobras adversárias
4. ir atrás da comida em vez de sortear a direção

Documentação oficial da API: <https://docs.battlesnake.com/api>

> ⏱️ Você tem cerca de **500 ms** por jogada. Se estourar, o servidor escolhe
> uma direção qualquer por você — normalmente para a morte.

---

## 🧪 Testando

```bash
npm test
```

O template já vem com testes que garantem que a sua cobra **sempre devolve uma
direção válida** e **nunca volta por cima do próprio pescoço**. Escreva mais
testes conforme for implementando os passos acima.

> 🚨 Os testes rodam no GitHub Actions **antes** do deploy. Se algum falhar, o
> deploy não acontece e a URL da sua cobra não é atualizada.

### Rodando localmente

```bash
npm start
```

Sobe a aplicação localmente. Em outro terminal:

```bash
curl http://localhost:3000/
curl -X POST http://localhost:3000/move \
  -H 'Content-Type: application/json' \
  -d '{"turn":1,"game":{"id":"1","ruleset":{},"timeout":500},"board":{"width":11,"height":11,"food":[],"hazards":[],"snakes":[]},"you":{"id":"s1","name":"eu","health":100,"body":[{"x":5,"y":4},{"x":4,"y":4},{"x":3,"y":4}],"head":{"x":5,"y":4},"length":3}}'
```

---

## ☁️ Deploy

O deploy é disparado por push na branch **`dev`**:

```bash
git add .
git commit -m "minha cobra agora desvia das paredes"
git push origin dev
```

O GitHub Actions vai:
1. Rodar os testes (`npm test`)
2. Compilar o TypeScript (`tsc`)
3. Empacotar e fazer deploy na AWS Lambda

No fim, o resumo da execução mostra a **URL da sua cobra**.

---

## 🎯 Cadastrando na Arena Mauá

1. Acesse [arena.devmaua.com](https://arena.devmaua.com)
2. Faça login com sua conta
3. No campo **URL**, cole a URL gerada pelo deploy
4. Salve e participe das partidas!

Se quiser testar antes, use o [Battlesnake](https://play.battlesnake.com) oficial.

---

## 📈 Progressão pedagógica

| Nível | Nome | O que implementar |
|---|---|---|
| 0 | **Random** | movimento aleatório (já vem pronto) |
| 1 | **Don't Die** | não voltar, não bater na parede, não bater em si mesmo |
| 2 | **Food** | procurar comida |
| 3 | **Space** | avaliar espaço disponível, evitar becos |
| 4 | **Opponents** | considerar outras cobras, head-to-head |
| 5 | **Advanced** | BFS, flood fill, A*, avaliação de território |

---

## 🛠 Ferramentas úteis

- [Battlesnake Docs](https://docs.battlesnake.com/) — documentação da API
- [Battlesnake CLI](https://github.com/BattlesnakeOfficial/rules) — jogar partidas locais
- [Express](https://expressjs.com/) — o framework das rotas
- [TypeScript](https://www.typescriptlang.org/docs/) — documentação do TypeScript

---

## 📞 Fale com a gente

Dúvidas? Chama no [Discord](https://discord.gg/Yr2VPgAmcb) da Dev. Community Mauá.
