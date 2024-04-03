import baseStylesHref from "~/tailwind.css";
import sharedStylesHref from "~/styles/shared.css";
import type { LinksFunction } from "@remix-run/cloudflare";
import { cssBundleHref } from "@remix-run/css-bundle";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { NextUIProvider } from "@nextui-org/react";
import FooterComponent from "./components/global/footer";


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: baseStylesHref },
  { rel: "stylesheet", href: sharedStylesHref },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#5bbad5" },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];



export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <NextUIProvider className="bg-background">
          <main className="dot-background">
            <Outlet />
          </main>
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
          <FooterComponent />
        </NextUIProvider>
      </body>
    </html>
  );
}
