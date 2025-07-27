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
    const timerDisplay = document.getElementById('timer');
    const resultScreen = document.getElementById('result-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const retryButton = document.getElementById('retry-button');

    // === ゲームの状態管理変数 ===
    let currentScore = 0;
    let questions = [];
    let currentQuestion = null;
    let overallTimer;      // ゲーム全体のタイマー
    let overallTimeLeft = 30; // 全体の制限時間
    let gameEnded = false;
    let autoSkipTimer;     // 正解・不正解表示の自動スキップタイマー

    // === 画面表示のユーティリティ関数 ===
    function showScreen(screenToShow) {
        // 全ての画面を非表示にする
        titleScreen.style.display = 'none';
        countdownScreen.style.display = 'none';
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'none';

        // 指定された画面を表示する
        screenToShow.style.display = 'flex'; // flexを使って中央揃えを維持
    }

    // === 問題データの読み込み ===
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            questions = await response.json();
            if (questions.length === 0) {
                alert('問題がありません。questions.jsonを確認してください。');
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

    // === ゲーム全体のタイマー管理 ===
    function startOverallTimer() {
        clearInterval(overallTimer); // 既存のタイマーをクリア
        overallTimeLeft = 30; // 全体の制限時間30秒に設定
        gameEnded = false; // ゲーム終了フラグをリセット

        timerDisplay.textContent = `残り時間: ${overallTimeLeft}秒`;
        overallTimer = setInterval(() => {
            overallTimeLeft--;
            timerDisplay.textContent = `残り時間: ${overallTimeLeft}秒`;
            if (overallTimeLeft <= 0) {
                clearInterval(overallTimer);
                endGame(); // 時間切れでゲーム終了
            }
        }, 1000);
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
        updateScore(0); // 表示を0に更新
        startOverallTimer(); // 全体タイマーを開始
        displayNextQuestion(); // 最初の問題を表示
    }

    // === 次の問題を表示 ===
    function displayNextQuestion() {
        if (gameEnded || questions.length === 0) {
            // ゲームが終了しているか問題がない場合は処理しない
            return;
        }

        // 以前のスキップタイマーがあればクリア
        clearTimeout(autoSkipTimer);

        const randomIndex = Math.floor(Math.random() * questions.length);
        currentQuestion = questions[randomIndex];

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
        if (gameEnded) return; // ゲーム終了時は解答を受け付けない

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
            displayNextQuestion();
        }, 2000); // 2000ミリ秒 = 2秒
    }

    // === ゲーム終了処理 ===
    function endGame() {
        if (gameEnded) return; // 既に終了している場合は何もしない
        gameEnded = true;
        clearInterval(overallTimer); // 全体タイマーを停止
        clearTimeout(autoSkipTimer); // スキップタイマーも停止

        showScreen(resultScreen); // 結果画面を表示
        finalScoreDisplay.textContent = `最終スコア: ${currentScore} 点`;
    }

    // === リトライ処理 ===
    function retryGame() {
        currentScore = 0; // スコアをリセット
        gameEnded = false; // フラグをリセット
        updateScore(0); // 表示をリセット
        answerInput.disabled = false; // 入力欄を再度有効化
        answerInput.value = ''; // 入力欄をクリア

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
            // 問題の読み込みに失敗したら、タイトル画面も表示しない
            // 何らかのエラーメッセージを表示するなど
            titleScreen.textContent = "問題の読み込みに失敗しました。";
            titleScreen.style.display = 'flex';
        }
    }

    initializeQuiz(); // アプリ起動時に初期化処理を実行
});
