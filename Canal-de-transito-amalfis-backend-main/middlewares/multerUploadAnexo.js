const multer = require('multer');
const path = require('path');

// Extensões aceitas — espelham exatamente o que o front-end oferece.
const extAceitas = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.webp', '.mp4', '.mov', '.webm'];

module.exports = multer({
  // Local de armazenamento e nome do arquivo salvo em disco.
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, './public/upload/anexos');
    },
    filename: (req, file, callback) => {
      // Preserva a extensão original do arquivo (antes o nome era forçado
      // para ".png", o que corrompia PDFs/DOCs enviados como anexo).
      const ext = path.extname(file.originalname).toLowerCase();
      const newFileName = `${Date.now().toString()}_anexo${ext}`;
      callback(null, newFileName);
    },
  }),
  // Filtro por tipo de arquivo.
  fileFilter: (req, file, callback) => {
    const extencaoArquivo = path.extname(file.originalname).toLowerCase();
    if (extAceitas.includes(extencaoArquivo)) {
      callback(null, true);
    } else {
      callback({ code: 'UNSUPPORTED_MEDIA_TYPE' });
    }
  },
});
