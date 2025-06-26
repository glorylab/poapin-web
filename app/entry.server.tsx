import type { AppLoadContext, EntryContext } from "@remix-run/cloudflare";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

function Document({
  children,
  isProd,
}: {
  children: React.ReactNode;
  isProd: boolean;
}) {
  return (
    <html lang="en">
      <head>
        {isProd && (
          <>
            <script
              defer
              data-domain="poap.in"
              src="https://insights.glorylab.xyz/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
window.plausible = window.plausible || function () {
  (window.plausible.q = window.plausible.q || []).push(arguments)
}`
              }}
            />
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  const env = loadContext.cloudflare.env as Record<string, string>;
  const isProd = env.ENVIRONMENT === "production";

  const body = await renderToReadableStream(
    <Document isProd={isProd}>
      <RemixServer context={remixContext} url={request.url} />
    </Document>,
    {
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    }
  );

  if (isbot(request.headers.get("user-agent") || "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
