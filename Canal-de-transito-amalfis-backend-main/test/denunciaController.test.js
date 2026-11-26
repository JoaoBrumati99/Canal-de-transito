const assert = require("node:assert/strict");
const { test } = require("node:test");
const DenunciaController = require("../app/controllers/denunciaController.js");

const originalFetch = global.fetch;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalEnv = {
  MAILERSEND_API_TOKEN: process.env.MAILERSEND_API_TOKEN,
  EMAIL_FROM: process.env.EMAIL_FROM,
  RECEBEEMAIL: process.env.RECEBEEMAIL,
};

function configureMailerSend(fetchImpl) {
  process.env.MAILERSEND_API_TOKEN = "test-token";
  process.env.EMAIL_FROM = "sender@example.com";
  process.env.RECEBEEMAIL = "company@example.com";
  global.fetch = fetchImpl;
}

function createResponseRecorder() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("requires explicit consent and does not send an email without it", async () => {
  let fetchCalls = 0;
  configureMailerSend(async () => {
    fetchCalls += 1;
    return Response.json({}, { status: 202 });
  });
  const response = createResponseRecorder();

  await DenunciaController.cadastrarDenuncia({
    body: { denuncia: JSON.stringify({ descricao: "Descrição válida" }) },
    files: [],
  }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, true);
  assert.equal(fetchCalls, 0);
});

test("sends structured occurrence details and attachments to the configured company inbox", async () => {
  let mailPayload;
  global.console.log = () => {};
  configureMailerSend(async (_url, options) => {
    mailPayload = JSON.parse(options.body);
    return new Response(null, {
      status: 202,
      headers: { "x-message-id": "test-message-id" },
    });
  });
  const response = createResponseRecorder();
  const denuncia = {
    protocolo: "CT-20261126-ABC123",
    categoria: "Direção perigosa",
    veiculo: "Fiorino",
    placa: "QOY6G79",
    local: "Rua Exemplo, 12",
    data: "2026-11-25",
    horario: "14:30",
    descricao: "<script>alert('x')</script>\nDescrição adicional",
  };

  await DenunciaController.cadastrarDenuncia({
    body: { denuncia: JSON.stringify(denuncia), consentimento: "true" },
    files: [{
      originalname: "evidence.jpg",
      buffer: Buffer.from("sample attachment"),
    }],
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.error, false);
  assert.deepEqual(mailPayload.to, [{ email: "company@example.com" }]);
  assert.match(mailPayload.text, /Placa: QOY6G79/);
  assert.match(mailPayload.text, /Endereço: Rua Exemplo, 12/);
  assert.match(mailPayload.html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.doesNotMatch(mailPayload.html, /<script>/);
  assert.deepEqual(mailPayload.attachments, [{
    filename: "evidence.jpg",
    content: Buffer.from("sample attachment").toString("base64"),
    disposition: "attachment",
  }]);
});

test("does not return MailerSend error details to the browser", async () => {
  global.console.error = () => {};
  configureMailerSend(async () => new Response("private provider details", { status: 503 }));
  const response = createResponseRecorder();

  await DenunciaController.cadastrarDenuncia({
    body: {
      denuncia: JSON.stringify({ descricao: "Descrição válida" }),
      consentimento: "true",
    },
    files: [],
  }, response);

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.error, true);
  assert.doesNotMatch(response.body.message, /private provider details/);
});

test.after(() => {
  global.fetch = originalFetch;
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});
