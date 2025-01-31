import { Button, Card, Image, ScrollShadow } from "@heroui/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "~/src/cn";

interface PreviewImageCardProps {
    title: string;
    description: string;
    address?: string;
    imageUrl: string;
    altText: string;
    ogEnabled?: boolean;
}

export function PreviewImageCard({ title, description, address, imageUrl, altText, ogEnabled }: PreviewImageCardProps) {
    const [isShareExpanded, setIsShareExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState<'markdown' | 'html' | 'og' | null>(null);

    const markdownCode = `![${altText}](${imageUrl})`;
    const htmlCode = `<img src="${imageUrl}" alt="${altText}" />`;
    const ogCode = `https://poap.in/v/${address}`;

    const handleCopy = async (text: string, type: 'markdown' | 'html' | 'og') => {
        await navigator.clipboard.writeText(text);
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    return (
        <Card
            className="relative overflow-hidden bg-white"
            radius="lg"
            shadow="sm"
        >
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex-grow mr-4">
                        <p className="text-gray-900 font-medium">{title}</p>
                        <p className="text-gray-500 text-sm mt-1">{description}</p>
                    </div>
                    <Button
                        isIconOnly
                        variant="light"
                        className="text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-200"
                        onPress={() => setIsShareExpanded(!isShareExpanded)}
                        aria-label={isShareExpanded ? "Close Share" : "Share"}
                    >
                        <Icon
                            icon="mingcute:share-forward-fill"
                            width="24"
                            height="24"
                            className={cn(
                                "transition-all duration-200",
                                isShareExpanded ? "rotate-[-90deg]" : "",
                                isShareExpanded ? "scale-110" : "",
                            )}
                        />

                    </Button>
                </div>
                <AnimatePresence>
                    {isShareExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 space-y-3"
                        >
                            <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0">
                                        <Icon
                                            icon="teenyicons:markdown-solid"
                                            width="24"
                                            height="24"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <ScrollShadow
                                            hideScrollBar
                                            orientation="horizontal">
                                            <code className="font-mono text-sm text-gray-600 whitespace-nowrap">
                                                {markdownCode}
                                            </code>
                                        </ScrollShadow>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-gray-500"
                                            onPress={() => handleCopy(markdownCode, 'markdown')}
                                            aria-label="Copy markdown"
                                        >
                                            <Icon
                                                icon={copySuccess === 'markdown' ? "mingcute:check-fill" : "mingcute:copy-2-fill"}
                                                width="20"
                                                height="20"
                                            />
                                        </Button>
                                    </div>

                                </div>
                                <p className="text-xs text-gray-400 mt-2">GitHub README or any place that supports markdown format</p>
                            </div>
                            <div className="flex flex-col bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0">
                                        <Icon
                                            icon="heroicons-solid:code"
                                            width="24"
                                            height="24"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <ScrollShadow
                                            hideScrollBar
                                            orientation="horizontal">
                                            <code className="font-mono text-sm text-gray-600 whitespace-nowrap">
                                                {htmlCode}
                                            </code>
                                        </ScrollShadow>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-gray-500"
                                            onPress={() => handleCopy(htmlCode, 'html')}
                                            aria-label="Copy HTML"
                                        >
                                            <Icon
                                                icon={copySuccess === 'html' ? "mingcute:check-fill" : "mingcute:copy-2-fill"}
                                                width="20"
                                                height="20"
                                            />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Anywhere that supports HTML code</p>
                            </div>
                            {ogEnabled && (<div className="flex flex-col bg-gray-50 p-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="flex-shrink-0">
                                        <Icon
                                            icon="garden:image-fill-12"
                                            width="24"
                                            height="24"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <ScrollShadow
                                            hideScrollBar
                                            orientation="horizontal">
                                            <code className="font-mono text-sm text-gray-600 whitespace-nowrap">
                                                {ogCode}
                                            </code>
                                        </ScrollShadow>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-gray-500"
                                            onPress={() => handleCopy(ogCode, 'og')}
                                            aria-label="Copy HTML"
                                        >
                                            <Icon
                                                icon={copySuccess === 'og' ? "mingcute:check-fill" : "mingcute:copy-2-fill"}
                                                width="20"
                                                height="20"
                                            />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Anywhere that supports webpage previews, such as Warpcast, X, Telegram, Facebook, Instagram, etc.</p>
                            </div>)}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <Image
                src={imageUrl}
                radius="none"
                alt={altText}
                classNames={{
                    wrapper: "w-full aspect-[1200/630]",
                    img: "object-cover w-full h-full"
                }}
            />
        </Card>
    );
}
