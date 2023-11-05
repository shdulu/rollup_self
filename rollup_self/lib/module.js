const MagicString = require("magic-string");
const { parse } = require("acorn");
let analyse = require("./ast/analyse");
const { hasOwnProperty } = require("./utils");

class Module {
  constructor({ code, path, bundle }) {
    this.code = new MagicString(code, { filename: path });
    this.path = path;
    this.bundle = bundle;
    // 解析语法树
    this.ast = parse(code, {
      ecmaVersion: 8,
      sourceType: "module",
    });

    // 存放本模块内导入了那些变量
    this.imports = {};
    // 存放本模块中导出了那些变量
    this.exports = {};
    // 存放本模块定义变量的语句
    this.definitions = {};
    // 存放变量修改语句
    this.modifications = {};
    // 分析语法树
    debugger
    analyse(this.ast, this.code, this);
  }
  expandAllStatements() {
    let allStatements = [];
    this.ast.body.forEach((statement) => {
      if (statement.type === "ImportDeclaration") return;
      let statements = this.expandStatement(statement);
      allStatements.push(...statements);
    });
    return allStatements;
  }
  expandStatement(statement) {
    statement._included = true;
    let result = [];
    // 找到此语句使用到的变量，把这些变量的定义语句取出来，放到result数组中
    const _dependsOn = Object.keys(statement._dependsOn);
    _dependsOn.forEach((name) => {
      // 找到此变量的定义语句添加到result里
      let definitions = this.define(name);
      result.push(...definitions);
    });
    result.push(statement);
    // 找到此语句定义的变量，把此变量对用的修改也包括进来
    const defines = Object.keys(statement._defines);
    defines.forEach((name) => {
      // 找到此变量的修改语句
      const modifications =
        hasOwnProperty(this.modifications, name) && this.modifications[name];
      if (modifications) {
        modifications.forEach((modification) => {
          if (!modification._included) {
            let statement = this.expandStatement(modification);
            result.push(...statement);
          }
        });
      }
    });
    return result;
  }
  define(name) {
    // 区分此变量是函数内自己声明的还是外部导入的
    if (hasOwnProperty(this.imports, name)) {
      const { source, importName } = this.imports[name];
      // 获取导入的模块
      // source 当前模块的相对路径 this.path 当前模块的绝对路径
      const importedModule = this.bundle.fetchModule(source, this.path);
      debugger
      const { localName } = importedModule.exports[importName]; // msg.js exports[name]
      return importedModule.define(localName);
    } else {
      // 非导入模块
      debugger
      let statement = this.definitions[name];
      if (statement && !statement._included) {
        return this.expandStatement(statement);
      }
      return [];
    }
  }
}

module.exports = Module;
