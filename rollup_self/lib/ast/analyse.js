const walk = require("./walk");
const Scope = require("./scope");
const { hasOwnProperty } = require("../utils");
/**
 * 分析模块对应的AST语法树
 *
 * @param {*} ast 语法树
 * @param {*} code 源代码
 * @param {*} module 模块实例
 */
function analyse(ast, code, module) {
  // 开启第一轮的循环，找到本模块导入导出那些变量
  //给statement定义属性
  ast.body.forEach((statement) => {
    Object.defineProperties(statement, {
      _included: { value: false, writable: true }, // 标识这条语句默认不包含在输出结果中
      _module: { value: module }, // 指向自己的模块
      _source: { value: code.snip(statement.start, statement.end) }, // 这个语句自己的源码
      _dependsOn: { value: {} }, // 依赖的变量
      _defines: { value: {} }, // 存放语句定义了那些变量
      _modifies: { value: {} }, // 存放语句修改了那些变量
    });
    // 找出通过 import 导入的变量，并将变量和来源存入模块实例的 imports 属性上 {source: './msg.js', 'name'}
    if (statement.type === "ImportDeclaration") {
      // 获取导入模块的相对路径
      let source = statement.source.value; // ./msg.js
      // 遍历导入的变量 specifiers
      statement.specifiers.forEach((specifier) => {
        let importName = specifier.imported.name; // 导入的变量名
        let localName = specifier.local.name; // 在当前模块的变量名 - 两者可能不一样，可以重命名
        // 当前模块内导入的变量名 localName 来自于source模块导出的importName变量
        module.imports[localName] = { source, importName };
      });
    } else if (statement.type === "ExportNamedDeclaration") {
      // 具名导出（named export）语句 - 记录模块导出的变量
      const declaration = statement.declaration;
      if (declaration && declaration.type === "VariableDeclaration") {
        const declarations = declaration.declarations;
        declarations.forEach((variableDeclarator) => {
          const localName = variableDeclarator.id.name;
          const exportName = localName;
          module.exports[exportName] = { localName };
        });
      }
    }
  });

  // 开启第二轮循环 创建作用域链
  // 需要知道本模块用到了那些变量，用到的留下，没用到的删除
  // 还需要知道这个变量是局部的还是全局的，只需要处理全局

  // 先创建顶级作用域
  let currentScope = new Scope({ name: "模块内的顶级作用域" });
  ast.body.forEach((statement) => {
    function addToScope(name, isBlockDeclaration) {
      currentScope.add(name, isBlockDeclaration); // 把此变量名添加到当前的作用域变量中
      if (!currentScope.parent || (currentScope.isBlock && !isBlockDeclaration)) {
        // 顶级作用域
        statement._defines[name] = true; // 表示此语句定义了一个顶级变量
        // 定义此顶级变量的语句保存下来
        module.definitions[name] = statement;
      }
    }

    /**
     * 记录模块 import 导入的变量
     *
     * @param {*} node
     */
    function checkForReads(node) {
      if (node.type === "Identifier") {
        statement._dependsOn[node.name] = true; // 当前这个语句依赖了 node.name 变量
      }
    }
    function checkForWrites(node) {
      function addNode(node) {
        const { name } = node;
        statement._modifies[name] = true; // 此语句修改了变量
        if (!hasOwnProperty(module.modifications, name)) {
          module.modifications[name] = [];
        }
        // 存放修改变量的语句数组
        // [name = 'shdulu', name+='is fornt job']
        module.modifications[name].push(statement);
      }

      if (node.type === "AssignmentExpression") {
        debugger;
        addNode(node.left, true);
      } else if (node.type === "UpdateExpression") {
        debugger;
        addNode(node.argument);
      }
    }
    // 深度优先递归循环 AST 语法树
    debugger;
    walk(statement, {
      // 深度优先递归循环进入
      enter(node) {
        let newScope;
        checkForReads(node);
        checkForWrites(node);
        switch (node.type) {
          case "FunctionDeclaration":
            addToScope(node.id.name); // 把函数名添加到当前的作用域变量中
            const names = node.params.map((param) => param.name);
            // 函数声明创建新的作用域
            newScope = new Scope({
              name: node.id.name,
              parent: currentScope,
              names,
              isBlock: false, // 函数创建的不是一个块作用域
            });
            break;
          case "VariableDeclaration":
            node.declarations.forEach((declaration) => {
              if (node.kind === "let" || node.kind === "const") {
                addToScope(declaration.id.name, true);
              } else {
                addToScope(declaration.id.name);
              }
            });
            break;
          case "BlockStatement":
            newScope = new Scope({ parent: currentScope, isBlock: true });
            break;
          default:
            break;
        }
        if (newScope) {
          Object.defineProperty(node, "_scope", {
            value: newScope,
          });
        }
      },
      // 深度优先递归循环离开
      leave(node) {
        // 当前节点上有_scope， 说明此节点创建了一个新作用域，离开的时候要到会父作用域
        if (Object.hasOwnProperty(node, "_scope")) {
          currentScope = currentScope.parent;
        }
      },
    });
  });
}
module.exports = analyse;
