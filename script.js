        const API_URL = 'https://winnersapi-g031.onrender.com/api';
        
        const gameState = {
            username: '',
            attempts: 0,
            maxAttempts: 5,
            reactionStartTime: null,
            timeoutId: null,
            reactionTimes: [],
            gameActive: false,
            finalRating: 0
        };

        // Seletores de Elementos
        const scoreDisplay = document.getElementById('score');
        const square = document.getElementById('square');
        const resultsContainer = document.getElementById('results');
        const initialResultsContainer = document.getElementById('initialResults');
        const timerDisplay = document.getElementById('timer');
        const container = document.querySelector('.container');
        const startScreen = document.getElementById('startScreen');
        const gameScreen = document.getElementById('gameScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const usernameInput = document.getElementById('username');
        const startButton = document.getElementById('startButton');
        const restartButton = document.getElementById('restartButton');
        const finalUsername = document.getElementById('finalUsername');
        const finalScore = document.getElementById('finalScore');
        const ratingStarsContainer = document.getElementById('ratingStars');
        
        square.style.display = 'none';

        function switchScreen(hide, show) {
            hide.classList.add('hidden');
            setTimeout(() => {
                hide.style.display = 'none';
                show.style.display = 'flex';
                setTimeout(() => show.classList.remove('hidden'), 50);
            }, 500);
        }

        function startGame() {
            gameState.username = usernameInput.value.trim();
            if (!gameState.username) {
                alert('Por favor, insira seu nome para começar!');
                return;
            }

            switchScreen(startScreen, gameScreen);

            gameState.attempts = 0;
            gameState.reactionTimes = [];
            gameState.finalRating = 0;
            clearTimeout(gameState.timeoutId);
            container.onclick = null;

            scoreDisplay.textContent = 'Aguardando...';
            timerDisplay.textContent = `1 de ${gameState.maxAttempts}`;
            
            gameState.gameActive = true;
            startReactionRound();
            fetchResults();
        }

        function generateRandomPosition() {
            const squareSize = parseFloat(getComputedStyle(square).width);
            const x = Math.floor(Math.random() * (container.clientWidth - squareSize));
            const y = Math.floor(Math.random() * (container.clientHeight - squareSize));
            square.style.left = `${x}px`;
            square.style.top = `${y}px`;
        }

        function startReactionRound() {
            if (gameState.attempts >= gameState.maxAttempts) {
                endGame();
                return;
            }

            square.style.display = 'none';
            container.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            scoreDisplay.textContent = 'Aguarde o VERDE...';
            
            const randomDelay = Math.random() * 3000 + 1000;
            
            gameState.timeoutId = setTimeout(() => {
                if (!gameState.gameActive) return;
                
                generateRandomPosition();
                square.style.display = 'block';
                container.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
                gameState.reactionStartTime = performance.now();
                scoreDisplay.textContent = 'CLIQUE JÁ!';
                container.onclick = handleFalseStart;
            }, randomDelay);
        }

        function handleSquareClick(event) {
            event.stopPropagation();
            container.onclick = null;
            if (!gameState.reactionStartTime) return;

            const reactionTime = performance.now() - gameState.reactionStartTime;
            gameState.reactionTimes.push(reactionTime);
            gameState.attempts++;
            
            scoreDisplay.textContent = `${reactionTime.toFixed(2)} ms`;
            timerDisplay.textContent = gameState.attempts < gameState.maxAttempts ? 
                `${gameState.attempts + 1} de ${gameState.maxAttempts}` : 
                'Finalizando...';

            gameState.reactionStartTime = null;
            clearTimeout(gameState.timeoutId);
            
            setTimeout(startReactionRound, 700);
        }

        function handleFalseStart() {
            if (!gameState.gameActive) return;
            clearTimeout(gameState.timeoutId);
            gameState.gameActive = false;
            alert('CLIQUE ANTES DO TEMPO! O teste será reiniciado.');
            endGame(true);
        }

        async function saveResultAndRestart() {
            if (!gameState.username) return;

            const avgTime = gameState.reactionTimes.reduce((sum, time) => sum + time, 0) / gameState.reactionTimes.length;

            const gameResult = {
                gameName: 'Teste de Reação',
                playerName: gameState.username,
                score: parseFloat(avgTime.toFixed(2)),
                timePlayed: 0, // Não aplicável para este jogo
                rating: gameState.finalRating
            };

            if (gameState.finalRating > 0) {
                try {
                    const response = await fetch(`${API_URL}/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(gameResult)
                    });
                    if (response.ok) {
                        console.log("Resultado salvo com sucesso!");
                    } else {
                        console.error("Falha ao salvar o resultado.");
                    }
                } catch (error) {
                    console.error('Erro de conexão ao salvar resultado:', error);
                }
            } else {
                console.log("Nenhuma avaliação fornecida. O resultado não foi salvo.");
            }

            switchScreen(gameOverScreen, startScreen);
            usernameInput.value = '';
            fetchResults();
        }
        
        async function fetchResults() {
            initialResultsContainer.innerHTML = "<p>Carregando placar...</p>";
             try {
                const response = await fetch(`${API_URL}/leaderboard/Teste de Reação`);
                if (!response.ok) throw new Error('Falha na resposta do servidor');
                
                const results = await response.json();
                
                const htmlResults = results.map((result, index) => 
                    `<p><strong>${index + 1}. ${result.playerName}</strong>: ${result.score} ms</p>`
                ).join('');
                
                const finalHtml = htmlResults || "<p>Seja o primeiro a jogar!</p>";
                resultsContainer.innerHTML = finalHtml;
                initialResultsContainer.innerHTML = finalHtml;
            } catch (error) {
                console.error('Erro ao buscar placar:', error);
                const errorMsg = `<p style="color:red;font-size:10px;">Erro ao carregar placar.</p>`;
                resultsContainer.innerHTML = errorMsg;
                initialResultsContainer.innerHTML = errorMsg;
            }
        }

        function endGame(isFalseStart = false) {
            gameState.gameActive = false;
            clearTimeout(gameState.timeoutId);
            container.style.backgroundColor = 'transparent';
            square.style.display = 'none';

            if (isFalseStart) {
                switchScreen(gameScreen, startScreen);
                return;
            }

            const avg = gameState.reactionTimes.length > 0
                ? gameState.reactionTimes.reduce((sum, time) => sum + time, 0) / gameState.reactionTimes.length
                : 0;
            
            finalUsername.textContent = gameState.username.toUpperCase();
            finalScore.textContent = avg.toFixed(2);
            setupRatingStars();
            switchScreen(gameScreen, gameOverScreen);
        }

        // --- Lógica da Avaliação ---
        function setupRatingStars() {
            ratingStarsContainer.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const star = document.createElement('span');
                star.classList.add('star');
                star.textContent = '★';
                star.dataset.value = i;
                star.addEventListener('mouseover', () => handleStarHover(i));
                star.addEventListener('mouseout', resetStarHover);
                star.addEventListener('click', () => handleStarClick(i));
                ratingStarsContainer.appendChild(star);
            }
        }
        function handleStarHover(val) {
            document.querySelectorAll('.star').forEach(s => s.classList.toggle('hover', s.dataset.value <= val));
        }
        function resetStarHover() {
            document.querySelectorAll('.star').forEach(s => s.classList.remove('hover'));
        }
        function handleStarClick(val) {
            gameState.finalRating = val;
            console.log(`Avaliação: ${val} estrelas.`);
            document.querySelectorAll('.star').forEach(s => {
                s.classList.remove('hover');
                s.classList.toggle('selected', s.dataset.value <= val);
            });
        }
        
        // --- Event Listeners Iniciais ---
        square.addEventListener('click', handleSquareClick);
        container.addEventListener('click', (e) => {
            if (e.target === container && container.onclick) container.onclick(e);
        });
        startButton.addEventListener('click', startGame);
        restartButton.addEventListener('click', saveResultAndRestart);

        window.onload = fetchResults;
