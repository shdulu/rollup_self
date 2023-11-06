let fs = require("fs");
let path = require("path");
let Module = require("./module");
let MagicString = require("magic-string");
const { hasOwnProperty, replaceIdentifier } = require("./utils");
class Bundle {
  constructor(options) {
    //入口文件数据
    this.entryPath = path.resolve(options.entry.replace(/\.js$/, "") + ".js");
    //存放所有的模块
    this.modules = new Set();
  }
  build(output) {
    // 创建一个入口module
    const entryModule = this.fetchModule(this.entryPath); //获取模块代码
    debugger;
    this.statements = entryModule.expandAllStatements(true); //展开所有的语句
    this.deconflict();
    const { code } = this.generate(); //生成打包后的代码
    fs.writeFileSync(output, code); //写入文件系统
  }
  deconflict() {
    const defines = {};
    const conflicts = {};
    this.statements.forEach((statement) => {
      Object.keys(statement._defines).forEach((name) => {
        if (hasOwnProperty(defines, name)) {
          conflicts[name] = true;
        } else {
          defines[name] = [];
        }
        // 把此变量定义语句对应模块放到数组中
        defines[name].push(statement._module);
      });
    });
    Object.keys(conflicts).forEach((name) => {
      const modules = defines[name];
      modules.pop(); // 最后一个模块不需要重命名
      modules.forEach((module, index) => {
        let replacement = `${name}$${modules.length - index}`;
        module.rename(name, replacement); // 模块变量重命名
      });
    });
  }
  /**
   * 创建模块实例
   *
   * @param {*} importee 被引入的模块 ./msg.js
   * @param {*} importer 引入模块 main.js
   * @return {*}
   * @memberof Bundle
   */
  fetchModule(importee, importer) {
    let route;
    if (!importer) {
      route = importee;
    } else {
      if (path.isAbsolute(importee)) {
        route = importee;
      } else {
        route = path.resolve(
          path.dirname(importer),
          importee.replace(/\.js$/, "") + ".js"
        );
      }
    }
    if (route) {
      // 读取文件对应的内容
      let code = fs.readFileSync(route, "utf8");
      // 创建一个模块的实例
      debugger;
      const module = new Module({
        code,
        path: importee,
        bundle: this,
      });
      this.modules.add(module);
      return module;
    }
  }
  generate() {
    let magicString = new MagicString.Bundle();
    this.statements.forEach((statement) => {
      let replacements = {};
      // 拿到模块定义和依赖的变量合并
      Object.keys(statement._dependsOn)
        .concat(Object.keys(statement._defines))
        .forEach((name) => {
          const canonicalName = statement._module.getCanonicalName(name);
          if (name !== canonicalName) {
            replacements[name] = canonicalName;
          }
        });
      const source = statement._source.clone();
      if (statement.type === "ExportNamedDeclaration") {
        // 删除掉 export
        source.remove(statement.start, statement.declaration.start);
      }
      replaceIdentifier(statement, source, replacements);
      // 把每个语句对应的源代码都添加到bundle实例中
      magicString.addSource({
        content: source,
        separator: "\n",
      });
    });
    // 返回新的源码
    return { code: magicString.toString() };
  }
}
module.exports = Bundle;
