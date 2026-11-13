import worker from "../src/index.js";
import { createApplication } from "./application.mjs";
import {
  ROOT,
  applicationSettings,
  loadEnvironment,
} from "./environment.mjs";
import { FileSiteStore } from "./site-store.mjs";

function installShutdown(server) {
  const shutdown = (signal) => {
    console.log(`${signal} received; closing HTTP server.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export async function main() {
  await loadEnvironment(ROOT);
  const settings = applicationSettings();
  const store = new FileSiteStore({
    dataDir: settings.dataDir,
    adminSecret: settings.adminSecret,
    defaults: settings.siteDefaults,
    env: process.env,
  });
  const env = {
    ...process.env,
    ADMIN_SECRET: settings.adminSecret,
    SITE_STORE: store,
  };
  const server = createApplication({ worker, env, root: ROOT });
  server.listen(settings.port, settings.host, () => {
    console.log(
      `Profile Card Studio listening on http://${settings.host}:${settings.port}`,
    );
  });
  installShutdown(server);
  return server;
}
