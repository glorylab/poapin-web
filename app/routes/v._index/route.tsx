import { MetaFunction } from "@remix-run/cloudflare";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import footerPositionAtom from "~/atoms/footer-position-atom";
import AddressInputComponent from "~/components/poap/address-input";

export default function ExplorePage() {
    const [footerPosition] = useAtom(footerPositionAtom);
    const inputWrapperRef = useRef<HTMLDivElement>(null);

    const [isFooterVisible, setIsFooterVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const viewportHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            setIsFooterVisible(documentHeight - footerPosition >= documentHeight - scrollTop - viewportHeight);
        };

        handleScroll();

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [footerPosition]);

    return (
        <div className="min-h-[2600px] w-full flex flex-col">
            <section className="hidden max-w-lg mx-auto relative px-2 xs:px-8 flex-grow md:flex flex-col justify-center md:justify-start md:pt-16">
                <div className="md:pb-12">
                    <AddressInputComponent isClearable />
                </div>
            </section>
            <div className="flex-grow"></div>
            <div
                ref={inputWrapperRef}
                className="md:hidden p-4 flex flex-col justify-center items-center w-full transition-all duration-300"
                style={{
                    position: isFooterVisible ? 'relative' : 'fixed',
                    bottom: isFooterVisible ? undefined : 0,
                }}
            >
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-secondary-100 to-transparent backdrop-filter backdrop-blur-lg z-0"></div>
                <div className="w-full max-w-md z-10">
                    <AddressInputComponent isClearable />
                </div>
            </div>
        </div>
    );
}