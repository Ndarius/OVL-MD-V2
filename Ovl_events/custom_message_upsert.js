const originalMessageUpsert = require("./message_upsert").message_upsert;
const { handleViewOnceMessage } = require("./view_once_handler");
const config = require("../../config"); // Assurez-vous que le chemin est correct

async function customMessageUpsert(messages, ovl) {
    for (const msg of messages.messages) {
        const messageText = msg.message?.conversation || msg.message?.extendedTextMessage?.text || 
                            msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || 
                            msg.message?.buttonsResponseMessage?.selectedButtonId || 
                            msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId || 
                            msg.message?.templateButtonReplyMessage?.selectedId || 
                            msg.message?.stickerMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2 ? "" : ""; // Ajout pour les stickers et éviter l'erreur si non défini

        const prefix = config.PREFIXE || "!"; // Utiliser le préfixe du bot, ou '!' par défaut

        // Vérifier si le message est une commande "VV" et qu'il répond à un message "view once"
        if (messageText.startsWith(prefix + "VV") && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessageV2) {
            const quotedMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            // Recréer un objet message upsert simplifié pour handleViewOnceMessage
            const viewOnceMsg = {
                messages: [{
                    message: quotedMessage,
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId ? { remoteJid: msg.key.remoteJid, id: msg.message.extendedTextMessage.contextInfo.stanzaId } : msg.key
                }]
            };
            await handleViewOnceMessage(viewOnceMsg, ovl);
        }

        // Appeler le gestionnaire de messages original pour le traitement normal
        await originalMessageUpsert(messages, ovl);
    }
}

module.exports = { customMessageUpsert };
