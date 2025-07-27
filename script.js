document.addEventListener('DOMContentLoaded', () => {
    const quizImage = document.getElementById('quiz-image');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const resultDiv = document.getElementById('result');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const nextButton = document.getElementById('next-button');

    let currentScore = 0;
    let questions = []; // 全ての問題を格納する配列
    let currentQuestion = null; // 現在表示中の問題オブジェクト
    let timer;
    let timeLeft = 30;

    /**
     * 問題データを読み込む関数
     */
    async function loadQuestions() {
        try {
            // questions.jsonをフェッチして読み込む
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

    /**
     * スコアを更新する関数
     * @param {number} change - スコアの増減値
     */
    function updateScore(change) {
        currentScore += change;
        scoreDisplay.textContent = `スコア: ${currentScore}`;
    }

    /**
     * タイマーを開始する関数
     */
    function startTimer() {
        clearInterval(timer); // 既存のタイマーをクリア
        timeLeft = 30;
        timerDisplay.textContent = `残り時間: ${timeLeft}秒`;
        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `残り時間: ${timeLeft}秒`;
            if (timeLeft <= 0) {
                clearInterval(timer);
                submitAnswer(true); // 時間切れで自動的に解答を提出
            }
        }, 1000);
    }

    /**
     * 次の（ランダムな）問題を表示する関数
     */
    function displayNextQuestion() {
        if (questions.length === 0) {
            resultDiv.textContent = '問題がありません。';
            submitButton.style.display = 'none';
            nextButton.style.display = 'none';
            return;
        }

        // ランダムに問題を選択
        const randomIndex = Math.floor(Math.random() * questions.length);
        currentQuestion = questions[randomIndex];

        quizImage.src = currentQuestion.image_path;
        answerInput.value = '';
        resultDiv.textContent = '';
        resultDiv.className = ''; // クラスをリセット
        submitButton.style.display = 'block';
        nextButton.style.display = 'none';
        answerInput.focus();
        startTimer(); // 新しい問題がロードされたらタイマーを再開
    }

    /**
     * 解答を提出する関数
     * @param {boolean} isTimeUp - 時間切れによる提出かどうか
     */
    function submitAnswer(isTimeUp = false) {
        if (!currentQuestion) {
            return; // 問題がロードされていない場合は何もしない
        }

        clearInterval(timer); // 解答提出または時間切れでタイマーを停止
        const userAnswer = answerInput.value.trim(); // 前後の空白を削除
        const correctAnswer = currentQuestion.name;

        const isCorrect = (userAnswer.toLowerCase() === correctAnswer.toLowerCase());
        const scoreChange = isCorrect ? 10 : -5;

        if (isCorrect) {
            resultDiv.textContent = '正解！';
            resultDiv.className = 'correct';
        } else {
            let message = '不正解... ';
            if (isTimeUp) {
                message = '時間切れ！';
            }
            resultDiv.textContent = `${message}正解は「${correctAnswer}」でした。`;
            resultDiv.className = 'incorrect';
        }
        updateScore(scoreChange);

        submitButton.style.display = 'none';
        nextButton.style.display = 'block';
    }

    // イベントリスナーの設定
    submitButton.addEventListener('click', () => submitAnswer(false));
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && submitButton.style.display !== 'none') { // 解答ボタンが表示されている時のみEnterで解答
            submitAnswer(false);
        }
    });
    nextButton.addEventListener('click', displayNextQuestion);

    // アプリケーションの初期化
    async function initializeQuiz() {
        const questionsLoaded = await loadQuestions();
        if (questionsLoaded) {
            displayNextQuestion();
        }
    }

    initializeQuiz();
});