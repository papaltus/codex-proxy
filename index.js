import express from "express";
import https from "https";

const WORKER_URL = "https://codex-proxy.1964340.workers.dev";

const app = express();

// принимаем тело целиком (важно!)
app.use(express.raw({ type: "*/*", limit: "100mb" }));

app.all("*", async (req, res) => {
  try {
    const url = WORKER_URL + req.originalUrl;

    const options = {
      method: req.method,
      headers: req.headers
    };

    const upstream = https.request(url, options, upstreamRes => {
      res.status(upstreamRes.statusCode);
      for (const [k, v] of Object.entries(upstreamRes.headers)) {
        res.setHeader(k, v);
      }
      upstreamRes.pipe(res);
    });

    upstream.on("error", err => {
      console.error("Proxy error:", err);
      res.status(500).send("Proxy error: " + err.message);
    });

    if (req.method !== "GET" && req.method !== "HEAD") {
      upstream.write(req.body);
    }

    upstream.end();

  } catch (err) {
    console.error("Internal error:", err);
    res.status(500).send("Internal proxy error");
  }
});

app.get("/debug-path", (req, res) => {
  res.send("Using WORKER_URL = " + WORKER_URL);
});

app.listen(8080, () => {
  console.log("Proxy listening on 8080");
});
