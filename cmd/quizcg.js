const quiz = require("../../lib/quiz");

module.exports = {
    name: "quizcg",
    description: "Démarre un quiz de culture générale ou répond à une question.",
    category: "ovl-games",
    async execute(message, args) {
        const prefix = "+"; // Assuming the prefix is '+' as per user request
        const command = args[0];
        const userId = message.author.id;
        const userName = message.author.username;

        if (command === "start") {
            const response = quiz.startQuiz();
            message.reply(response);
        } else if (command === "stop") {
            const response = quiz.stopQuiz();
            message.reply(response);
        } else if (command === "scores") {
            const response = quiz.getScores();
            message.reply(response);
        } else if (quiz.quizActive() && quiz.currentQuestion()) {
            // If a quiz is active and it's not a quiz command, assume it's an answer
            const userAnswer = message.content.replace(`${prefix}quizcg `, "");
            const response = quiz.checkAnswer(userAnswer, userId, userName);
            message.reply(response);
        } else {
            message.reply("Utilisation: `+quizcg start` pour commencer, `+quizcg stop` pour arrêter, `+quizcg scores` pour voir les scores, ou répondez directement à la question.");
        }
    },
};

