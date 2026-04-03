// Vite plugin that adds a server middleware to proxy Transak API calls
// This keeps the API secret on the server side only

import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvVars() {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const vars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      vars[key] = val;
    });
    return vars;
  } catch { return {}; }
}

export function transakProxy() {
  return {
    name: 'transak-proxy',
    configureServer(server) {
      const env = loadEnvVars();

      server.middlewares.use('/api/transak/widget-url', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;
        let params;
        try { params = JSON.parse(body); } catch { params = {}; }

        const API_KEY = env.VITE_TRANSAK_API_KEY;
        const API_SECRET = env.TRANSAK_API_SECRET;

        if (!API_KEY || !API_SECRET) {
          console.error('[Transak] Missing env vars. API_KEY:', !!API_KEY, 'API_SECRET:', !!API_SECRET);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Transak API key or secret not configured' }));
          return;
        }

        try {
          console.log('[Transak] Step 1: Getting access token...');

          // Step 1: Get access token
          const tokenRes = await fetch('https://api-stg.transak.com/partners/api/v2/refresh-token', {
            method: 'POST',
            headers: {
              'api-secret': API_SECRET,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ apiKey: API_KEY }),
          });

          const tokenData = await tokenRes.json();
          console.log('[Transak] Token response status:', tokenRes.status);

          if (!tokenData.data?.accessToken) {
            console.error('[Transak] Token error:', JSON.stringify(tokenData));
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Failed to get access token', details: tokenData }));
            return;
          }

          const accessToken = tokenData.data.accessToken;
          console.log('[Transak] Step 2: Creating widget URL...');

          // Step 2: Create widget URL with session
          const widgetParams = {
            apiKey: API_KEY,
            referrerDomain: 'localhost',
            defaultCryptoCurrency: 'USDC',
            network: 'polygon',
            walletAddress: params.walletAddress || '',
            fiatCurrency: 'INR',
            defaultFiatAmount: params.fiatAmount?.toString() || '830',
            themeColor: '6C5CE7',
            disableWalletAddressForm: true,
            productsAvailed: 'BUY',
          };

          const widgetRes = await fetch('https://api-gateway-stg.transak.com/api/v2/auth/session', {
            method: 'POST',
            headers: {
              'access-token': accessToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ widgetParams }),
          });

          const widgetData = await widgetRes.json();
          console.log('[Transak] Widget response status:', widgetRes.status);

          if (widgetData.data?.widgetUrl) {
            console.log('[Transak] ✓ Widget URL generated successfully');
          } else {
            console.error('[Transak] Widget error:', JSON.stringify(widgetData));
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: !!widgetData.data?.widgetUrl,
            widgetUrl: widgetData.data?.widgetUrl || null,
            error: widgetData.data?.widgetUrl ? null : (widgetData.message || 'Unknown error'),
            raw: widgetData,
          }));
        } catch (err) {
          console.error('[Transak] Proxy error:', err.message);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
