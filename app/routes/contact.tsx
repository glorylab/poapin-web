import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "@remix-run/react";
import { MetaFunction } from "@remix-run/cloudflare";
import { MagicCard } from "~/components/shared/magic-card";

export const meta: MetaFunction = () => {
    const metaTitle = "Contact POAPin | POAPin";
    const metaDescription = "Connect with Glory Lab, the development team behind POAPin. Reach out to us on Farcaster and Twitter for questions, feedback, or collaboration opportunities.";
    const metaKeywords = "POAPin, Glory Lab, contact, social media, Farcaster, X (Twitter), POAP, Proof of Attendance Protocol, connect, feedback, development team";
    const canonicalUrl = "https://poap.in/contact";
    const metaImage = "https://og.poap.in/api/poap/v/glorylab.eth";

    return [
        { title: metaTitle },
        { description: metaDescription },
        { keywords: metaKeywords },
        { property: "og:title", content: metaTitle },
        { property: "og:description", content: metaDescription },
        { property: "og:image", content: metaImage },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "POAPin" },
        { name: "X:card", content: "summary_large_image" },
        { name: "X:title", content: metaTitle },
        { name: "X:description", content: metaDescription },
        { name: "X:image", content: metaImage },
        { rel: "canonical", href: canonicalUrl },
    ];
};

export default function ContactPage() {
    // JSON-LD structured data
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contact POAPin",
        "description": "Connect with Glory Lab, the development team behind POAPin.",
        "url": "https://poap.in/contact",
        "mainEntity": {
            "@type": "Organization",
            "name": "Glory Lab",
            "description": "Development team behind POAPin",
            "url": "https://poap.in",
            "logo": "https://poap.in/favicon.ico",
            "sameAs": [
                "https://warpcast.com/glorylab.eth",
                "https://x.com/glorylaboratory"
            ]
        }
    };

    return (
        <main className="w-full max-w-4xl mx-auto px-4 py-8">
            {/* JSON-LD structured data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            <header className="mb-8 text-center rounded-lg bg-white/10 backdrop-blur-sm p-4">
                <h1 className="text-3xl font-bold text-primary mb-2">Contact Us</h1>
                <p className="text-primary mb-1">POAPin — Crafted with ❤️ by <b>Glory Lab</b></p>
                <p className="text-primary/80">Connect with us on your favorite platforms</p>
            </header>

            <section 
                className="flex max-w-xl w-full flex-col gap-4 h-48 lg:h-56 lg:flex-row justify-center items-center mx-auto"
                aria-label="Glory Lab social media links"
            >
                <MagicCard
                    className="transition-all group cursor-pointer flex-col items-center justify-center hover:shadow-2xl active:shadow-md whitespace-nowrap text-4xl"
                    gradientColor={"#9C00FF55"}
                    bgColor="bg-[#8465cb]"
                    textColor="text-[#f0f0f0]"
                    border="border-[#9C00FF] border-2 border-solid border-opacity-10 hover:border-opacity-0 transition-all"
                >
                    <Link
                        className="w-full h-full flex flex-col items-center justify-center"
                        to="https://warpcast.com/glorylab.eth" 
                        target="_blank" 
                        rel="noopener"
                        aria-label="Follow Glory Lab (POAPin developers) on Farcaster"
                    >
                        <div className="flex flex-row justify-center items-center gap-4 group-hover:translate-x-1 lg:group-hover:translate-y-1 transition-all">
                            <Icon
                                icon="simple-icons:farcaster"
                                width="2rem"
                                height="2rem"
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-200"
                                aria-hidden="true"
                            />
                            <span
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-400"
                            >Farcaster
                            </span>
                        </div>
                    </Link>
                </MagicCard>

                <MagicCard
                    className="transition-all group cursor-pointer flex-col items-center justify-center hover:shadow-2xl active:shadow-md whitespace-nowrap text-4xl"
                    gradientColor={"#00000055"}
                    bgColor="bg-[#101419]"
                    textColor="text-[#f0f0f0]"
                    border="border-[#000000] border-2 border-solid border-opacity-10 hover:border-opacity-0 transition-all"
                >
                    <Link
                        className="w-full h-full flex flex-col items-center justify-center"
                        to="https://x.com/glorylaboratory" 
                        target="_blank" 
                        rel="noopener"
                        aria-label="Follow Glory Lab (POAPin developers) on Twitter"
                    >
                        <div className="flex flex-row justify-center items-center gap-4 group-hover:translate-x-1 lg:group-hover:translate-y-1 transition-all">
                            <Icon
                                icon="simple-icons:x"
                                width="2rem"
                                height="2rem"
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-200"
                                aria-hidden="true"
                            />
                            <span
                                className="group-hover:opacity-80 group-active:opacity-70 transition-all duration-400"
                            >Twitter
                            </span>
                        </div>
                    </Link>
                </MagicCard>
            </section>
        </main>
    );
}