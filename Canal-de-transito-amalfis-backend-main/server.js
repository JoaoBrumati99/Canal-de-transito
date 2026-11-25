const app = require("./app/app.js");
const dotenv = require("dotenv");
dotenv.config();

const PORT = 3001;

const http = require("http");

const server = http.createServer(app);

server.listen(PORT, () => {
  // usando o app.js para escutar o servidor
  console.log("Servidor ligado na porta " + PORT);
});
