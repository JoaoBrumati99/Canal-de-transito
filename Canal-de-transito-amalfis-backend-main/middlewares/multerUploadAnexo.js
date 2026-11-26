const multer = require('multer');
const path = require('path');

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const extAceitas = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.webp', '.mp4', '.mov', '.webm'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES },
  fileFilter: (req, file, callback) => {
    const extencaoArquivo = path.extname(file.originalname).toLowerCase();
    if (extAceitas.includes(extencaoArquivo)) {
      callback(null, true);
    } else {
      callback(Object.assign(new Error('Unsupported file type'), {
        code: 'UNSUPPORTED_MEDIA_TYPE',
      }));
    }
  },
});

upload.MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_BYTES;

module.exports = upload;
