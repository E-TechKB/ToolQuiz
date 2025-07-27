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
    // const timerDisplay = document.getElementById('timer'); // 時間制限なしなので削除
    const resultScreen = document.getElementById('result-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const retryButton = document.getElementById('retry-button');

    // === ゲームの状態管理変数 ===
    let currentScore = 0;
    let allQuestions = []; // ロードした全ての問題を格納
    let currentQuestion = null;
    let askedQuestions = []; // 出題済みの問題を格納 (重複防止用)
    let questionCount = 0;   // 現在の出題数
    const TOTAL_QUESTIONS = 10; // 合計出題数
    let gameEnded = false;
    let autoSkipTimer;     // 正解・不正解表示の自動スキップタイマー

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
            // 必要な問題数が総問題数より多い場合のエラーハンドリング
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
                startGame(); // カウントダウン終了後、ゲーム開始
            }
        }, 1000);
    }

    // === ゲーム開始 ===
    function startGame() {
        showScreen(gameScreen);
        currentScore = 0; // スコアをリセット
        questionCount = 0; // 出題数をリセット
        askedQuestions = []; // 出題済み問題をリセット
        gameEnded = false;
        updateScore(0); // 表示を0に更新

        // timerDisplayは不要になったので非表示にするか削除する
        // timerDisplay.style.display = 'none'; 

        displayNextQuestion(); // 最初の問題を表示
    }

    // === 次の問題を表示 ===
    function displayNextQuestion() {
        if (gameEnded) return; // ゲームが終了していたら処理しない

        // 問題を10問解き終えたらゲーム終了
        if (questionCount >= TOTAL_QUESTIONS) {
            endGame();
            return;
        }

        // 以前のスキップタイマーがあればクリア
        clearTimeout(autoSkipTimer);

        let availableQuestions = allQuestions.filter(q => !askedQuestions.includes(q));
        if (availableQuestions.length === 0 && allQuestions.length >= TOTAL_QUESTIONS) {
            // 全ての問題が出題済みだが、まだTOTAL_QUESTIONSに達していない場合のフォールバック（通常は起こらないはず）
            // あるいは、問題数が少ない場合に循環させるならここで askedQuestions をリセットする
             askedQuestions = [];
             availableQuestions = allQuestions;
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        currentQuestion = availableQuestions[randomIndex];

        // 出題済みの問題リストに追加
        askedQuestions.push(currentQuestion);
        questionCount++; // 出題数をカウントアップ

        quizImage.src = currentQuestion.image_path;
        answerInput.value = '';
        resultDiv.textContent = '';
        resultDiv.className = '';
        submitButton.style.display = 'block';
        answerInput.disabled = false; // 入力欄を有効化
        answerInput.focus();
    }

    // === 解答処理 ===
    function submitAnswer() {
        if (gameEnded || !currentQuestion) return; // ゲーム終了時や問題がない場合は解答を受け付けない

        clearInterval(autoSkipTimer); // 新しい解答が来たのでスキップタイマーをリセット

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

        submitButton.style.display = 'none'; // 解答後、解答ボタンを非表示に
        answerInput.disabled = true; // 解答後、入力欄を無効化

        // 2秒後に次の問題へ自動スキップ
        autoSkipTimer = setTimeout(() => {
            displayNextQuestion(); // 次の問題へ進む
        }, 2000); // 2000ミリ秒 = 2秒
    }

    // === ゲーム終了処理 ===
    function endGame() {
        if (gameEnded) return; // 既に終了している場合は何もしない
        gameEnded = true;
        clearTimeout(autoSkipTimer); // スキップタイマーも停止

        showScreen(resultScreen); // 結果画面を表示
        finalScoreDisplay.textContent = `最終スコア: ${currentScore} 点`;
    }

    // === リトライ処理 ===
    function retryGame() {
        // 変数を初期化
        currentScore = 0;
        questionCount = 0;
        askedQuestions = [];
        gameEnded = false;

        updateScore(0); // 表示をリセット
        answerInput.disabled = false; // 入力欄を再度有効化
        answerInput.value = ''; // 入力欄をクリア
        resultDiv.textContent = ''; // 結果表示をクリア

        startIntroCountdown(); // 初めの3秒カウントダウンから再開
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
            showScreen(titleScreen); // 最初にタイトル画面を表示
        } else {
            titleScreen.textContent = "問題の読み込みに失敗しました。問題ファイルを確認してください。";
            titleScreen.style.display = 'flex';
        }
    }

    initializeQuiz(); // アプリ起動時に初期化処理を実行
});
