import { useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { Link } from "@remix-run/react";

export default function FloatingBanner() {
    const [showBanner, setShowBanner] = useState(true);

    const handleCloseBanner = () => {
        setShowBanner(false);
    };

    if (!showBanner) {
        return null;
    }

    return (
        <div className="pointer-events-none z-50 fixed inset-x-0 bottom-20 w-full px-2 pb-2 sm:flex sm:justify-center sm:px-4 sm:pb-4 lg:px-8 font-serif">
            <div className="pointer-events-auto bg-secondary-600 flex items-center gap-x-3 rounded-large border-1 border-divider bg-gradient-to-r from-secondary-200 via-secondary-100 to-secondary-300 px-6 py-2 sm:px-3.5">
                <div className="flex w-full items-center gap-x-3">
                    <p className="text-small text-foreground">
                        <Link className="text-inherit" to="https://explorer.gitcoin.co/#/round/42161/25/53" target="_blank">
                            POAPin is participating in Gitcoin GG20, every friend's support matters!&nbsp;
                        </Link>
                    </p>
                    <Button
                        as={Link}
                        className="group relative h-9 overflow-hidden bg-transparent text-small font-normal font-mono"
                        color="default"
                        endContent={
                            <Icon
                                className="flex-none outline-none transition-transform group-data-[hover=true]:translate-x-0.5 [&>path]:stroke-[2]"
                                icon="solar:arrow-right-linear"
                                width={16}
                            />
                        }
                        href="https://explorer.gitcoin.co/#/round/42161/25/53"
                        target="_blank"
                        style={{
                            border: "solid 2px transparent",
                            backgroundImage: `linear-gradient(hsl(var(--heroui-danger-50)), hsl(var(--heroui-danger-50))), linear-gradient(to right, #F871A0, #9353D3)`,
                            backgroundOrigin: "border-box",
                            backgroundClip: "padding-box, border-box",
                        }}
                        variant="bordered"
                    >
                        👀
                    </Button>
                </div>
                <div className="flex flex-1 justify-end">
                    <Button
                        onClick={handleCloseBanner}
                        isIconOnly
                        aria-label="Close Banner"
                        className="-m-1"
                        size="sm"
                        variant="light"
                    >
                        <Icon aria-hidden="true" className="text-secondary-700" icon="lucide:x" width={20} />
                    </Button>
                </div>
            </div>
        </div>
    );
}