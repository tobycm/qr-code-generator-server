import { existsSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import * as QR from "qrcode";

const tempFolder = tmpdir() + "/qr-code-generator-server/";
if (!existsSync(tempFolder)) mkdirSync(tempFolder);

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

    if (url.pathname !== "/qr") {
      return new Response("Not found", {
        status: 404,
      });
    }

    const format = url.searchParams.get("format") ?? "png";
    if (!["png", "svg", "utf8"].includes(format)) {
      return new Response("Invalid format", {
        status: 400,
      });
    }

    const margin = url.searchParams.get("margin") ?? "4";
    if (!margin || isNaN(parseInt(margin))) {
      return new Response("Invalid margin", {
        status: 400,
      });
    }

    const errorCorrection = url.searchParams.get("errorCorrection") ?? undefined;
    if (![undefined, "L", "M", "Q", "H"].includes(errorCorrection)) {
      return new Response("Invalid error correction", {
        status: 400,
      });
    }

    const scale = url.searchParams.get("scale") ?? "4";
    if (!scale || isNaN(parseInt(scale))) {
      return new Response("Invalid scale", {
        status: 400,
      });
    }

    const width = url.searchParams.get("width") ?? undefined;
    if (width && isNaN(parseInt(width))) {
      return new Response("Invalid width", {
        status: 400,
      });
    }

    const background = url.searchParams.get("background") ?? undefined;
    if (background && !/^#[0-9A-F]{8}$/i.test(background)) {
      return new Response("Invalid background", {
        status: 400,
      });
    }

    const foreground = url.searchParams.get("foreground") ?? undefined;
    if (foreground && !/^#[0-9A-F]{8}$/i.test(foreground)) {
      return new Response("Invalid foreground", {
        status: 400,
      });
    }

    const body = await request.text();

    const imageFile = `${tempFolder}${Date.now()}.${format}`;

    await QR.toFile(imageFile, body, {
      errorCorrectionLevel: errorCorrection as "L" | "M" | "Q" | "H",
      type: format as "png" | "svg" | "utf8",
      margin: parseInt(margin),
      scale: parseInt(scale),
      width: width ? parseInt(width) : undefined,
      color: {
        dark: foreground,
        light: background,
      },
    });

    const file = Bun.file(imageFile);

    return new Response(file, {
      headers: {
        "content-type": format === "utf8" ? "text/plain" : `image/${format}`,
      },
    });
  },
});
