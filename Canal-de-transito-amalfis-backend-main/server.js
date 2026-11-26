const dotenv = require("dotenv");
dotenv.config();

const app = require("./app/app.js");

if (require.main === module && !process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor ligado na porta ${PORT}`);
  });
}

module.exports = app;
