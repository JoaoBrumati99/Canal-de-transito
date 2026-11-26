const express = require("express");

const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_CONCURRENT_LOOKUPS = 2;
const DEFAULT_TIMEOUT_MS = 5000;
const GEOAPIFY_REVERSE_URL = "https://api.geoapify.com/v1/geocode/reverse";

function parseBoundedPositiveInteger(value, defaultValue, maximum) {
  if (value === undefined || value === "") return defaultValue;
  if (!/^[1-9]\d*$/.test(value)) throw new Error("Invalid geocode limit configuration");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new Error("Invalid geocode limit configuration");
  }
  return parsed;
}

function parseLimits(env = process.env) {
  return {
    requestsPerMinute: parseBoundedPositiveInteger(
      env.GEOAPIFY_RATE_LIMIT_PER_MINUTE,
      MAX_REQUESTS_PER_MINUTE,
      MAX_REQUESTS_PER_MINUTE
    ),
    maxConcurrent: parseBoundedPositiveInteger(
      env.GEOAPIFY_MAX_CONCURRENT,
      MAX_CONCURRENT_LOOKUPS,
      MAX_CONCURRENT_LOOKUPS
    ),
  };
}

function validCoordinates(body) {
  return body !== null
    && typeof body === "object"
    && !Array.isArray(body)
    && typeof body.latitude === "number"
    && Number.isFinite(body.latitude)
    && body.latitude >= -90
    && body.latitude <= 90
    && typeof body.longitude === "number"
    && Number.isFinite(body.longitude)
    && body.longitude >= -180
    && body.longitude <= 180;
}

function cleanPart(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatGeoapifySuggestion(payload) {
  const properties = payload?.features?.[0]?.properties;
  if (!properties || typeof properties !== "object") return "";

  const street = cleanPart(properties.street);
  if (!street) return "";

  const parts = [
    street,
    cleanPart(properties.housenumber),
    cleanPart(properties.suburb) || cleanPart(properties.district),
    cleanPart(properties.city) || cleanPart(properties.town) || cleanPart(properties.village),
    cleanPart(properties.postcode),
  ].filter(Boolean);

  return [...new Set(parts)].join(", ");
}

function createGeocodeRouter(options = {}) {
  const router = express.Router();
  const env = options.env || process.env;
  const enabled = options.enabled === undefined
    ? env.GEOAPIFY_ENABLED === "true"
    : options.enabled === true;
  const apiKey = options.apiKey === undefined ? env.GEOAPIFY_API_KEY : options.apiKey;
  const limits = options.limits || parseLimits(env);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const now = options.now || Date.now;
  let windowStartedAt = now();
  let requestCount = 0;
  let activeLookups = 0;

  router.post("/api/geocode/reverse", async (req, res) => {
    if (!validCoordinates(req.body)) {
      return res.status(400).json({ error: "invalid_coordinates" });
    }

    if (!enabled || typeof apiKey !== "string" || !apiKey.trim() || typeof fetchImpl !== "function") {
      return res.status(503).json({ error: "unavailable" });
    }

    const currentTime = now();
    if (currentTime - windowStartedAt >= 60_000 || currentTime < windowStartedAt) {
      windowStartedAt = currentTime;
      requestCount = 0;
    }
    if (requestCount >= limits.requestsPerMinute || activeLookups >= limits.maxConcurrent) {
      return res.status(429).json({ error: "rate_limited" });
    }
    requestCount += 1;
    activeLookups += 1;

    const requestUrl = new URL(GEOAPIFY_REVERSE_URL);
    requestUrl.searchParams.set("lat", String(req.body.latitude));
    requestUrl.searchParams.set("lon", String(req.body.longitude));
    requestUrl.searchParams.set("lang", "pt");
    requestUrl.searchParams.set("apiKey", apiKey.trim());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(requestUrl, {
        method: "GET",
        headers: {
          accept: "application/geo+json, application/json",
          "user-agent": "Canal-de-Transito/1.0",
        },
        signal: controller.signal,
      });

      if (response.status === 429) return res.status(429).json({ error: "rate_limited" });
      if (!response.ok) return res.status(503).json({ error: "unavailable" });

      const payload = await response.json();
      const suggestion = formatGeoapifySuggestion(payload);
      if (!suggestion) return res.status(404).json({ error: "no_match" });

      return res.status(200).json({ suggestion });
    } catch (error) {
      if (controller.signal.aborted || (error && (error.name === "AbortError" || error.name === "TimeoutError"))) {
        return res.status(504).json({ error: "timeout" });
      }
      return res.status(503).json({ error: "unavailable" });
    } finally {
      clearTimeout(timeout);
      activeLookups -= 1;
    }
  });

  return router;
}

module.exports = { createGeocodeRouter, formatGeoapifySuggestion, parseLimits };
