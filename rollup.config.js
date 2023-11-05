import babel from "@rollup/plugin-babel"; // 将es6转为es5
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import postcss from "rollup-plugin-postcss";
import serve from "rollup-plugin-serve";

export default {
  input: "src/main.js",
  output: {
    file: "dist/bundle.cjs.js", //输出文件的路径和名称
    format: "cjs", //五种输出格式：amd(已经废弃)/es6(esModule)/iife/umd/cjs
    name: "bundleName", //当format为iife和umd时必须提供，将作为全局变量挂在window下
    globals: {
      lodash: "_", // 外部依赖访问变量
      jquery: "$",
    },
  },
  external: ["lodash", "jquery"], // 扩展为外部依赖 使用CDN
  plugins: [
    // 使用 babel 插件将es6转化为es5
    babel({
      exclude: /node_modules/,
    }),
    resolve(), // 作用是可以加载node_modules里有的模块
    commonjs(), // 可以支持commonjs语法
    typescript(), // 支持ts
    terser(), // 压缩js
    postcss(), // 编译css
    serve({
      // 本地服务器
      open: true,
      port: 8080,
      contentBase: "./dist",
    }),
  ],
};
