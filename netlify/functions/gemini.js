// netlify/functions/gemini.js
// Proxies Gemini model requests to https://generativelanguage.googleapis.com

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
  if (path.startsWith('/api/gemini')) {
    path = path.replace('/api/gemini', '');
  } else if (path.startsWith('/.netlify/functions/gemini')) {
    path = path.replace('/.netlify/functions/gemini', '');
  }

  // Reconstruct the query string if any was provided in the incoming request
  let queryString = '';
  if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
    const params = new URLSearchParams(event.queryStringParameters);
    queryString = `?${params.toString()}`;
  }

  const targetUrl = `https://generativelanguage.googleapis.com${path}${queryString}`;

  try {
    // 3. Reconstruct request headers
    const headers = {
      'Content-Type': event.headers['content-type'] || 'application/json',
    };
    
    // Forward auth header if present
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

    console.log(`[Netlify Gemini Proxy] Forwarding to: ${targetUrl.split('?')[0]}...`);
    const response = await fetch(targetUrl, options);
    
    // 5. Read response as binary buffer
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/json';

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
    console.error(`[Netlify Gemini Proxy] Error:`, err.message);
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
