import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useAtom } from "jotai";
import { useNavigate } from "@remix-run/react";
import { PreviewCard } from "~/components/card/preview-card";
import { AddressForm } from "~/components/card/address-form";
import { showResultsAtom, walletAddressAtom } from "~/atoms/address";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = ({ location }) => {
  const title = "Create Your POAP Card - Showcase Your Collection | POAPin";
  const description = "Create a beautiful, shareable card showcasing your POAP collection. Enter your Ethereum address or ENS name to generate a personalized POAP card that highlights your digital memories.";
  const keywords = "POAP Card, POAP Collection, NFT Display, Ethereum, Web3, Digital Collectibles, POAP Gallery,POAP, Proof of Attendance Protocol";
  const canonicalUrl = "https://poap.in/card";
  
  return [
    // Basic meta tags
    { title: title },
    { description: description },
    { keywords: keywords },
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    
    // Canonical URL
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    
    // Open Graph tags for social sharing
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: "https://og.poap.in/api/poap/v/poap.eth" },
    
    // X Card tags
    { name: "x:card", content: "summary_large_image" },
    { name: "x:url", content: canonicalUrl },
    { name: "x:title", content: title },
    { name: "x:description", content: description },
    { name: "x:image", content: "https://og.poap.in/api/poap/v/poap.eth" },
    
    // Additional SEO tags
    { name: "robots", content: "index, follow" },
    { name: "author", content: "POAPin" },
  ];
};

export default function CardIndexPage() {
    const [isCardVisible, setIsCardVisible] = useState(true);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(false);
    const [, setWalletAddress] = useAtom(walletAddressAtom);
    const [, setShowResults] = useAtom(showResultsAtom);
    const navigate = useNavigate();
    
    // JSON-LD structured data for the POAP Card page
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Create Your POAP Card",
        "description": "Create a beautiful, shareable card showcasing your POAP collection",
        "url": "https://poap.in/card",
        "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "POAP Card Creator",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web",
            "isAccessibleForFree": true
        }
    };

    const handleGetStarted = () => {
        setIsCardVisible(false);
        setTimeout(() => setIsPlaceholderVisible(true), 500);
    };

    const handleAddressSubmit = (address: string) => {
        setWalletAddress(address);
        setShowResults(true);
        navigate(`/card/${address}`);
    };

    return (
        <div className="w-full mx-auto px-2 md:px-4 lg:px-8">
            {/* JSON-LD structured data */}
            <script 
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            <header className="sr-only">
                <h1>Create Your POAP Card</h1>
                <p>Generate a beautiful, shareable card showcasing your POAP collection</p>
            </header>
            
            <AnimatePresence>
                {isCardVisible && (
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="w-full max-w-2xl mx-auto px-4 pt-4 pb-8"
                    >
                        <PreviewCard onGetStarted={handleGetStarted} />
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="max-w-2xl w-full mx-auto border-x-1 md:border-x-2 lg:border-x-4 border-yellow-400 border-solid shadow-2xl">
                <AnimatePresence>
                    {isPlaceholderVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                            className="w-full mx-auto"
                        >
                            <div className="bg-neutral-50 p-8">
                                <h2 className="text-2xl font-bold text-center mb-6">Showcase your POAP collection</h2>
                                <AnimatePresence mode="wait">

                                    <AddressForm onSubmit={handleAddressSubmit} />

                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
