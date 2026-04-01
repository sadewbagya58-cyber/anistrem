export async function onRequest({ request, params }) {
  const url = new URL(request.url);
  const proxyUrl = `https://api.malsync.moe/${params.path.join('/')}${url.search}`;
  
  const response = await fetch(proxyUrl, {
    headers: request.headers,
    method: request.method,
    body: request.body
  });

  const body = await response.arrayBuffer();
  return new Response(body, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      'Access-Control-Allow-Origin': '*'
    }
  });
}
