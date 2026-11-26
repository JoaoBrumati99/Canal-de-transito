const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");
const denuncia = require("../app/routes/denunciaRoutes.js");

async function withServer(app, run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("rejects multipart submissions whose combined attachments exceed 4 MB", async () => {
  const app = express();
  app.use(denuncia);

  await withServer(app, async (baseUrl) => {
    const form = new FormData();
    form.append("consentimento", "true");
    form.append("denuncia", JSON.stringify({ descricao: "Descrição válida" }));
    form.append(
      "anexo",
      new Blob([Buffer.alloc(2_100_000)], { type: "video/mp4" }),
      "first.mp4",
    );
    form.append(
      "anexo",
      new Blob([Buffer.alloc(2_100_000)], { type: "video/mp4" }),
      "second.mp4",
    );

    const response = await fetch(`${baseUrl}/api/denuncia`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), {
      message: "O limite total de anexos é 4 MB por envio.",
      error: true,
    });
  });
});
