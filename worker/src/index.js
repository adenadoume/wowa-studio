function corsHeaders(origin, allowedOrigins) {
  const isAllowed =
    allowedOrigins.includes(origin) ||
    /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
    /^https:\/\/([a-z0-9-]+\.)?wowa-studio\.pages\.dev$/.test(origin);
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigins = env.ALLOWED_ORIGINS.split(",");
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, allowedOrigins);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/api/images" && request.method === "GET") {
      const listed = await env.IMAGES_BUCKET.list();
      const images = listed.objects
        .filter((obj) => /\.(jpe?g|png|webp)$/i.test(obj.key))
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((obj) => ({
          key: obj.key,
          url: `${url.origin}/img/${obj.key}`,
        }));

      return new Response(JSON.stringify({ images }), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
          ...cors,
        },
      });
    }

    if (url.pathname.startsWith("/img/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.slice("/img/".length));
      const object = await env.IMAGES_BUCKET.get(key);

      if (!object) {
        return new Response("Not found", { status: 404, headers: cors });
      }

      const headers = new Headers(cors);
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(object.body, { headers });
    }

    return new Response("Not found", { status: 404, headers: cors });
  },
};
