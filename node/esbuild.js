const defaultSettings = require("../esbuild.settings").defaultSettings;

require("esbuild").build({
  ...defaultSettings,
  entryPoints: ["dist/index.js"],
});
