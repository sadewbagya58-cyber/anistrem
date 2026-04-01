export async function onRequest({ request, params }) {
  const url = new URL(request.url);
  const proxyUrl = `https://api.amvstr.me/${params.path.join('/')}${url.search}`;
  
  const response = await fetch(proxyUrl, {
    headers: {
      ...Object.fromEntries(request.headers),
      'Referer': 'https://amvstrm.me/' // Required by amvstr
    },
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
