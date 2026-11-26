const assert = require("node:assert/strict");
const { test } = require("node:test");
const app = require("../server.js");

test("exports the Express app for Vercel without starting a local listener", () => {
  assert.equal(typeof app, "function");
  assert.equal(typeof app.listen, "function");
});
