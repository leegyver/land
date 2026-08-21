import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

import { storage } from "./storage";
import { injectSeoIntoHtml } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html with dynamic SEO metadata injection
  app.use("*", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      const template = await fs.promises.readFile(indexPath, "utf-8");
      const html = await injectSeoIntoHtml(req.originalUrl || req.path, template, storage);
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(html);
    } catch (e) {
      console.error("[Static SEO] Error injecting SEO metadata:", e);
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
