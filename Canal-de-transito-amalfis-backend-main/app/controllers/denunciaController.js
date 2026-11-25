const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const { enviarEmailMailerSend } = require("../config/emailApi.js");
dotenv.config();

class DenunciaController {
  static async cadastrarDenuncia(req, res) {
    try {
      const { denuncia, contato } = req.body;
      const anexos = req.files;

      const listaAnexos = [];
      if (anexos) {
        anexos.forEach((anexo) => listaAnexos.push(anexo.filename));
      }

      if (!denuncia) {
        return res.status(400).json({
          message: "A descrição da ocorrência é obrigatória.",
          error: true,
        });
      }

      await enviarEmail(denuncia, contato, listaAnexos.length ? listaAnexos : null);
      return res
        .status(200)
        .json({ message: "Ocorrência de trânsito registrada com sucesso.", error: false });
    } catch (erro) {
      console.log(erro);
      return res
        .status(500)
        .json({ message: `${erro.message} - Falha ao registrar a ocorrência de trânsito`, error: true });
    }
  }
}

function montarHtml(denunciaEscrita, contato) {
  const blocoContato = contato
    ? `<p style="margin-top:12px;"><strong style="color:#01407a;">Contato informado:</strong> ${contato}</p>`
    : `<p style="margin-top:12px; color:#888;"><em>Nenhum contato informado.</em></p>`;

  return `
    <body style="margin:0 auto; font-family: Verdana, Geneva, Tahoma, sans-serif;">
      <header style="display:flex; justify-content:center; align-items:center; padding:20px; color:#F24E1E;">
        <h1>Canal de Trânsito Seguro | Amalfis</h1>
      </header>
      <div style="padding:10px;">
        <h2 style="display:flex; justify-content:center; align-items:center; color:#01407a;">
          Nova ocorrência de trânsito recebida:
        </h2>
        <p>${denunciaEscrita}</p>
        ${blocoContato}
      </div>
    </body>`;
}

async function enviarEmail(text, contato, listaAnexos) {
  const attachments = await Promise.all(
    (listaAnexos || []).map(async (filename) => {
      const safeFilename = path.basename(filename);
      const filePath = path.join(
        process.cwd(),
        "public",
        "upload",
        "anexos",
        safeFilename
      );
      const content = await fs.readFile(filePath);

      return {
        filename: safeFilename,
        content: content.toString("base64"),
        disposition: "attachment",
      };
    })
  );

  const info = await enviarEmailMailerSend({
    to: process.env.RECEBEEMAIL,
    cc: attachments.length ? process.env.EMAIL_COPIA : undefined,
    subject: "Amalfis — Nova ocorrência de trânsito",
    html: montarHtml(text, contato),
    text: `Nova ocorrência de trânsito:\n\n${text}${contato ? `\n\nContato informado: ${contato}` : "\n\nNenhum contato informado."}`,
    attachments,
  });
  console.log(
    `MailerSend aceitou a ocorrência de trânsito (HTTP ${info.status})${info.messageId ? `; ID: ${info.messageId}` : ""}`
  );
}

module.exports = DenunciaController;
