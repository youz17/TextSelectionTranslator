const path = require("path");

module.exports = {
  entry: {
    content: "./src/content.ts", // 内容脚本入口
    service: "./src/background.ts", // Service Worker 入口
    options: "./src/options.ts", // 设置页入口
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    globalObject: "this", // 强制使用全局 this（Service Worker 环境）
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"], // 自动解析文件扩展名
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // 匹配 .ts / .tsx 文件
        use: "ts-loader", // 使用 ts-loader
        exclude: /node_modules/,
      },
    ],
  },
  // 不内联 sourcemap：inline-source-map 的 base64 会占掉产物 4/5 的体积
  // （content.js 153KB 里有 120KB 是 map），而扩展是整包加载的。
  devtool: false,
  mode: "development", // 开发模式
};
