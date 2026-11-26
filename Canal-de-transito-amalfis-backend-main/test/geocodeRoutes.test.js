const assert = require("node:assert/strict");
const { test } = require("node:test");
const express = require("express");
const { createGeocodeRouter, parseLimits } = require("../app/routes/geocodeRoutes.js");

const GEOAPIFY_PROPERTIES = {
  street: "Rua Santa Teresa",
  housenumber: "123",
  suburb: "Sé",
  city: "São Paulo",
  postcode: "01016-020",
};

function createApp(options = {}) {
  const app = express();
  app.use(express.json(), createGeocodeRouter({
    enabled: true,
    apiKey: "test-key",
    fetchImpl: async () => Response.json({
      features: [{ properties: GEOAPIFY_PROPERTIES }],
    }),
    ...options,
  }));
  return app;
}

async function withServer(app, run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function postJson(baseUrl, body = { latitude: -23.55, longitude: -46.63 }) {
  return fetch(`${baseUrl}/api/geocode/reverse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("disabled or unconfigured Geoapify fails closed without an upstream request", async () => {
  for (const options of [
    { enabled: false, apiKey: "test-key" },
    { enabled: true, apiKey: "" },
  ]) {
    let upstreamCalls = 0;
    await withServer(createApp({
      ...options,
      fetchImpl: async () => {
        upstreamCalls += 1;
        return Response.json({});
      },
    }), async (baseUrl) => {
      const response = await postJson(baseUrl);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "unavailable" });
    });
    assert.equal(upstreamCalls, 0);
  }
});

test("validates coordinates before calling Geoapify", async () => {
  let upstreamCalls = 0;
  await withServer(createApp({
    fetchImpl: async () => {
      upstreamCalls += 1;
      return Response.json({});
    },
  }), async (baseUrl) => {
    for (const body of [
      { latitude: "1", longitude: 2 },
      { latitude: 91, longitude: 2 },
      { latitude: 1, longitude: -181 },
    ]) {
      const response = await postJson(baseUrl, body);
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "invalid_coordinates" });
    }
  });
  assert.equal(upstreamCalls, 0);
});

test("forwards valid coordinates server-side and returns street, neighborhood, city, and postcode", async () => {
  let requestedUrl;
  let requestedOptions;
  await withServer(createApp({
    fetchImpl: async (url, options) => {
      requestedUrl = new URL(url);
      requestedOptions = options;
      return Response.json({ features: [{ properties: GEOAPIFY_PROPERTIES }] });
    },
  }), async (baseUrl) => {
    const response = await postJson(baseUrl);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      suggestion: "Rua Santa Teresa, 123, Sé, São Paulo, 01016-020",
    });
  });

  assert.equal(requestedUrl.origin, "https://api.geoapify.com");
  assert.equal(requestedUrl.pathname, "/v1/geocode/reverse");
  assert.equal(requestedUrl.searchParams.get("lat"), "-23.55");
  assert.equal(requestedUrl.searchParams.get("lon"), "-46.63");
  assert.equal(requestedUrl.searchParams.get("lang"), "pt");
  assert.equal(requestedUrl.searchParams.get("apiKey"), "test-key");
  assert.equal(requestedOptions.method, "GET");
});

test("omits missing address components and never fabricates them", async () => {
  await withServer(createApp({
    fetchImpl: async () => Response.json({
      features: [{ properties: { street: "Rua Exemplo", city: "Campinas" } }],
    }),
  }), async (baseUrl) => {
    const response = await postJson(baseUrl);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { suggestion: "Rua Exemplo, Campinas" });
  });
});

test("maps no-match, provider limit, and provider failures to safe responses", async () => {
  const cases = [
    { result: { features: [] }, status: 404, body: { error: "no_match" } },
    { result: new Response(null, { status: 429 }), status: 429, body: { error: "rate_limited" } },
    { result: new Response(null, { status: 503 }), status: 503, body: { error: "unavailable" } },
  ];

  for (const scenario of cases) {
    await withServer(createApp({
      fetchImpl: async () => scenario.result instanceof Response
        ? scenario.result
        : Response.json(scenario.result),
    }), async (baseUrl) => {
      const response = await postJson(baseUrl);
      assert.equal(response.status, scenario.status);
      assert.deepEqual(await response.json(), scenario.body);
    });
  }
});

test("rate limits are bounded and requests beyond the limit are rejected", async () => {
  assert.throws(() => parseLimits({ GEOAPIFY_RATE_LIMIT_PER_MINUTE: "11" }), /Invalid/);
  assert.throws(() => parseLimits({ GEOAPIFY_MAX_CONCURRENT: "0" }), /Invalid/);

  let now = 1000;
  await withServer(createApp({
    limits: { requestsPerMinute: 1, maxConcurrent: 2 },
    now: () => now,
  }), async (baseUrl) => {
    assert.equal((await postJson(baseUrl)).status, 200);
    const limited = await postJson(baseUrl);
    assert.equal(limited.status, 429);
    assert.deepEqual(await limited.json(), { error: "rate_limited" });
    now += 60_001;
    assert.equal((await postJson(baseUrl)).status, 200);
  });
});

test("does not log upstream errors or include the key in safe errors", async () => {
  const messages = [];
  const originalError = console.error;
  const originalLog = console.log;
  console.error = (...parts) => messages.push(parts.join(" "));
  console.log = (...parts) => messages.push(parts.join(" "));
  try {
    await withServer(createApp({
      fetchImpl: async () => {
        throw new Error("test-key -23.55,-46.63 Rua Secreta");
      },
    }), async (baseUrl) => {
      const response = await postJson(baseUrl);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: "unavailable" });
    });
  } finally {
    console.error = originalError;
    console.log = originalLog;
  }
  assert.deepEqual(messages, []);
});
