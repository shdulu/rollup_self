const path = require("path");
const rollup = require("./lib/rollup");
const entry = path.resolve(__dirname, "src/main.js");
const output = path.resolve(__dirname, "dist/bundle.js");
debugger;
rollup(entry, output);
