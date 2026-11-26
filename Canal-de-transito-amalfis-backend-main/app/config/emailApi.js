const API_URL = "https://api.mailersend.com/v1/email";

function normalizarDestinatarios(destinatarios) {
  const lista = Array.isArray(destinatarios)
    ? destinatarios
    : String(destinatarios || "").split(",");

  return lista
    .map((destinatario) =>
      typeof destinatario === "string"
        ? { email: destinatario.trim() }
        : destinatario
    )
    .filter((destinatario) => destinatario.email);
}

async function enviarEmailMailerSend({ to, cc, subject, html, text, attachments }) {
  const token = process.env.MAILERSEND_API_TOKEN;
  const remetente = process.env.EMAIL_FROM;

  if (!token) {
    throw new Error("Configure MAILERSEND_API_TOKEN no arquivo .env.");
  }
  if (!remetente) {
    throw new Error("Configure EMAIL_FROM no arquivo .env.");
  }

  const destinatarios = normalizarDestinatarios(to);
  if (!destinatarios.length) {
    throw new Error("Configure RECEBEEMAIL no arquivo .env.");
  }

  const payload = {
    from: { email: remetente, name: "Amalfis Denúncias" },
    to: destinatarios,
    subject,
    html,
    text,
  };

  const copia = cc ? normalizarDestinatarios(cc) : [];
  if (copia.length) payload.cc = copia;
  if (attachments?.length) payload.attachments = attachments;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    let detail = responseText || response.statusText;
    try {
      const errorBody = JSON.parse(responseText);
      const validationErrors = Object.entries(errorBody.errors || {})
        .flatMap(([field, messages]) =>
          messages.map((message) => `${field}: ${message}`)
        )
        .join("; ");
      detail = validationErrors || errorBody.message || detail;
    } catch {
      // Keep the response text when the API does not return JSON.
    }
    throw new Error(`MailerSend API (${response.status}): ${detail}`);
  }

  return {
    status: response.status,
    messageId: response.headers.get("x-message-id"),
  };
}

module.exports = { enviarEmailMailerSend };