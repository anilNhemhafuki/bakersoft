import express from "express";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite";
import { setupAuth } from "./localAuth";
import { initializeDatabase } from "./init-db";
import router from "./routes";
import { initializeUnits } from "./init-units";
import { securityMonitor } from "./securityMonitor";
import { alertService } from "./alertService";
import path from "path";
import { storage } from "./lib/storage";
import fs from "fs";

const app = express();

// Trust proxy for production
app.set("trust proxy", 1);

// Parse JSON bodies
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// File upload middleware
app.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    useTempFiles: true,
    tempFileDir: "/tmp/",
    createParentPath: true,
  }),
);

async function startServer() {
  try {
    // Setup authentication first
    await setupAuth(app);

    // API Routes - ensure all API routes are properly mounted
    app.use("/api", router);

    // Handle static file serving for uploads
    app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "public", "uploads")),
    );

    // Serve Service Worker with correct MIME type
    app.get("/sw.js", (req, res) => {
      const swPath = path.join(process.cwd(), "public", "sw.js");
      if (fs.existsSync(swPath)) {
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Service-Worker-Allowed", "/");
        res.sendFile(swPath);
      } else {
        res.status(404).send("Service Worker not found");
      }
    });

    // Serve manifest.json with correct MIME type
    app.get("/manifest.json", (req, res) => {
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      if (fs.existsSync(manifestPath)) {
        res.setHeader("Content-Type", "application/json");
        res.sendFile(manifestPath);
      } else {
        res.status(404).send("Manifest not found");
      }
    });

    // Serve favicon with correct MIME type
    app.get("/favicon-icon.png", (req, res) => {
      const faviconPath = path.join(
        process.cwd(),
        "public",
        "favicon-icon.png",
      );
      if (fs.existsSync(faviconPath)) {
        res.setHeader("Content-Type", "image/jpeg");
        res.sendFile(faviconPath);
      } else {
        res.status(404).send("Favicon not found");
      }
    });

    // Global error handler for express
    app.use((error: any, req: any, res: any, next: any) => {
      console.error("🚨 Express Error:", error);

      // If it's an API route, return JSON
      if (req.originalUrl && req.originalUrl.startsWith("/api/")) {
        return res.status(500).json({
          error: "Internal server error",
          message: error.message || "An unexpected error occurred",
          success: false,
        });
      }

      // For non-API routes, you might want to render an error page
      res.status(500).send("Internal Server Error");
    });

    const server = createServer(app);

    const port = parseInt(process.env.PORT || "5000");

    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server FIRST to open the port immediately
    server.listen(port, "0.0.0.0", () => {
      // Initialize database in the background after server is running
      (async () => {
        let dbConnected = false;
        let retryCount = 0;
        const maxRetries = 3;

        // Retry database connection
        while (!dbConnected && retryCount < maxRetries) {
          try {
            console.log("🔄 Initializing database...");
            await initializeDatabase();
            dbConnected = true;
          } catch (error) {
            retryCount++;
            if (retryCount < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 5000));
            }
          }
        }

        if (!dbConnected) {
          console.error(
            "❌ Database connection failed - starting in limited mode",
          );
          return;
        }

        // Initialize default units only if database is connected
        try {
          await initializeUnits();
          console.log("✅ Units initialized successfully");
        } catch (error) {
          console.warn(
            "⚠️ Unit initialization failed:",
            (error as Error).message,
          );
        }

        // Initialize security monitoring
        try {
          // Connect security monitor to alert service
          securityMonitor.onAlert(async (alert) => {
            await alertService.sendAlert(alert);
          });
          console.log("🛡️ Security monitoring initialized");
        } catch (error) {
          console.warn(
            "⚠️ Security monitoring initialization failed:",
            (error as Error).message,
          );
        }

        // Initialize default pricing settings
        try {
          console.log("💰 Initializing pricing settings...");
          const currentPrice = await storage.getSystemPrice();
          console.log(`💰 System price initialized: $${currentPrice}`);
        } catch (error) {
          console.warn(
            "⚠️ Pricing settings initialization failed:",
            (error as Error).message,
          );
        }
      })();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
