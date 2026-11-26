import { createServer as createHttpServer } from "node:http";
import { describe, expect, it } from "vitest";
import { createServer as createViteServer } from "vite";
import viteConfig from "../vite.config.js";

describe("Vite development API proxy", () => {
  it("forwards the API path to the Node backend without rewriting it", async () => {
    const proxy = viteConfig.server.proxy;

    expect(proxy["/api"]).toMatchObject({
      target: "http://localhost:3001",
      changeOrigin: true,
    });
    expect(proxy["/api"].rewrite).toBeUndefined();

    let receivedPath;
    const backend = createHttpServer((request, response) => {
      receivedPath = request.url;
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ path: receivedPath }));
    });
    await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));

    const testConfig = {
      ...viteConfig,
      server: {
        ...viteConfig.server,
        host: "127.0.0.1",
        port: 0,
        proxy: {
          ...proxy,
          "/api": {
            ...proxy["/api"],
            target: `http://127.0.0.1:${backend.address().port}`,
          },
        },
      },
    };
    const vite = await createViteServer({ ...testConfig, configFile: false });

    try {
      await vite.listen();
      const vitePort = vite.httpServer.address().port;
      const response = await fetch(
        `http://127.0.0.1:${vitePort}/api/geocode/reverse`,
        { method: "POST", body: "{}" },
      );

      expect(response.status).toBe(200);
      expect(receivedPath).toBe("/api/geocode/reverse");
      await expect(response.json()).resolves.toEqual({
        path: "/api/geocode/reverse",
      });
    } finally {
      await vite.close();
      await new Promise((resolve, reject) =>
        backend.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
