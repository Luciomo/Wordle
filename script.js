// Banco de palavras (word bank) - adicione ou modifique conforme necessário
let WORD_BANK = [];

/**
 * Carrega a lista de palavras do arquivo JSON.
 */
async function loadWords() {
	try {
		const response = await fetch('words.json');
		const data = await response.json();
		// Normaliza palavras: remove acentos e substitui Ç por C
		WORD_BANK = data.map(word => 
			word.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")
		);
	} catch (error) {
		console.error('Erro ao carregar palavras:', error);
		// Fallback caso o fetch falhe
		WORD_BANK = ['TERMO', 'TESTE'];
	}
}

/**
 * Retorna uma palavra aleatória a partir do `WORD_BANK` usando Math.random() e Math.floor().
 * @returns {string} palavra selecionada
 */
function pickRandomWord() {
	const len = WORD_BANK.length;
	const idx = Math.floor(Math.random() * len);
	return WORD_BANK[idx];
}

/**
 * Inicializa o jogo: escolhe a palavra secreta e armazena em `window.SECRET_WORD`.
 */
function initGame() {
	const secret = pickRandomWord();
	if (typeof window !== 'undefined') {
		window.SECRET_WORD = secret.toUpperCase();
		// debugging non-invasive marker (do not show actual word)
		document.documentElement.setAttribute('data-secret-word', '***');
		console.debug('SECRET_WORD (debug):', secret);
	}
	return secret;
}

function integrateBoardLogic() {
	if (typeof document === 'undefined') return;

	if (!window.SECRET_WORD) initGame();
	let SECRET = (window.SECRET_WORD || '').toUpperCase();

    // Estado do jogo e Timer
    let gameState = { currentRow: 0, currentCol: 0 };
    let timerInterval;
    let remainingTime = 180; // 3 minutos
    let totalScore = parseInt(localStorage.getItem('wordleScore') || '0', 10);
    let currentRoundScore = 0;

    function startTimer() {
        const timerElement = document.getElementById('timer-container');
        if (timerInterval) clearInterval(timerInterval);
        
        const updateDisplay = () => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
        };
        updateDisplay();

        timerInterval = setInterval(() => {
            remainingTime--;
            updateDisplay();
            
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                showMessage(`Game Over! O tempo acabou. A palavra era: ${SECRET}`, 'error');
                const keyButtons = Array.from(document.querySelectorAll('.keyboard .letter, .keyboard .action'));
                keyButtons.forEach(btn => {
                    if (!btn.classList.contains('reset-btn')) btn.disabled = true;
                });
                document.removeEventListener('keydown', handleKeydown);
            }
        }, 1000);
    }

    function resetGame() {
        gameState.currentRow = 0;
        gameState.currentCol = 0;
        currentRoundScore = 0;
        
        const boardCells = Array.from(document.querySelectorAll('.board-game .letter'));
        const keyButtons = Array.from(document.querySelectorAll('.keyboard .letter, .keyboard .action'));

        SECRET = initGame();
        
        // Limpar tabuleiro e teclado
        boardCells.forEach(cell => {
            cell.textContent = '';
            cell.removeAttribute('data-letter');
            cell.classList.remove('correct', 'present', 'absent');
            cell.classList.add('reset-animation');
            setTimeout(() => cell.classList.remove('reset-animation'), 500);
        });
        keyButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'present', 'absent');
        });
        const msg = document.querySelector('.message-toast');
        if (msg) msg.remove();
        
        const resetBtn = document.querySelector('.reset-btn');
        if (resetBtn) resetBtn.disabled = false;
        
        remainingTime = 180;
        startTimer();
        
        document.removeEventListener('keydown', handleKeydown);
        document.addEventListener('keydown', handleKeydown);
        console.debug('[Game Reset] Novo jogo iniciado');
    }

    startTimer();

	const MAX_ROWS = 6;
	const MAX_COLS = 5;

	const boardCells = Array.from(document.querySelectorAll('.board-game .letter'));
	const keyButtons = Array.from(document.querySelectorAll('.keyboard .letter, .keyboard .action'));

    // Container para os botões
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    // Display de Pontuação
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'score-display';
    scoreDisplay.textContent = `Pts: ${totalScore}`;
    scoreDisplay.style.cssText = 'font-weight: bold; font-size: 1.1rem; margin-right: 10px;';
    controlsContainer.appendChild(scoreDisplay);

	// Criação do botão Resetar
	const resetBtn = document.createElement('button');
	resetBtn.textContent = 'Jogar novamente';
	resetBtn.classList.add('reset-btn');
    controlsContainer.appendChild(resetBtn);

	// Criação do botão de Tema (Dark/White)
	const themeBtn = document.createElement('button');
	themeBtn.textContent = '🌓';
	themeBtn.classList.add('theme-toggle-btn');
	themeBtn.title = 'Alternar Tema';
	document.body.appendChild(themeBtn);

	themeBtn.addEventListener('click', () => {
		document.body.classList.toggle('light-mode');
	});

    // Criação do botão de Ajuda (Inline)
    const helpBtn = document.createElement('button');
    helpBtn.textContent = '?';
    helpBtn.className = 'help-btn-inline';
    helpBtn.title = 'Como jogar?';
    controlsContainer.appendChild(helpBtn);

    // Lógica do Modal
    const modal = document.getElementById('help-modal');
    const closeBtn = document.querySelector('.close-modal');

    if (modal && closeBtn) {
        helpBtn.addEventListener('click', () => {
            modal.classList.add('open');
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('open');
            }
        });
    }

    const winModal = document.getElementById('win-modal');
    const winModalResetBtn = document.getElementById('win-modal-reset-btn');

    winModalResetBtn.addEventListener('click', () => {
        winModal.classList.remove('open');
        resetGame();
    });

	const keyboardContainer = document.querySelector('.keyboard');
	if (keyboardContainer && keyboardContainer.parentNode) {
		keyboardContainer.parentNode.insertBefore(controlsContainer, keyboardContainer.nextSibling);
	}

	resetBtn.addEventListener('click', () => {
		if (!confirm('Tem certeza que deseja reiniciar o jogo?')) return;
        resetGame();
	});

	function cellIndex(row, col) {
		return row * MAX_COLS + col;
	}

	function setCell(row, col, ch) {
		const el = boardCells[cellIndex(row, col)];
		if (!el) return;
		el.textContent = ch;
		el.setAttribute('data-letter', ch);
	}

	function clearCell(row, col) {
		const el = boardCells[cellIndex(row, col)];
		if (!el) return;
		el.textContent = '';
		el.removeAttribute('data-letter');
		el.classList.remove('correct', 'present', 'absent');
	}

	function getRowElements(row) {
		const els = [];
		for (let c = 0; c < MAX_COLS; c++) {
			const el = boardCells[cellIndex(row, c)];
			if (el) els.push(el);
		}
		return els;
	}

	function findKeyButton(letter) {
		const cls = `.keyboard .letter-${letter}`;
		const byClass = document.querySelector(cls);
		if (byClass) return byClass;
		return keyButtons.find(b => b.textContent.trim().toUpperCase() === letter) || null;
	}

	function handleLetterInput(letter) {
		if (gameState.currentRow >= MAX_ROWS) return;
		if (gameState.currentCol >= MAX_COLS) {
			// Atingiu o limite de 5 letras
			console.debug(`[Input Blocked] Limite de 5 letras atingido`);
			return;
		}
		setCell(gameState.currentRow, gameState.currentCol, letter);
		gameState.currentCol++;
		console.debug(`[Input] Letter: ${letter}, Row: ${gameState.currentRow}, Col: ${gameState.currentCol}`);
	}

	function handleBackspace() {
		if (gameState.currentCol > 0) {
			gameState.currentCol--;
			clearCell(gameState.currentRow, gameState.currentCol);
			console.debug(`[Backspace] Row: ${gameState.currentRow}, Col: ${gameState.currentCol}`);
		}
	}

	function isValidWord(word) {
		return WORD_BANK.includes(word.toUpperCase());
	}

	function shakeRow(row) {
		const els = getRowElements(row);
		els.forEach(el => el.classList.add('invalid'));
		// remove after animation
		setTimeout(() => {
			els.forEach(el => el.classList.remove('invalid'));
		}, 650);
	}

	function clearRow(row) {
		for (let c = 0; c < MAX_COLS; c++) {
			clearCell(row, c);
		}
	}

	function showMessage(text, type = 'error') {
		// remove existing
		const existing = document.querySelector('.message-toast');
		if (existing) existing.remove();

		const msg = document.createElement('div');
		msg.className = 'message-toast';
		if (type === 'error') msg.classList.add('error');
		msg.textContent = text;

		const board = document.querySelector('.board-game');
		if (board && board.parentNode) {
			board.parentNode.insertBefore(msg, board);
		} else {
			// fallback: put at top of body
			document.body.insertBefore(msg, document.body.firstChild);
		}

		setTimeout(() => { msg.remove(); }, 5000);
	}

	function handleEnter() {
		if (gameState.currentCol !== MAX_COLS) {
			// linha incompleta — mostrar mensagem acima do tabuleiro
			showMessage('Preencha todas as letras', 'error');
			console.debug(`[Enter Incomplete] Row: ${gameState.currentRow}, Col: ${gameState.currentCol}`);
			return;
		}
		// monta a palavra
		let guess = '';
		for (let c = 0; c < MAX_COLS; c++) {
			const el = boardCells[cellIndex(gameState.currentRow, c)];
			guess += (el.getAttribute('data-letter') || '').toUpperCase();
		}
		if (guess.length !== MAX_COLS) return;

		console.debug(`[Enter Valid] Row: ${gameState.currentRow}, Guess: ${guess}`);

        let attemptScore = 0;

		// checa e marca cada letra
		for (let i = 0; i < MAX_COLS; i++) {
			const ch = guess[i];
			const cell = boardCells[cellIndex(gameState.currentRow, i)];
			if (!cell) continue;
			if (SECRET[i] === ch) {
                attemptScore += 5;
				cell.classList.add('correct');
				const kb = findKeyButton(ch);
				if (kb) { kb.classList.remove('present', 'absent'); kb.classList.add('correct'); }
			} else if (SECRET.includes(ch)) {
                attemptScore += 3;
				cell.classList.add('present');
				const kb = findKeyButton(ch);
				if (kb && !kb.classList.contains('correct')) { kb.classList.remove('absent'); kb.classList.add('present'); }
			} else {
				cell.classList.add('absent');
				const kb = findKeyButton(ch);
				if (kb && !kb.classList.contains('correct') && !kb.classList.contains('present')) { kb.classList.add('absent'); }
			}
		}
        
        currentRoundScore += attemptScore;

		// Verifica se jogador acertou
		if (guess === SECRET) {
			if (typeof confetti === 'function') {
				confetti({
					particleCount: 150,
					spread: 70,
					origin: { y: 0.6 }
				});
			}
            
            currentRoundScore += 25;
            totalScore += currentRoundScore;
            localStorage.setItem('wordleScore', totalScore);
            scoreDisplay.textContent = `Pts: ${totalScore}`;
            
			showMessage(`🎉 Parabéns! +${currentRoundScore} pts!`, 'success');
            clearInterval(timerInterval);
            const winModal = document.getElementById('win-modal');
            winModal.classList.add('open');
			console.debug(`[Game Won] Acertou em ${gameState.currentRow + 1} tentativa(s)`);
			// Desabilitar input após vitória
			keyButtons.forEach(btn => {
                if (!btn.classList.contains('reset-btn')) btn.disabled = true;
            });
			document.removeEventListener('keydown', handleKeydown);
			return;
		}

		// avança para próxima linha
		gameState.currentRow++;
		gameState.currentCol = 0;
		console.debug(`[Next Row] Now at Row: ${gameState.currentRow}, Col: 0`);

		// Verifica se atingiu o limite de 6 palpites
		if (gameState.currentRow >= MAX_ROWS) {
			showMessage(`Game Over! A palavra era: ${SECRET}`, 'error');
            clearInterval(timerInterval);
			console.debug(`[Game Over] Palpites esgotados. Palavra: ${SECRET}`);
			// Desabilitar input após game over
			keyButtons.forEach(btn => {
                if (!btn.classList.contains('reset-btn')) btn.disabled = true;
            });
			document.removeEventListener('keydown', handleKeydown);
		}
	}

	// conecta eventos dos botões do teclado
	keyButtons.forEach(btn => {
		btn.addEventListener('click', (ev) => {
			const target = ev.currentTarget;
			if (target.classList.contains('erase')) {
				handleBackspace();
				return;
			}
			const text = target.textContent.trim().toUpperCase();
			if (text === 'ENTER') {
				handleEnter();
				return;
			}
			if (text.length === 1 && /[A-Z]/.test(text)) {
				handleLetterInput(text);
			}
		});
	});

	// conecta teclado físico
	function handleKeydown(e) {
		let key = e.key.toUpperCase();
		// Normaliza entrada (ex: Ç -> C, Á -> A)
		key = key.normalize('NFD').replace(/[\u0300-\u036f]/g, "");

		if (key === 'BACKSPACE') {
			e.preventDefault();
			handleBackspace();
			return;
		}
		if (key === 'ENTER') {
			e.preventDefault();
			handleEnter();
			return;
		}
		if (/^[A-Z]$/.test(key)) {
			e.preventDefault();
			handleLetterInput(key);
		}
	}

	document.addEventListener('keydown', handleKeydown);

	// Expor funções para debug
	window._wordle = { SECRET, pickRandomWord, initGame, setCell, clearCell };

    document.addEventListener('keydown', handleKeydown);
}

// Inicializa automaticamente quando o DOM estiver pronto
if (typeof document !== 'undefined') {
	document.addEventListener('DOMContentLoaded', async () => {
		await loadWords();
		initGame();
		integrateBoardLogic();
	});
}

// Exports para testes
if (typeof module !== 'undefined' && module.exports) {
	module.exports = { pickRandomWord, WORD_BANK, initGame, integrateBoardLogic };
}
