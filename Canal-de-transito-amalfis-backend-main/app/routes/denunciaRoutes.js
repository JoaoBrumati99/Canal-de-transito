const express = require("express");

const denunciaController = require( "../controllers/denunciaController.js");

const  ValidUploadAnexo = require("../../middlewares/multerUploadAnexo.js"); 

const routes = express.Router();

routes.post("/api/denuncia", (req, res, next) => {
  ValidUploadAnexo.array("anexo")(req, res, (error) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        message: "O limite total de anexos é 4 MB por envio.",
        error: true,
      });
    }
    if (error?.code === "UNSUPPORTED_MEDIA_TYPE") {
      return res.status(415).json({
        message: "Um ou mais arquivos têm formato não aceito.",
        error: true,
      });
    }
    if (error) return next(error);

    const totalBytes = (req.files || []).reduce((total, file) => total + file.size, 0);
    if (totalBytes > ValidUploadAnexo.MAX_ATTACHMENT_BYTES) {
      return res.status(413).json({
        message: "O limite total de anexos é 4 MB por envio.",
        error: true,
      });
    }
    return next();
  });
}, (req, res) => denunciaController.cadastrarDenuncia(req, res));



module.exports = routes;
