import * as QR from "qrcode";

Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        message: "Hello World",
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
      });
    }

    let errorCorrection = url.searchParams.get("errorCorrection") ?? "";
    if (!["L", "M", "Q", "H"].includes(errorCorrection)) errorCorrection = "M";

    const body = await request.text();

    const image = await QR.toBuffer(body, { errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H" });

    return new Response(image, {
      headers: {
        "content-type": "image/png",
      },
    });
  },
});
