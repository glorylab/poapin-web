import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { useNavigate, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/cloudflare";
import { Icon } from "@iconify/react";
import { AnimatedPoapCards } from "~/components/card/animated-poap-cards";
import { AddressForm } from "~/components/card/address-form";
import { showResultsAtom, walletAddressAtom } from "~/atoms/address";
import { PlausibleEvents } from '~/utils/usePlausible';
import { getCardData, generateCardImageUrl, getDefaultDescription } from "~/lib/card";
import type { MetaFunction } from "@remix-run/node";
import type { CardResponse, PoapCard } from "~/types/card";

export const loader: LoaderFunction = async ({ context }) => {
  try {
    const cardData = await getCardData(context);
    return json({ data: cardData });
  } catch (error) {
    console.error('Error fetching card data:', error);
    // Return fallback data structure instead of error to prevent crashes
    return json({ 
      data: {
        card: {
          id: 1,
          intro_title: "Create Your POAP Card",
          intro_description: "Generate a beautiful, shareable card showcasing your POAP collection",
          highlights: []
        },
        highlights: []
      },
      error: "Failed to fetch card data - using fallback" 
    });
  }
};

export const meta: MetaFunction = ({ data }) => {
  const cardData = data as CardResponse;
  const title = cardData?.data?.card.intro_title || "Create Your POAP Card - Showcase Your Collection | POAPin";
  const description = cardData?.data?.card.intro_description || "Create a beautiful, shareable card showcasing your POAP collection. Enter your Ethereum address or ENS name to generate a personalized POAP card that highlights your digital memories.";

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
    
    // X-Robots-Tag
    { "http-equiv": "X-Robots-Tag", content: "index, follow" },
  ];
};



export default function CardIndexPage() {
    const { data: cardData, error } = useLoaderData<CardResponse>();
    const [isCardVisible, setIsCardVisible] = useState(true);
    const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(false);
    const [, setWalletAddress] = useAtom(walletAddressAtom);
    const [, setShowResults] = useAtom(showResultsAtom);
    const navigate = useNavigate();
    
    // Fallback data in case Directus fails
    const fallbackCards: PoapCard[] = [
        {
            title: "Your Latest POAP Collection",
            description: "Generate a beautiful card to showcase your POAP collection. Anytime, Anywhere.",
            address: "poap.eth",
            src: "https://og.poap.in/api/poap/v/poap.eth/letter"
        },
        {
            title: "Showcase Your Digital Memories",
            description: "Create stunning visual cards that highlight your participation in Web3 events and communities.",
            address: "glorylab.eth",
            src: "https://og.poap.in/api/poap/v/glorylab.eth"
        },
        {
            title: "Curated Gallery Experience",
            description: "Present your most meaningful POAPs in a carefully curated gallery that reflects your unique journey.",
            address: "vitalik.eth",
            src: "https://og.poap.in/api/poap/v/vitalik.eth/gallery"
        }
    ];
    
    // Transform Directus data to PoapCard format, with fallback
    const transformedCards: PoapCard[] = cardData?.highlights?.map(highlight => ({
        title: getCardTitle(highlight.theme, highlight.address),
        description: highlight.description || getDefaultDescription(highlight.address, highlight.theme),
        address: highlight.address,
        src: generateCardImageUrl(highlight.address, highlight.theme)
    })) || fallbackCards;
    
    // Helper function to generate titles based on theme
    function getCardTitle(theme: string, address: string): string {
        const titles = {
            letter: `Memories in Vintage Letters`,
            gallery: `Clear at a glance`,
            gitpoap: `Proof of Contribution`,
            default: `Do you like cherry blossoms?`
        };
        return titles[theme as keyof typeof titles] || titles.default;
    }
    
    // Track page visit on mount
    useEffect(() => {
        PlausibleEvents.trackCardPageVisit();
    }, []);
    
    // Handle error state
    if (error) {
        console.error('Card data error:', error);
        // Use fallback data when there's an error
    }
    
    // JSON-LD structured data for the POAP Card page
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": cardData?.card.intro_title || "Create Your POAP Card",
        "description": cardData?.card.intro_description || "Create a beautiful, shareable card showcasing your POAP collection",
        "url": "https://poap.in/card",
        "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "POAP Card Creator",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Web",
            "isAccessibleForFree": true,
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            }
        }
    };

    const handleGetStarted = () => {
        // Track get started action
        PlausibleEvents.trackCardGetStarted();
        
        setIsCardVisible(false);
        setTimeout(() => setIsPlaceholderVisible(true), 500);
    };

    const handleAddressSubmit = (address: string) => {
        // Determine address type for tracking
        const addressType = address.endsWith('.eth') ? 'ens' : 
                           address.startsWith('0x') && address.length === 42 ? 'ethereum' : 'unknown';
        
        // Track address submission
        PlausibleEvents.trackCardAddressSubmitted(address, addressType);
        
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
            
            <header className="text-center p-4">
                <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">{cardData?.card.intro_title || "Create Your POAP Card"}</h1>
                <p className="text-lg text-primary max-w-2xl mx-auto">{cardData?.card.intro_description || "Generate a beautiful, shareable card showcasing your POAP collection"}</p>
            </header>
            
            <AnimatePresence>
                {isCardVisible && (
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
                        className="w-full mx-auto pt-4 pb-8"
                    >
                        <AnimatedPoapCards cards={transformedCards} onGetStarted={handleGetStarted} />
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
                                <h3 className="text-2xl font-bold text-center mb-6">Showcase your POAP collection</h3>
                                <AnimatePresence mode="wait">

                                    <AddressForm onSubmit={handleAddressSubmit} />

                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Coming Soon: POAP Card Canvas */}
            <section className="max-w-4xl mx-auto mt-16 mb-12 px-4">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 shadow-xl">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
                    
                    <div className="relative z-10 p-8 md:p-12">
                        {/* Coming Soon Badge */}
                        <div className="flex justify-center mb-6">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-semibold text-sm border border-purple-300">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Coming Soon
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-3xl md:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
                            POAP Card Canvas
                        </h2>
                        
                        {/* Subtitle */}
                        <p className="text-center text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                            Extremely Personalized Card Generator
                        </p>

                        {/* Description */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-purple-100">
                            <p className="text-gray-700 leading-relaxed text-center">
                                Showcase custom POAP collections, display comprehensive statistics and aggregated analytics, <strong className="text-purple-600">all in a single image</strong>, with pure data API support!
                            </p>
                        </div>

                        {/* Feature highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100 text-center">
                                <div className="flex justify-center mb-2">
                                    <Icon icon="mingcute:paint-brush-ai-fill" width="48" height="48" className="text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-1">Custom Collections</h3>
                                <p className="text-sm text-gray-600">Curate your POAPs and Collections</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100 text-center">
                                <div className="flex justify-center mb-2">
                                    <Icon icon="streamline-ultimate:analytics-board-graph-line-bold" width="48" height="48" className="text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-1">Statistics & Analytics</h3>
                                <p className="text-sm text-gray-600">Visualize data insights at a glance</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100 text-center">
                                <div className="flex justify-center mb-2">
                                    <Icon icon="icon-park-solid:api" width="48" height="48" className="text-indigo-600" />
                                </div>
                                <h3 className="font-semibold text-gray-800 mb-1">Pure Data API</h3>
                                <p className="text-sm text-gray-600">Developer-friendly interface</p>
                            </div>
                        </div>

                        {/* Call to action */}
                        <div className="text-center">
                            <p className="text-sm text-gray-500 italic">
                                ✨ Stay tuned for more exciting features...
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
