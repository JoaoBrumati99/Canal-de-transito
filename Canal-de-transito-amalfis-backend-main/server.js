const dotenv = require("dotenv");
dotenv.config();

const app = require("./app/app.js");
const PORT = 3001;

const http = require("http");

const server = http.createServer(app);

server.listen(PORT, () => {
  // usando o app.js para escutar o servidor
  console.log("Servidor ligado na porta " + PORT);
});
