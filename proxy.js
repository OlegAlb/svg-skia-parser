import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

// This is dev-only proxy to beat CORS. DO NOT USE IT ON PRODUCTION

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

const svgProxy = createProxyMiddleware({
  target: "https://app.restoplace.cc",
  changeOrigin: true,
  pathRewrite: { "^/restoplace": "" },
});

app.use("/restoplace", (req, res, next) => {
  if (req.url.endsWith(".svg")) {
    svgProxy(req, res, next);
  } else {
    next();
  }
});

app.listen(3000, () => {
  console.log("Proxy server running on http://localhost:3000");
});
