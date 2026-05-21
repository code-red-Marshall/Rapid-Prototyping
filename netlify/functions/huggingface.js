// netlify/functions/huggingface.js
// Proxies FLUX image generation requests to https://router.huggingface.co/hf-inference
// Handles binary responses (images) by encoding them in base64.

exports.handler = async function(event, context) {
  // 1. Handle CORS Preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  // 2. Extract target path
  let path = event.path;
  if (path.startsWith('/api/huggingface')) {
    path = path.replace('/api/huggingface', '');
  } else if (path.startsWith('/.netlify/functions/huggingface')) {
    path = path.replace('/.netlify/functions/huggingface', '');
  }

  const targetUrl = `https://router.huggingface.co/hf-inference${path}`;

  try {
    // 3. Reconstruct request headers
    const headers = {
      'Content-Type': event.headers['content-type'] || 'application/json',
    };
    
    // Forward the authorization header supplied by the client
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const options = {
      method: event.httpMethod,
      headers,
    };

    // 4. Handle request body for POST/PUT requests
    if (event.httpMethod !== 'GET' && event.body) {
      options.body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : event.body;
    }

    console.log(`[Netlify HF Proxy] Forwarding to: ${targetUrl}`);
    const response = await fetch(targetUrl, options);
    
    // 5. Read response as binary buffer
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // 6. Return response to the client
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: Buffer.from(buffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error(`[Netlify HF Proxy] Error:`, err.message);
    return {
      statusCode: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: `Proxy Error: ${err.message}` }),
    };
  }
};
