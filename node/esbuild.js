const { resolve } = require("node:path");

const defaultSettings = require("../esbuild.settings").defaultSettings;
const { move } = require("fs-extra");
const { mkdirp } = require("fs-extra");
const { copy } = require("fs-extra");

require("esbuild")
  .build({ ...defaultSettings, entryPoints: ["dist/index.js"] })
  .then(async () => {
    const assets = resolve(__dirname, "assets");
    await mkdirp(assets);
    await copy(
      resolve("..", "python", "dist", "trafilatura-recall-extractor"),
      resolve(assets, "python")
    );
  })
  .catch(() => process.exit(1));
