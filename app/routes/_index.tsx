import { MetaFunction } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => {
  return [
    { title: "POAPin" },
    { description: "POAPin helps you organize and share POAPs - the bookmarks of your life." },
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ];
};

export default function Index() {
  return (
    <div
      className=
      "h-screen w-full"
    >
    </div>
  );
}
