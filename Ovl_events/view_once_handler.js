const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

async function handleViewOnceMessage(msg, ovl) {
    const message = msg.messages[0].message;
    const jid = msg.messages[0].key.remoteJid;

    let mediaType;
    let mediaMessage;

    if (message.viewOnceMessageV2?.message?.imageMessage) {
        mediaType = "image";
        mediaMessage = message.viewOnceMessageV2.message.imageMessage;
    } else if (message.viewOnceMessageV2?.message?.videoMessage) {
        mediaType = "video";
        mediaMessage = message.viewOnceMessageV2.message.videoMessage;
    } else {
        return; // Not a view once image or video message
    }

    try {
        const stream = await downloadContentFromMessage(mediaMessage, mediaType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const fileName = `./downloads/view_once_${Date.now()}.${mediaType === "image" ? "jpeg" : "mp4"}`;
        // Assurez-vous que le dossier downloads existe
        if (!fs.existsSync("./downloads")) {
            fs.mkdirSync("./downloads");
        }
        fs.writeFileSync(fileName, buffer);

        // Renvoyer le média
        if (mediaType === "image") {
            await ovl.sendMessage(jid, { image: { url: fileName }, caption: "Voici votre image en vue unique." });
        } else if (mediaType === "video") {
            await ovl.sendMessage(jid, { video: { url: fileName }, caption: "Voici votre vidéo en vue unique." });
        }

        // Supprimer le fichier après l'envoi (optionnel)
        fs.unlinkSync(fileName);

    } catch (error) {
        console.error("Erreur lors du traitement du message view once:", error);
    }
}

module.exports = { handleViewOnceMessage };
