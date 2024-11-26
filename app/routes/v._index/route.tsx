import { MetaFunction } from "@remix-run/cloudflare";
import {  useRef } from "react";
import AddressInputComponent from "~/components/poap/address-input";

export const meta: MetaFunction = () => {
    return [
        { title: "POAPin Explorer" },
        { description: "POAPin helps you organize and share POAPs - the bookmarks of your life." },
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
    ];
};

export default function ExplorerPage() {
    const inputWrapperRef = useRef<HTMLDivElement>(null);

    return (
        <div className="min-h-screen w-full flex flex-col">
            <section className="max-w-lg mx-auto relative px-2 xs:px-8 flex-grow md:flex flex-col justify-center md:justify-start md:pt-16">
                <div className="md:pb-12">
                    <AddressInputComponent isClearable />
                </div>
            </section>
            <div className="flex-grow"></div>
        </div>
    );
}