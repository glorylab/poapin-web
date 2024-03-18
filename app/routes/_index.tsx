import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";
import sharedStylesHref from "~/styles/shared.css";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: sharedStylesHref },
];

export default function Index() {
  return (
    <div
      className=
      "absolute inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]"
    >
    </div>
  );
}
