# Wordle — Projeto de Exemplo (Alura)

[![Netlify Status](https://api.netlify.com/api/v1/badges/43b02bbe-c7e8-4f07-86f5-7b200ebb6100/deploy-status)](https://app.netlify.com/sites/guesswordle/deploys)

Pequima implementação do jogo Wordle em português, criada como exercício do curso. O jogo é cliente-side (HTML/CSS/JS) e fornece uma experiência semelhante ao Wordle: o jogador tem 6 tentativas para adivinhar uma palavra secreta de 5 letras.

**Publicação**

O jogo está publicado no Netlify e pode ser acessado em: [https://guesswordle.netlify.app/](https://guesswordle.netlify.app/)

**Tecnologias**

- HTML5 (interface)
- CSS3 (estilos e animações)
- JavaScript (lógica do jogo)
- Jest (testes unitários para a função de seleção aleatória)

**Como o jogo funciona**

- O tabuleiro possui 6 linhas × 5 colunas (6 tentativas de 5 letras).
- A cada tentativa o jogador preenche 5 letras e pressiona `ENTER`.
- Após `ENTER`, cada célula é marcada como:
  - Verde (`correct`): letra na posição correta.
  - Amarelo (`present`): letra existe na palavra secreta, mas posição diferente.
  - Cinza (`absent`): letra não existe na palavra secreta.
- O jogador vence ao acertar a palavra secreta ou perde após 6 tentativas.

**Arquivos principais**

- `index.html` — marcação do tabuleiro e teclado.
- `style.css` — estilos e animações (shake, cores, responsividade).
- `script.js` — lógica do jogo:
  - `WORD_BANK` — lista de palavras (padrão: palavras de até 5 letras).
  - `pickRandomWord()` — seleciona uma palavra aleatória do banco (testada com Jest).
  - `initGame()` — inicializa `window.SECRET_WORD` com a palavra secreta.
  - `integrateBoardLogic()` — gerencia `currentRow`, `currentCol`, entrada do teclado, validações e interface.

Observação: a palavra secreta é mantida em `window.SECRET_WORD` para fins de desenvolvimento/debug.

**Executando localmente**

1. Abra a pasta do projeto no seu editor (VS Code, etc.).
2. Abra `index.html` no navegador (ou use Live Server for local reload).

Opcional: caso o projeto use dependências de desenvolvimento para testes, instale-as e rode os testes:

```bash
npm install
npm test
```

**Testes**

- Existe um teste para `pickRandomWord()` em `__tests__/pickRandomWord.test.js` que usa mocks de `Math.random()`.

**Personalização**

- Para trocar o banco de palavras, edite `WORD_BANK` em `script.js`.
- O tamanho do tabuleiro e comportamento podem ser ajustados nas constantes `MAX_ROWS` e `MAX_COLS` em `script.js`.

**Contribuição**

Pull requests são bem-vindos. Para melhorias possíveis: adicionar dicionário completo, persistência do placar, animações adicionais e acessibilidade.

---

Se quiser, eu também posso adicionar um arquivo `.gitignore`, um `package.json` com scripts úteis, ou um pequeno `CONTRIBUTING.md`.