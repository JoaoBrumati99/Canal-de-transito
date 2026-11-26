const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");
const routes = require("../app/routes/index.js");

async function withServer(app, run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("allows the configured frontend origin and blocks other browser origins", async () => {
  const originalOrigin = process.env.FRONTEND_ORIGIN;
  process.env.FRONTEND_ORIGIN = "https://canal-de-transito-amalfis.vercel.app";
  const app = express();
  routes(app);

  try {
    await withServer(app, async (baseUrl) => {
      const allowed = await fetch(`${baseUrl}/api/geocode/reverse`, {
        method: "OPTIONS",
        headers: {
          Origin: process.env.FRONTEND_ORIGIN,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      });
      assert.equal(
        allowed.headers.get("access-control-allow-origin"),
        process.env.FRONTEND_ORIGIN,
      );

      const blocked = await fetch(`${baseUrl}/api/geocode/reverse`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://untrusted.example",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "content-type",
        },
      });
      assert.equal(blocked.headers.get("access-control-allow-origin"), null);
    });
  } finally {
    if (originalOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
    else process.env.FRONTEND_ORIGIN = originalOrigin;
  }
});
