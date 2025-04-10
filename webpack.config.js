const path = require("path");

module.exports = {
  entry: {
    content: "./src/content.ts", // 内容脚本入口
    service: "./src/background.ts", // Service Worker 入口
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    globalObject: "this", // 强制使用全局 this（Service Worker 环境）
  },
  resolve: {
    extensions: [".ts", ".js"], // 自动解析文件扩展名
  },
  module: {
    rules: [
      {
        test: /\.ts$/, // 匹配 .ts 文件
        use: "ts-loader", // 使用 ts-loader
        exclude: /node_modules/,
      },
    ],
  },
  devtool: "inline-source-map", // 生成 SourceMap（调试用）
  mode: "development", // 开发模式
};
