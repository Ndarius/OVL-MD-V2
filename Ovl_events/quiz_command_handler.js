const quiz = require("../lib/quiz");

module.exports = {
    name: "quizcg_command_handler",
    description: "Gère la commande +quizcg pour le quiz de culture générale et les réponses directes.",
    async execute(message, client) {
        const prefix = "+";
        const body = message.body || message.message?.conversation || message.message?.extendedTextMessage?.text || "";
        const userId = message.key.participant || message.key.remoteJid;
        const userName = message.pushName || "Joueur";

        let response = null;

        // Check for quiz commands (+quizcg start/stop/scores)
        if (body.startsWith(prefix + "quizcg")) {
            const args = body.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();

            if (command === "quizcg") {
                const subCommand = args[0];
                switch (subCommand) {
                    case "start":
                        response = await quiz.startQuiz(client, message.key.remoteJid);
                        break;
                    case "stop":
                        response = quiz.stopQuiz();
                        break;
                    case "scores":
                        response = quiz.getScores();
                        break;
                    default:
                        response = "Utilisation: `+quizcg start` pour commencer, `+quizcg stop` pour arrêter, `+quizcg scores` pour voir les scores.";
                        break;
                }
            }
        } else if (quiz.quizActive() && quiz.currentQuestion()) {
            // If quiz is active and message is not a quiz command, treat it as an answer
            response = await quiz.checkAnswer(body, userId, userName);
        }

        if (response) {
            await client.sendMessage(message.key.remoteJid, { text: response }, { quoted: message });
        }
    },
};

