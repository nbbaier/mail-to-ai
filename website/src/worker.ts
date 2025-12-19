export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        name: "Mail-to-AI",
        version: "1.0.0",
      });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
