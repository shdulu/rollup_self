let fs = require("fs");
let path = require("path");
let Module = require("./module");
let MagicString = require("magic-string");
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
    const { code } = this.generate(); //生成打包后的代码
    fs.writeFileSync(output, code); //写入文件系统
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
      debugger
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
      const source = statement._source.clone();
      if (statement.type === "ExportNamedDeclaration") {
        // 删除掉 export
        source.remove(statement.start, statement.declaration.start);
      }
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
