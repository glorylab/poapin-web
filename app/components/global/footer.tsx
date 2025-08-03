import { Spacer } from "@heroui/react";
import type { IconProps } from "@iconify/react";
import { Icon } from "@iconify/react";
import { Link } from "@remix-run/react";

type SocialIconProps = Omit<IconProps, "icon">;

const navLinks = [
    {
        name: "Home",
        href: "/",
    },
    {
        name: "Explorer",
        href: "/v",
    },
    {
        name: "Card",
        href: "/card",
    },
    {
        name: "Sponsors",
        href: "/sponsors",
    },
    {
        name: "Contact",
        href: "/contact",
    },
];

const socialItems = [
    {
        name: "Twitter",
        href: "https://x.com/glorylaboratory",
        icon: (props: SocialIconProps) => <Icon {...props} icon="fontisto:twitter" />,
    },
    {
        name: "GitHub",
        href: "https://github.com/glorylab/POAPin",
        icon: (props: SocialIconProps) => <Icon {...props} icon="fontisto:github" />,
    },
];

export default function FooterComponent() {
    return (
        <div className="flex w-full flex-col border-t-1 border-neutral-300">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-12 lg:px-8">

                <Link to="https://poap.xyz" target="_blank" title="POAP - Proof of Attendance Protocol">
                    <div className="flex items-center justify-center rounded-md bg-white border-1 border-[#5C5AA0] px-4 py-2 shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <img src="/images/logo_poap.svg" alt="POAP Logo" className="h-8 w-8 mr-2" />
                        <div className="flex flex-col">
                            <span className="text-xs text-[#5C5AA0]">Powered by</span>
                            <span className="text-xl font-bold text-[#5C5AA0]">POAP</span>
                        </div>
                    </div>
                </Link>
                <Spacer y={2} />
                <div className="flex items-center justify-center">
                    <span className="text-medium text-default font-medium">POAP.in</span>
                </div>
                <Spacer y={4} />
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                    {navLinks.map((item) => (
                        <Link
                            key={item.name}
                            className="text-default-500"
                            to={item.href}
                            title={`${item.name} - POAPin`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
                <Spacer y={6} />
                <div className="flex justify-center gap-x-4">
                    {socialItems.map((item) => (
                        <Link
                            key={item.name}
                            className="text-default-400" to={item.href}
                            target="_blank"
                            title={`${item.name} - POAPin Social Media`}>
                            <span className="sr-only">{item.name}</span>
                            <item.icon aria-hidden="true" className="w-5" />
                        </Link>
                    ))}
                </div>
                <Spacer y={4} />
                <p className="mt-1 text-center text-small text-default-400">
                    &copy; 2021 - {new Date().getFullYear()} <Link to={"https://glorylab.xyz"} target="_blank">Glory Lab</Link>. All rights reserved.
                </p>
            </div>
        </div>
    );
}