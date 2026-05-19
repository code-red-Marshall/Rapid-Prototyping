import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Vite plugin with two proxy routes:
 *  /api/huggingface/* → router.huggingface.co (HF Inference API)
 *  /api/pollinations/* → image.pollinations.ai (bypasses Cloudflare Turnstile via Node UA)
 * Both routes originate from Node, so CORS and bot-detection are bypassed.
 */
function proxyPlugin() {
  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {

        // ── Hugging Face proxy ──────────────────────────────────────────
        if (req.url && req.url.startsWith('/api/huggingface')) {
          const targetPath = req.url.replace('/api/huggingface', '');
          const targetUrl = `https://router.huggingface.co/hf-inference${targetPath}`;

          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);

          try {
            console.log(`[HF Proxy] ${req.method} ${targetUrl}`);
            const proxyRes = await fetch(targetUrl, {
              method: req.method,
              headers: {
                'Authorization': req.headers['authorization'] || '',
                'Content-Type': req.headers['content-type'] || 'application/json',
              },
              body: req.method !== 'GET' ? body : undefined,
            });
            const buffer = Buffer.from(await proxyRes.arrayBuffer());
            if (proxyRes.ok) {
              console.log(`[HF Proxy] ✅ ${proxyRes.status} — ${buffer.length} bytes`);
            } else {
              console.error(`[HF Proxy] ❌ ${proxyRes.status}`);
              console.error(`[HF Proxy] Body: ${buffer.toString('utf-8').substring(0, 500)}`);
            }
            res.statusCode = proxyRes.status;
            const ct = proxyRes.headers.get('content-type');
            if (ct) res.setHeader('Content-Type', ct);
            res.end(buffer);
          } catch (err) {
            console.error(`[HF Proxy] Error:`, err.message);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // ── Pollinations proxy — Node UA bypasses Cloudflare Turnstile ─
        if (req.url && req.url.startsWith('/api/pollinations')) {
          const targetPath = req.url.replace('/api/pollinations', '');
          const targetUrl = `https://image.pollinations.ai${targetPath}`;

          try {
            console.log(`[Pollinations Proxy] GET ${targetUrl.substring(0, 110)}...`);
            const proxyRes = await fetch(targetUrl, {
              method: 'GET',
              headers: {
                'User-Agent': 'node-fetch/3.0 (server-side)',
              },
            });
            const buffer = Buffer.from(await proxyRes.arrayBuffer());
            if (proxyRes.ok) {
              console.log(`[Pollinations Proxy] ✅ ${proxyRes.status} — ${buffer.length} bytes`);
            } else {
              console.error(`[Pollinations Proxy] ❌ ${proxyRes.status}: ${buffer.toString('utf-8').substring(0, 200)}`);
            }
            res.statusCode = proxyRes.status;
            const ct = proxyRes.headers.get('content-type');
            if (ct) res.setHeader('Content-Type', ct);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(buffer);
          } catch (err) {
            console.error(`[Pollinations Proxy] Error:`, err.message);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // ── Gemini proxy — forwards to Google Generative Language API ───
        if (req.url && req.url.startsWith('/api/gemini')) {
          const targetPath = req.url.replace('/api/gemini', '');
          const targetUrl = `https://generativelanguage.googleapis.com${targetPath}`;

          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const body = Buffer.concat(chunks);

          try {
            console.log(`[Gemini Proxy] ${req.method} ${targetUrl.substring(0, 100)}...`);
            const proxyRes = await fetch(targetUrl, {
              method: req.method,
              headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
              },
              body: req.method !== 'GET' ? body : undefined,
            });
            const buffer = Buffer.from(await proxyRes.arrayBuffer());
            if (proxyRes.ok) {
              console.log(`[Gemini Proxy] ✅ ${proxyRes.status} — ${buffer.length} bytes`);
            } else {
              console.error(`[Gemini Proxy] ❌ ${proxyRes.status}: ${buffer.toString('utf-8').substring(0, 400)}`);
            }
            res.statusCode = proxyRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(buffer);
          } catch (err) {
            console.error(`[Gemini Proxy] Error:`, err.message);
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [proxyPlugin(), react(), tailwindcss()],
})
