const express = require("express");
const denuncia = require("./denunciaRoutes.js") ;
const { createGeocodeRouter } = require("./geocodeRoutes.js");
const cors = require('cors');

const LOCAL_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return LOCAL_ORIGINS.has(origin) || configuredOrigins.includes(origin);
}

module.exports = (app) => {
  app.use( 
    cors({
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    }),
    express.json(),
    createGeocodeRouter(),
    denuncia
  );
};


