const distRoot = new URL("./dist/", import.meta.url);

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".wav": "audio/wav"
};

function getContentType(pathname: string) {
  const extension = pathname.match(/\.[^.\/]+$/)?.[0].toLowerCase();
  return extension ? contentTypes[extension] ?? "application/octet-stream" : "application/octet-stream";
}

function toSafeFileUrl(pathname: string) {
  let decodedPathname: string;
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const normalizedPathname = decodedPathname === "/" ? "/index.html" : decodedPathname;
  const fileUrl = new URL(`.${normalizedPathname}`, distRoot);

  return fileUrl.href.startsWith(distRoot.href) ? fileUrl : null;
}

async function serveFile(pathname: string) {
  const fileUrl = toSafeFileUrl(pathname);
  if (!fileUrl) {
    return null;
  }

  try {
    const fileInfo = await Deno.stat(fileUrl);
    if (fileInfo.isDirectory) {
      return null;
    }

    return new Response(await Deno.readFile(fileUrl), {
      headers: {
        "content-type": getContentType(fileUrl.pathname)
      }
    });
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
}

function withoutBody(response: Response) {
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

Deno.serve(async (request) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        allow: "GET, HEAD"
      }
    });
  }

  const { pathname } = new URL(request.url);
  const response = await serveFile(pathname) ?? await serveFile("/index.html") ?? new Response("Not Found", { status: 404 });

  return request.method === "HEAD" ? withoutBody(response) : response;
});
