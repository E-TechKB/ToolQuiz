document.addEventListener('DOMContentLoaded', () => {
    // === HTML要素の取得 ===
    const titleScreen = document.getElementById('title-screen');
    const startButton = document.getElementById('start-button');
    const countdownScreen = document.getElementById('countdown-screen');
    const countdownDisplay = document.getElementById('countdown-display');
    const gameScreen = document.getElementById('game-screen');
    const quizImage = document.getElementById('quiz-image');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const resultDiv = document.getElementById('result');
    const scoreDisplay = document.getElementById('score');
    const questionNumberDisplay = document.getElementById('question-number'); // 追加
    const resultScreen = document.getElementById('result-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const retryButton = document.getElementById('retry-button');

    // === ゲームの状態管理変数 ===
    let currentScore = 0;
    let allQuestions = [];
    let currentQuestion = null;
    let askedQuestions = [];
    let questionCount = 0;
    const TOTAL_QUESTIONS = 10;
    let gameEnded = false;
    let autoSkipTimer;

    // === 画面表示のユーティリティ関数 ===
    function showScreen(screenToShow) {
        titleScreen.style.display = 'none';
        countdownScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'none';

        screenToShow.style.display = 'flex';
    }

    // === 問題データの読み込み ===
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allQuestions = await response.json();
            if (allQuestions.length === 0) {
                alert('問題がありません。questions.jsonを確認してください。');
                return false;
            }
            if (allQuestions.length < TOTAL_QUESTIONS) {
                alert(`問題数が不足しています。最低${TOTAL_QUESTIONS}問必要です。`);
                return false;
            }
            return true;
        } catch (error) {
            console.error('問題の読み込み中にエラーが発生しました:', error);
            alert('問題の読み込みに失敗しました。');
            return false;
        }
    }

    // === スコア更新 ===
    function updateScore(change) {
        currentScore += change;
        scoreDisplay.textContent = `スコア: ${currentScore}`;
    }

    // === ゲーム開始前のカウントダウン ===
    function startIntroCountdown() {
        showScreen(countdownScreen);
        let count = 3;
        countdownDisplay.textContent = count;

        const introTimer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownDisplay.textContent = count;
            } else {
                clearInterval(introTimer);
                startGame();
            }
        }, 1000);
    }

    // === ゲーム開始 ===
    function startGame() {
        showScreen(gameScreen);
        currentScore = 0;
        questionCount = 0;
        askedQuestions = [];
        gameEnded = false;
        updateScore(0);
        updateQuestionNumberDisplay(); // 初期表示を更新

        displayNextQuestion();
    }

    // === 何問目かを表示を更新する関数 ===
    function updateQuestionNumberDisplay() {
        questionNumberDisplay.textContent = `${questionCount} / ${TOTAL_QUESTIONS} 問`;
    }

    // === 次の問題を表示 ===
    function displayNextQuestion() {
        if (gameEnded) return;

        if (questionCount >= TOTAL_QUESTIONS) {
            endGame();
            return;
        }

        clearTimeout(autoSkipTimer);

        let availableQuestions = allQuestions.filter(q => !askedQuestions.includes(q));
        if (availableQuestions.length === 0) { // すべて出題済みの場合（問題数がTOTAL_QUESTIONSに満たない場合など）
            // 全問題が出題済みになったら、 askedQuestions をリセットして再度出題可能にする
            // または、問題数が足りない場合はゲームを終了するロジックに変更する
            if (allQuestions.length < TOTAL_QUESTIONS) {
                 // ここでゲーム終了など、適切なハンドリングを行う
                 endGame(); // 例: 問題数が足りない場合はここで終了
                 return;
            }
            // 循環させる場合はここを有効にする
            // askedQuestions = [];
            // availableQuestions = allQuestions;
        }
        
        // 問題数が足りなくなることを防ぐため、念のためチェック
        if (availableQuestions.length === 0) {
            console.error("出題可能な問題がありません！");
            endGame(); // 問題がないのでゲーム終了
            return;
        }


        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        currentQuestion = availableQuestions[randomIndex];

        askedQuestions.push(currentQuestion);
        questionCount++;
        updateQuestionNumberDisplay(); // 表示を更新

        quizImage.src = currentQuestion.image_path;
        answerInput.value = '';
        resultDiv.textContent = '';
        resultDiv.className = '';
        submitButton.style.display = 'block';
        answerInput.disabled = false;
        answerInput.focus();
    }

    // === 解答処理 ===
    function submitAnswer() {
        if (gameEnded || !currentQuestion) return;

        clearInterval(autoSkipTimer);

        const userAnswer = answerInput.value.trim();
        const correctAnswer = currentQuestion.name;

        const isCorrect = (userAnswer.toLowerCase() === correctAnswer.toLowerCase());
        const scoreChange = isCorrect ? 10 : -5;

        if (isCorrect) {
            resultDiv.textContent = '正解！';
            resultDiv.className = 'correct';
        } else {
            resultDiv.textContent = `不正解... 正解は「${correctAnswer}」でした。`;
            resultDiv.className = 'incorrect';
        }
        updateScore(scoreChange);

        submitButton.style.display = 'none';
        answerInput.disabled = true;

        autoSkipTimer = setTimeout(() => {
            displayNextQuestion();
        }, 2000);
    }

    // === ゲーム終了処理 ===
    function endGame() {
        if (gameEnded) return;
        gameEnded = true;
        clearTimeout(autoSkipTimer);

        showScreen(resultScreen);
        finalScoreDisplay.textContent = `最終スコア: ${currentScore} 点`;
    }

    // === リトライ処理 ===
    function retryGame() {
        currentScore = 0;
        questionCount = 0;
        askedQuestions = [];
        gameEnded = false;

        updateScore(0);
        answerInput.disabled = false;
        answerInput.value = '';
        resultDiv.textContent = '';
        questionNumberDisplay.textContent = ''; // リセット

        startIntroCountdown();
    }

    // === イベントリスナー ===
    startButton.addEventListener('click', startIntroCountdown);
    submitButton.addEventListener('click', submitAnswer);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && submitButton.style.display !== 'none' && !answerInput.disabled) {
            submitAnswer();
        }
    });
    retryButton.addEventListener('click', retryGame);

    // === アプリケーションの初期化 ===
    async function initializeQuiz() {
        const questionsLoaded = await loadQuestions();
        if (questionsLoaded) {
            showScreen(titleScreen);
        } else {
            titleScreen.textContent = "問題の読み込みに失敗しました。問題ファイルを確認してください。";
            titleScreen.style.display = 'flex';
        }
    }

    initializeQuiz();
});
