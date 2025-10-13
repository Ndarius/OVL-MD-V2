const quiz = require("../lib/quiz");

module.exports = {
    name: "quizcg_handler",
    description: "Gère les commandes du quiz de culture générale.",
    async execute(message, client) {
        const prefix = "+";
        const body = message.body || message.message?.conversation || message.message?.extendedTextMessage?.text || "";

        if (!body.startsWith(prefix + "quizcg")) {
            return;
        }

        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command !== "quizcg") {
            return;
        }

        const subCommand = args[0];
        const userId = message.key.participant || message.key.remoteJid;
        const userName = message.pushName || "Joueur";

        let response = "";

        switch (subCommand) {
            case "start":
                response = quiz.startQuiz();
                break;
            case "stop":
                response = quiz.stopQuiz();
                break;
            case "scores":
                response = quiz.getScores();
                break;
            default:
                // If no subcommand, assume it's an answer if a quiz is active
                if (quiz.quizActive() && quiz.currentQuestion()) {
                    const userAnswer = body.slice((prefix + "quizcg").length).trim();
                    response = quiz.checkAnswer(userAnswer, userId, userName);
                } else {
                    response = "Utilisation: `+quizcg start` pour commencer, `+quizcg stop` pour arrêter, `+quizcg scores` pour voir les scores, ou répondez directement à la question.";
                }
                break;
        }

        if (response) {
            await client.sendMessage(message.key.remoteJid, { text: response }, { quoted: message });
        }
    },
};

