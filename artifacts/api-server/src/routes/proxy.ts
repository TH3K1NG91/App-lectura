import { Router, type IRouter } from "express";
import { Readable } from "stream";

const router: IRouter = Router();

router.get("/proxy/file", async (req, res): Promise<void> => {
  const url = req.query.url as string;
  if (!url || !url.startsWith("http")) {
    res.status(400).json({ error: "A valid http URL is required" });
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Lumina/1.0 (+https://lumina.app)" },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Upstream request failed" });
      return;
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    if (contentLength) res.setHeader("Content-Length", contentLength);

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    req.log?.error({ err }, "Proxy fetch failed");
    res.status(500).json({ error: "Failed to proxy file" });
  }
});

export default router;
