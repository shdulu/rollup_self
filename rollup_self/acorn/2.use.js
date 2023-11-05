const acorn = require("acorn");
const walk = require("./1.walk");

debugger
const sourceCode = 'import $ from "jquery"';
const ast = acorn.parse(sourceCode, {
  sourceType: "module",
  ecmaVersion: 8,
});

let indent = 0;
const padding = () => ' '.repeat(indent)

ast.body.forEach((statement) => {
  walk(statement, {
    enter(node) {
      if (node.type) {
        console.log(padding() + node.type + "进入");
        indent += 2;
      }
    },
    leave(node) {
      if (node.type) {
        indent -= 2;
        console.log(padding() + node.type + "离开");
      }
    },
  });
});
