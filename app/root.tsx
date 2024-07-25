import baseStylesHref from "~/tailwind.css";
import sharedStylesHref from "~/styles/shared.css";
import { useAtom } from "jotai";
import type { LinksFunction, LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { cssBundleHref } from "@remix-run/css-bundle";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { NextUIProvider } from "@nextui-org/react";
import FooterComponent from "./components/global/footer";
import { useEffect, useRef } from "react";
import * as gtag from "~/utils/gtags.client";
import { getEnv } from "~/src/env";
import NavBarComponent from "./components/global/navbar";
import footerPositionAtom from "./atoms/footer-position-atom";

interface LoaderData {
  gaTrackingId: string;
}

export const loader: LoaderFunction = async ({ context }) => {
  const data: LoaderData = {
    gaTrackingId: getEnv({ context }).gaTrackingId,
  };
  return json(data);
};

export const meta: MetaFunction = () => (
  [
    { title: "POAPin" },
    { description: "POAPin helps you organize and share POAPs - the bookmarks of your life." },
  ]
);


export const links: LinksFunction = () => [
  { rel: "stylesheet", href: baseStylesHref, "data-inline": true },
  { rel: "stylesheet", href: sharedStylesHref, "data-inline": true },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#5bbad5" },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {

  const location = useLocation();
  const footerRef = useRef<HTMLElement>(null);
  const [, setFooterPosition] = useAtom(footerPositionAtom);
  const { gaTrackingId } = useLoaderData() as { gaTrackingId: string };

  useEffect(() => {
    if (gaTrackingId?.length) {
      gtag.pageview(location.pathname, gaTrackingId);
    }
  }, [location, gaTrackingId]);

  useEffect(() => {
    const updateFooterPosition = () => {
      if (footerRef.current) {
        setFooterPosition(footerRef.current.getBoundingClientRect().top);
      }
    };

    updateFooterPosition();
    window.addEventListener("resize", updateFooterPosition);
    return () => {
      window.removeEventListener("resize", updateFooterPosition);
    };
  }, [setFooterPosition]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
        <Meta />
        <Links />
      </head>
      <body>
        {process.env.NODE_ENV === "development" || !gaTrackingId ? null : (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
            />
            <script
              async
              id="gtag-init"
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${gaTrackingId}', {
                  page_path: window.location.pathname,
                });
              `,
              }}
            />
          </>
        )}
        <NextUIProvider className="bg-background">
          <NavBarComponent />
          <main className="dot-background">
            <Outlet />
          </main>
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
          <footer ref={footerRef}>
            <FooterComponent />
          </footer>
        </NextUIProvider>
        {/* Cloudflare Web Analytics */}
        <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "5387257fc59043ac86fa9cc73eb33541"}'></script>
      </body>
    </html>
  );
}
