const { parse } = require("jsonc-parser");
const { readFileSync } = require("node:fs");

module.exports = {
  config: {
    preset: "ts-jest",
  },
  compilerOptions: parse(readFileSync("./tsconfig.json").toString())
    .compilerOptions,
};
