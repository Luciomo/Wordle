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
    if (len === 0) return "TERMO"; // Evita erro se o banco estiver vazio
	const idx = Math.floor(Math.random() * len);
	return WORD_BANK[idx];
}

/**
 * Inicializa o jogo: escolhe a palavra secreta e armazena em `window.SECRET_WORD`.
 */
function initGame() {
	const secret = pickRandomWord();
    if (!secret) return "TERMO"; // Garante que sempre retorne uma string
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
    let isGameOver = false;

    function updateBackgroundColor() {
        const ratio = Math.max(0, remainingTime / 180);
        const isLight = document.body.classList.contains('light-mode');
        
        if (isLight) {
            // Light Mode: White (255) -> Light Red (255, 200, 200)
            const val = Math.floor(200 + (55 * ratio));
            document.body.style.backgroundColor = `rgb(255, ${val}, ${val})`;
        } else {
            // Dark Mode: Dark (20, 22, 28) -> Dark Red (60, 10, 10)
            const r = Math.floor(60 - (40 * ratio));
            const g = Math.floor(10 + (12 * ratio));
            const b = Math.floor(10 + (18 * ratio));
            document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        }
    }

    function startTimer() {
        const timerElement = document.getElementById('timer-container');
        if (timerInterval) clearInterval(timerInterval);
        if (timerElement) {
            timerElement.classList.remove('timer-warning', 'timer-fade-out');
            timerElement.style.display = ''; // Garante que o timer apareça ao iniciar/reiniciar
        }
        
        const updateDisplay = () => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
            }
            updateBackgroundColor();
        };
        updateDisplay();

        timerInterval = setInterval(() => {
            remainingTime--;
            updateDisplay();
            
            if (remainingTime <= 10 && timerElement) {
                timerElement.classList.add('timer-warning');
            } else if (timerElement) {
                timerElement.classList.remove('timer-warning');
            }

            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                isGameOver = true;
                
                if (timerElement) {
                    timerElement.classList.remove('timer-warning');
                    timerElement.classList.add('timer-fade-out');
                    // Aguarda a animação terminar antes de ocultar o elemento
                    setTimeout(() => {
                        if (timerElement.classList.contains('timer-fade-out')) timerElement.style.display = 'none';
                    }, 1000);
                }

                showMessage(`Game Over! O tempo acabou. A palavra era: ${SECRET}`, 'error');
                const resetBtnRef = document.querySelector('.reset-btn');
                if (resetBtnRef) resetBtnRef.disabled = false;
            }
        }, 1000);
    }

    function resetGame() {
        gameState.currentRow = 0;
        gameState.currentCol = 0;
        currentRoundScore = 0;
        isGameOver = false;
        
        const boardCells = Array.from(document.querySelectorAll('.board-game .letter'));
        const keyButtons = Array.from(document.querySelectorAll('.keyboard .letter, .keyboard .action'));
        
        const timerElement = document.getElementById('timer-container');
        if (timerElement) timerElement.classList.remove('timer-warning');
        document.body.style.backgroundColor = '';

        SECRET = initGame();
        
        // Limpar tabuleiro e teclado
        boardCells.forEach(cell => {
            cell.textContent = '';
            cell.removeAttribute('data-letter');
            cell.classList.remove('correct', 'present', 'absent', 'invalid');
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
        
        const winModal = document.getElementById('win-modal');
        if (winModal) winModal.classList.remove('open');
        
        remainingTime = 180;
        startTimer();
        
        document.removeEventListener('keydown', handleKeydown);
        document.addEventListener('keydown', handleKeydown);
        console.debug('[Game Reset] Novo jogo iniciado');
    }

	const MAX_ROWS = 6;
	const MAX_COLS = 5;

	const boardCells = Array.from(document.querySelectorAll('.board-game .letter'));
	const keyButtons = Array.from(document.querySelectorAll('.keyboard .letter, .keyboard .action'));

    // Container para os botões
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';

    // Remove timer duplicado do HTML original se existir (o que fica abaixo da logo)
    const existingTimer = document.getElementById('timer-container');
    if (existingTimer) existingTimer.remove();

    // Display de Timer
    const timerDisplay = document.createElement('div');
    timerDisplay.id = 'timer-container';
    timerDisplay.textContent = '03:00';
    
    const boardGame = document.querySelector('.board-game');
    if (boardGame && boardGame.parentNode) {
        boardGame.parentNode.insertBefore(timerDisplay, boardGame);
    } else {
        controlsContainer.appendChild(timerDisplay);
    }

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
        updateBackgroundColor();
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

    if (winModalResetBtn && winModal) {
        winModalResetBtn.addEventListener('click', () => {
            winModal.classList.remove('open');
            resetGame();
        });
    }
    
    if (winModal) {
        window.addEventListener('click', (event) => {
            if (event.target === winModal) {
                winModal.classList.remove('open');
            }
        });
    }

	const keyboardContainer = document.querySelector('.keyboard');
	if (keyboardContainer && keyboardContainer.parentNode) {
		keyboardContainer.parentNode.insertBefore(controlsContainer, keyboardContainer.nextSibling);
	}

    // Inicia o timer após inserir os elementos no DOM
    startTimer();

	resetBtn.addEventListener('click', () => {
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
        if (isGameOver) {
            showCustomAlert('O jogo acabou! Por favor, clique em "Jogar novamente".');
            return;
        }
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
        if (isGameOver) {
            showCustomAlert('O jogo acabou! Por favor, clique em "Jogar novamente".');
            return;
        }
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

    function showCustomAlert(message) {
        let modal = document.getElementById('custom-alert-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-alert-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <p id="custom-alert-message"></p>
                    <button id="custom-alert-ok-btn" class="reset-btn">OK</button>
                </div>
            `;
            document.body.appendChild(modal);

            const closeBtn = modal.querySelector('.close-modal');
            const okBtn = modal.querySelector('#custom-alert-ok-btn');
            
            const closeModal = () => modal.classList.remove('open');
            
            closeBtn.addEventListener('click', closeModal);
            okBtn.addEventListener('click', closeModal);
            window.addEventListener('click', (event) => {
                if (event.target === modal) closeModal();
            });
        }
        
        const msgElement = modal.querySelector('#custom-alert-message');
        if (msgElement) msgElement.textContent = message;
        modal.classList.add('open');
    }

	function handleEnter() {
        if (isGameOver) {
            showCustomAlert('O jogo acabou! Por favor, clique em "Jogar novamente".');
            return;
        }
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
            isGameOver = true;
            
            // Garante que o botão de reset esteja habilitado
            if (resetBtn) resetBtn.disabled = false;
            const currentResetBtn = document.querySelector('.reset-btn');
            if (currentResetBtn) currentResetBtn.disabled = false;

            // Prepara e abre o modal de vitória personalizado
            const winModal = document.getElementById('win-modal');
            if (winModal) {
                const content = winModal.querySelector('.modal-content');
                // Remove pontuação anterior se houver
                const oldScore = content.querySelector('.modal-score-container');
                if (oldScore) oldScore.remove();

                // Cria o container de pontuação
                const scoreContainer = document.createElement('div');
                scoreContainer.className = 'modal-score-container';
                scoreContainer.innerHTML = `
                    <div class="modal-score-label">Pontuação da Rodada</div>
                    <div class="modal-score-value">+${currentRoundScore}</div>
                    <div style="font-size: 0.9rem; margin-top: 5px; opacity: 0.7">Total Acumulado: ${totalScore}</div>
                `;

                // Insere antes do botão de resetar dentro do modal
                const modalResetBtn = document.getElementById('win-modal-reset-btn');
                if (modalResetBtn) {
                    content.insertBefore(scoreContainer, modalResetBtn);
                } else {
                    content.appendChild(scoreContainer);
                }
                
                winModal.classList.add('open');
            }
			console.debug(`[Game Won] Acertou em ${gameState.currentRow + 1} tentativa(s)`);
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
            isGameOver = true;
			console.debug(`[Game Over] Palpites esgotados. Palavra: ${SECRET}`);
			// Desabilitar input após game over
            const lossKeys = Array.from(document.querySelectorAll('.keyboard .letter, .keyboard .action'));
			lossKeys.forEach(btn => {
                if (!btn.classList.contains('reset-btn')) btn.disabled = true;
            });
            if (resetBtn) resetBtn.disabled = false;
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
