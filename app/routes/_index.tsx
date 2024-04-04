import { MetaFunction } from "@remix-run/cloudflare";
import AddressInputComponent from "~/components/poap/address-input";

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

      <section
        className="max-w-md mx-auto relative pb-8 pt-4 lg:pt-16 lg:pb-12 px-2 xs:px-8"
      >
        <div className="">
          <AddressInputComponent />
        </div>

      </section>
    </div>
  );
}
