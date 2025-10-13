const fs = require("fs");
const path = require("path");

const QUIZ_FILE = path.join(__dirname, "../quiz_questions.json");
const SCORES_FILE = path.join(__dirname, "../DataBase/quiz_scores.json");

let quizQuestions = [];
let currentQuestion = null;
let quizActive = false;
let playersScores = {};
let answeredUsers = new Set();
let questionStartTime = null;
let quizTimer = null;
let quizClient = null; // To store the client for sending messages
let quizChatId = null; // To store the chat ID for sending messages

// Load quiz questions from JSON file
function loadQuizQuestions() {
    try {
        const data = fs.readFileSync(QUIZ_FILE, "utf8");
        quizQuestions = JSON.parse(data);
        console.log(`Loaded ${quizQuestions.length} quiz questions.`);
    } catch (error) {
        console.error("Error loading quiz questions:", error);
        quizQuestions = [];
    }
}

// Load player scores from JSON file
function loadScores() {
    try {
        if (fs.existsSync(SCORES_FILE)) {
            const data = fs.readFileSync(SCORES_FILE, "utf8");
            playersScores = JSON.parse(data);
            console.log("Loaded quiz scores.");
        }
    } catch (error) {
        console.error("Error loading quiz scores:", error);
        playersScores = {};
    }
}

// Save player scores to JSON file
function saveScores() {
    try {
        fs.writeFileSync(SCORES_FILE, JSON.stringify(playersScores, null, 2), "utf8");
        console.log("Saved quiz scores.");
    } catch (error) {
        console.error("Error saving quiz scores:", error);
    }
}

// Function to send a message to the quiz chat
async function sendQuizMessage(messageText) {
    if (quizClient && quizChatId) {
        await quizClient.sendMessage(quizChatId, { text: messageText });
    }
}

// Start a new quiz round
async function startQuiz(client, chatId) {
    if (quizQuestions.length === 0) {
        loadQuizQuestions();
        if (quizQuestions.length === 0) {
            return "Désolé, aucune question de quiz n'a pu être chargée.";
        }
    }
    loadScores();
    quizActive = true;
    answeredUsers.clear();
    questionStartTime = Date.now();
    quizClient = client;
    quizChatId = chatId;

    if (quizTimer) {
        clearTimeout(quizTimer);
    }

    const randomIndex = Math.floor(Math.random() * quizQuestions.length);
    currentQuestion = quizQuestions[randomIndex];

    const questionMessage = `Question du quiz : ${currentQuestion.question}\nVous avez 15 secondes pour répondre.`;
    await sendQuizMessage(questionMessage);

    quizTimer = setTimeout(async () => {
        if (quizActive && currentQuestion) {
            await sendQuizMessage(`Le temps est écoulé ! La bonne réponse était : ${currentQuestion.answer}`);
            await startQuiz(quizClient, quizChatId); // Move to next question
        }
    }, 15000); // 15 seconds timer

    return questionMessage; // This return is for the initial call, subsequent questions are sent via sendQuizMessage
}

// Stop the current quiz round
function stopQuiz() {
    quizActive = false;
    currentQuestion = null;
    answeredUsers.clear();
    questionStartTime = null;
    if (quizTimer) {
        clearTimeout(quizTimer);
        quizTimer = null;
    }
    quizClient = null;
    quizChatId = null;
    return "Le quiz est terminé.";
}

// Check an answer
async function checkAnswer(userAnswer, userId, userName) {
    if (!quizActive || !currentQuestion) {
        return null; // Return null if no quiz is active, so the handler can ignore it
    }

    if (answeredUsers.has(userId)) {
        return null; // User already answered this question, ignore
    }

    const correctAnswer = currentQuestion.answer;
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    const normalizedCorrectAnswer = correctAnswer.toLowerCase().trim();

    let isCorrect = false;

    // Case-insensitive check
    if (normalizedUserAnswer === normalizedCorrectAnswer) {
        isCorrect = true;
    }

    // Patronym check (if answer contains multiple words, check if patronym matches)
    if (!isCorrect && correctAnswer.includes(" ")) {
        const correctWords = normalizedCorrectAnswer.split(" ");
        const userWords = normalizedUserAnswer.split(" ");
        // Check if user answer contains the last word of the correct answer
        if (correctWords.length > 1 && userWords.includes(correctWords[correctWords.length - 1])) {
            isCorrect = true;
        }
        // Also check if the user provided the full name and it matches
        if (normalizedUserAnswer === normalizedCorrectAnswer) {
            isCorrect = true;
        }
    }

    if (isCorrect) {
        answeredUsers.add(userId);
        let points = 10; // Base points
        let bonusMessage = "";

        // Bonus for first correct answer
        if (answeredUsers.size === 1) {
            points += 10; // Bonus points
            bonusMessage = ` (Premier à répondre ! +10 points bonus)`;
        }

        if (!playersScores[userId]) {
            playersScores[userId] = { name: userName, score: 0 };
        }
        playersScores[userId].score += points;
        saveScores();

        const timeTaken = ((Date.now() - questionStartTime) / 1000).toFixed(2);

        // Clear the timer for the current question
        if (quizTimer) {
            clearTimeout(quizTimer);
            quizTimer = null;
        }

        await sendQuizMessage(`Félicitations ${userName} ! C'est la bonne réponse : **${currentQuestion.answer}** ! (+${points} points)${bonusMessage}. Temps : ${timeTaken}s. Votre score total : ${playersScores[userId].score}.`);
        await sendQuizMessage(getScores()); // Display updated scores
        await startQuiz(quizClient, quizChatId); // Move to the next question

        return null; // Handled internally
    } else {
        return null; // Not correct, let other users try
    }
}

// Get current scores
function getScores() {
    if (Object.keys(playersScores).length === 0) {
        return "Aucun score enregistré pour le moment.";
    }

    const sortedScores = Object.values(playersScores).sort((a, b) => b.score - a.score);
    let scoreBoard = "Tableau des scores :\n";
    sortedScores.forEach((player, index) => {
        scoreBoard += `${index + 1}. ${player.name}: ${player.score} points\n`;
    });
    return scoreBoard;
}

// Initialize on module load
loadQuizQuestions();
loadScores();

module.exports = {
    startQuiz,
    stopQuiz,
    checkAnswer,
    getScores,
    quizActive: () => quizActive,
    currentQuestion: () => currentQuestion ? currentQuestion.question : null
};

