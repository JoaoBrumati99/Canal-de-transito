const path = require("path");
const { enviarEmailMailerSend } = require("../config/emailApi.js");

class DenunciaController {
  static async cadastrarDenuncia(req, res) {
    try {
      const body = req.body || {};
      if (body.consentimento !== "true" && body.consentimento !== true) {
        return res.status(400).json({
          message: "A autorização para tratamento dos dados é obrigatória.",
          error: true,
        });
      }

      const denuncia = parseDenuncia(body.denuncia);
      if (!denuncia || typeof denuncia.descricao !== "string" || !denuncia.descricao.trim()) {
        return res.status(400).json({
          message: "A descrição da ocorrência é obrigatória.",
          error: true,
        });
      }

      const anexos = prepararAnexos(req.files);
      await enviarEmail(denuncia, body.contato, anexos);
      return res.status(200).json({
        message: "Ocorrência encaminhada com sucesso.",
        error: false,
      });
    } catch (erro) {
      console.error("Falha ao encaminhar ocorrência por e-mail.", erro?.name || "Error");
      return res.status(500).json({
        message: "Não foi possível encaminhar a ocorrência. Tente novamente mais tarde.",
        error: true,
      });
    }
  }
}

function parseDenuncia(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") return { descricao: parsed };
  } catch {
    return { descricao: value };
  }

  return null;
}

function formatarValor(value) {
  return value == null || value === "" ? "Não informado" : String(value);
}

function escapeHtml(value) {
  return formatarValor(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function montarCamposEmail(denuncia, contato) {
  return [
    ["Protocolo", denuncia.protocolo],
    ["Categoria", denuncia.categoria],
    ["Veículo", denuncia.veiculo],
    ["Placa", denuncia.placa],
    ["Endereço", denuncia.local],
    ["Data aproximada", denuncia.data],
    ["Horário aproximado", denuncia.horario],
    ["Descrição", denuncia.descricao],
    ["Contato informado", contato],
  ];
}

function montarHtml(denuncia, contato) {
  const campos = montarCamposEmail(denuncia, contato)
    .map(([label, value]) => (
      `<p><strong style="color:#01407a;">${escapeHtml(label)}:</strong> ${escapeHtml(value).replace(/\n/g, "<br>")}</p>`
    ))
    .join("");

  return `
    <body style="margin:0 auto; font-family: Verdana, Geneva, Tahoma, sans-serif;">
      <header style="padding:20px; color:#F24E1E;">
        <h1>Canal de Trânsito Seguro | Amalfis</h1>
      </header>
      <div style="padding:10px;">
        <h2 style="color:#01407a;">Nova ocorrência de trânsito recebida</h2>
        ${campos}
        <p><strong style="color:#01407a;">Autorização:</strong> recebida no formulário.</p>
      </div>
    </body>`;
}

function montarTexto(denuncia, contato) {
  return [
    "Nova ocorrência de trânsito:",
    ...montarCamposEmail(denuncia, contato).map(([label, value]) => `${label}: ${formatarValor(value)}`),
    "Autorização: recebida no formulário.",
  ].join("\n\n");
}

function prepararAnexos(files) {
  if (!Array.isArray(files)) return [];
  return files.map((file) => {
    if (!Buffer.isBuffer(file.buffer) || typeof file.originalname !== "string") {
      throw new Error("Invalid uploaded attachment");
    }
    const filename = path.basename(file.originalname.replace(/\\/g, "/"))
      .replace(/[\r\n"]/g, "_")
      .slice(0, 255) || "anexo";
    return {
      filename,
      content: file.buffer.toString("base64"),
      disposition: "attachment",
    };
  });
}

async function enviarEmail(denuncia, contato, attachments) {
  const info = await enviarEmailMailerSend({
    to: process.env.RECEBEEMAIL,
    cc: attachments.length ? process.env.EMAIL_COPIA : undefined,
    subject: "Amalfis — Nova ocorrência de trânsito",
    html: montarHtml(denuncia, contato),
    text: montarTexto(denuncia, contato),
    attachments,
  });
  console.log(
    `MailerSend aceitou a ocorrência de trânsito (HTTP ${info.status})${info.messageId ? `; ID: ${info.messageId}` : ""}`
  );
}

module.exports = DenunciaController;
