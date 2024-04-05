import { Link, Spacer } from "@nextui-org/react";
import type { IconProps } from "@iconify/react";
import { Icon } from "@iconify/react";

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
        href: "https://twitter.com/glorylaboratory",
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
        <div className="flex w-full flex-col border-t-1 border-neutral-300 z-0">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-12 lg:px-8">
                <div className="flex items-center justify-center">
                    <span className="text-medium text-default font-medium">POAP.in</span>
                </div>
                <Spacer y={4} />
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                    {navLinks.map((item) => (
                        <Link
                            key={item.name}
                            isExternal
                            className="text-default-500"
                            href={item.href}
                            size="sm"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
                <Spacer y={6} />
                <div className="flex justify-center gap-x-4">
                    {socialItems.map((item) => (
                        <Link key={item.name} target="_self" className="text-default-400" href={item.href}>
                            <span className="sr-only">{item.name}</span>
                            <item.icon aria-hidden="true" className="w-5" />
                        </Link>
                    ))}
                </div>
                <Spacer y={4} />
                <p className="mt-1 text-center text-small text-default-400">
                    &copy; 2022 - {new Date().getFullYear()} Glory Lab. All rights reserved.
                </p>
            </div>
        </div>
    );
}