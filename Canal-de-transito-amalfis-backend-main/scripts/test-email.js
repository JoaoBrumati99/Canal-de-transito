const dotenv = require("dotenv");
const { enviarEmailMailerSend } = require("../app/config/emailApi.js");

dotenv.config();

async function enviarEmailDeTeste() {
  const destinatario = process.env.EMAIL_TEST_TO || process.env.RECEBEEMAIL;
  if (!destinatario) {
    throw new Error("Configure EMAIL_TEST_TO ou RECEBEEMAIL no arquivo .env.");
  }

  const info = await enviarEmailMailerSend({
    to: destinatario,
    subject: "Teste de configuração MailerSend API - Amalfis Denúncias",
    text: "Este é um e-mail de teste da configuração da API MailerSend do Canal de Denúncias Amalfis.",
  });

  console.log(
    `MailerSend aceitou o e-mail de teste (HTTP ${info.status})${info.messageId ? `; ID: ${info.messageId}` : ""}`
  );
}

enviarEmailDeTeste().catch((erro) => {
  console.error("Falha no e-mail de teste:", erro.message);
  process.exitCode = 1;
});