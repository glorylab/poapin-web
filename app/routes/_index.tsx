import { json, LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { getHighLights } from "~/api/og";
import footerPositionAtom from "~/atoms/footer-position-atom";
import { BackgroundGradientAnimation } from "~/components/background-gradient-animation";
import AddressInputComponent from "~/components/poap/address-input";
import { HighLightPoaps, HighLightPoapsProps } from "~/components/poap/high-light-poaps";
import BlurFade from "~/components/shared/blur-fade";
import { SparklesCore } from "~/components/sparkles";
import { HighLight } from "~/types/og";
import Marquee from "~/components/shared/marquee";
import { Button, Image } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";

// Stats interface
interface StatsResponse {
  unique_addresses: number;
  total_images: number;
  theme_stats: {
    default: number;
    letter: number;
  };
  data_type_stats: {
    default: number;
  };
  animated_count: number;
  static_count: number;
}

const highlightPoaps: HighLightPoapsProps[] = [
  {
    backgroundColor: "#1E8DCD22",
    address:
      { eth: "0xf6b6f07862a02c85628b3a9688beae07fea9c863", ens: "poap.eth" },
  },
  {
    backgroundColor: "#8DCD3922",
    address:
      { eth: "0x4124cf34f56fa151e05c91ace550ada0dd5aabd7", ens: "isabel.eth" },
  },
  {
    backgroundColor: "#1B2D9622",
    address:
      { eth: "0x5afc7720b161788f9d833555b7ebc3274fd98da1", ens: "glorylab.eth" },
  },
  {
    backgroundColor: "#E1D40133",
    address:
      { eth: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", ens: "vitalik.eth" },
  },
];

export const meta: MetaFunction = ({ location }) => {
  const title = "POAPin - Organize, Display and Share Your POAP Collection";
  const description = "POAPin helps you organize, showcase and share your POAP (Proof of Attendance Protocol) collection with beautiful visual cards and gallery views. Create your personalized POAP profile and explore the bookmarks of your life.";
  const keywords = "POAP, Proof of Attendance Protocol, NFT, Ethereum, Web3, Digital Collectibles, Blockchain, POAP Gallery, POAP Cards, POAP Collection";
  const canonicalUrl = "https://poap.in";

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

export const loader: LoaderFunction = async ({ context }) => {
  try {
    const highlightsResponse = await getHighLights(context) as { data: HighLight[] };

    return json({ highlights: highlightsResponse.data });
  } catch (error) {
    console.error(error);
    return json({ highlights: [], error: "Failed to fetch data" }, { status: 500 });
  }
};

export default function Index() {

  const { highlights } = useLoaderData<{ highlights: HighLight[] }>();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // JSON-LD structured data for the homepage
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "POAPin",
    "url": "https://poap.in",
    "description": "POAPin helps you organize, showcase and share your POAP (Proof of Attendance Protocol) collection with beautiful visual cards and gallery views.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://poap.in/v/{wallet_address}",
      "query-input": "required name=wallet_address",
      "description": "Search for any Ethereum wallet address or ENS name to view their POAP collection"
    },
    "mainEntity": [
      {
        "@type": "WebPageElement",
        "name": "POAP Collection Search",
        "description": "Search for any Ethereum address or ENS name to view their POAP collection"
      },
      {
        "@type": "WebPageElement",
        "name": "Featured POAP Collections",
        "description": "Featured POAP collections from notable Ethereum addresses"
      },
      {
        "@type": "WebPageElement",
        "name": "POAP Collection Gallery",
        "description": "Explore featured POAP collections with beautiful visual cards"
      },
      {
        "@type": "WebPageElement",
        "name": "POAP Card Creator",
        "description": "Create your personalized POAP card to showcase your collection",
        "potentialAction": {
          "@type": "Action",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://poap.in/card"
          },
          "name": "Get My POAP Card"
        }
      }
    ]
  };

  // Function to fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('https://og.poap.in/api/stats/');
      const data = await response.json() as StatsResponse;
      setStats(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up periodic updates every 3 seconds
    updateIntervalRef.current = setInterval(() => {
      fetchStats();
    }, 3000);

    // Stop updates after 2 minutes
    timeoutRef.current = setTimeout(() => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    }, 120000); // 2 minutes

    // Cleanup on unmount
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-[2048px] w-full flex flex-col">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <motion.div
        className="h-96 relative w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center rounded-none [mask-image:linear-gradient(0deg,rgba(0,0,0,0),#000)]"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          mass: 1
        }}
      >
        <BackgroundGradientAnimation>
          <div className="absolute z-50 inset-0 flex flex-col items-center justify-center text-white font-bold px-4 pointer-events-none text-3xl text-center md:text-4xl lg:text-7xl">
            <h1 className="drop-shadow-2xl text-shadow">
              Dive into the world of POAP
            </h1>
            <div className="w-[40rem] h-40 relative mt-4">
              {/* Gradients */}
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-white/90 to-transparent h-[2px] w-3/4 blur-sm" />
              <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-white to-transparent h-[1px] w-3/4" />
              <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-white/80 to-transparent h-[3px] w-1/4 blur-sm" />
              <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-white to-transparent h-[1px] w-1/4" />

              {/* Core component */}
              <SparklesCore
                background="transparent"
                minSize={0.4}
                maxSize={1}
                particleDensity={500}
                className="w-full h-full"
                particleColor="#FFFFFF"
              />

              {/* Radial Gradient to prevent sharp edges */}
              {/* <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div> */}
            </div>
          </div>
        </BackgroundGradientAnimation>
      </motion.div>

      <section
        className="max-w-lg mx-auto relative px-2 xs:px-8 md:flex flex-col justify-center md:justify-start md:pt-16"
        aria-label="Search for any Ethereum address or ENS name to view their POAP collection"
      >
        <div className="md:pb-8">
          <BlurFade delay={0.25} inView><AddressInputComponent isClearable /></BlurFade>
        </div>
      </section>
      <section
        className="w-full mx-auto relative px-2 xs:px-8 md:flex flex-col justify-center md:justify-start md:pt-0"
        aria-label="Featured POAP collections from notable Ethereum addresses"
      >
        <div className="md:pb-8">
          <BlurFade delay={0.55} inView>
            <HighLightPoaps data={highlightPoaps} />
          </BlurFade>
        </div>
      </section>

      {highlights && highlights.length > 0 &&
        <div className="w-full mx-auto relative bg-gradient-to-b from-background-600/90 to-transparent">
          {/* Golden glow border effect */}
          <div className="absolute inset-x-0 top-0 h-[3px] w-full overflow-hidden">
            <div
              className="absolute left-1/2 transform -translate-x-1/2 h-full bg-gradient-to-r from-transparent via-yellow-300/90 to-transparent"
              style={{
                boxShadow: '0 0 15px 2px rgba(255, 215, 0, 0.9), 0 0 30px 5px rgba(255, 215, 0, 0.3)',
                width: '60%',
                animation: '3s infinite goldenPulse'
              }}>
            </div>
          </div>

          {/* Background overlay with image and opacity gradient */}
          <div
            className="absolute inset-0 w-full h-full z-0"
            style={{
              backgroundImage: 'url("/images/background_sketch.png")',
              backgroundRepeat: 'repeat',
              backgroundSize: '256px 256px',
              WebkitMaskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
              maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
              opacity: 0.1
            }}
          ></div>

          {/* Content container with relative positioning to appear above the background */}
          <div className="relative z-10">
            {stats && (
              <section className="w-full mx-auto relative px-2 xs:px-8 md:flex flex-col justify-center md:justify-start md:pt-8 text-center">
                <div className="stats-container p-6 mb-8">
                  <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                    We've created {' '}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`total-${stats.total_images}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl font-bold text-white inline-block"
                      >
                        {stats.total_images.toLocaleString()}
                      </motion.span>
                    </AnimatePresence>
                    {' '} beautiful cards for {' '}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`addresses-${stats.unique_addresses}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl font-bold text-white inline-block"
                      >
                        {stats.unique_addresses.toLocaleString()}
                      </motion.span>
                    </AnimatePresence>
                    {' '} wallets, with {' '}
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`animated-${stats.animated_count}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="text-2xl font-bold text-white inline-block"
                      >
                        {stats.animated_count.toLocaleString()}
                      </motion.span>
                    </AnimatePresence>
                    {' '} of them animated!
                  </p>
                </div>
              </section>
            )}
            <section
              className="w-full mx-auto relative px-0 xs:px-0 md:flex flex-col justify-center md:justify-start md:pt-0"
              aria-label="Explore featured POAP collections with beautiful visual cards"
            >
              <div className="flex flex-col h-[728px]">

                <Marquee
                  className="h-1/2"
                  pauseOnHover>
                  {highlights.map((highlight) => (
                    <Link
                      key={highlight.address}
                      to={`/v/${highlight.address}`}
                      className="h-full mx-1">
                      <Image
                        width={400}
                        height={210}
                        className="h-full"
                        src={highlight.og_image_url + "/default"}
                        alt={highlight.address} />
                    </Link>
                  ))}
                </Marquee>
                <Marquee
                  className="h-1/2"
                  reverse
                  pauseOnHover>
                  {highlights.map((highlight) => (
                    <Link
                      key={highlight.address}
                      to={`/v/${highlight.address}`}
                      className="h-full mx-1">
                      <Image
                        width={400}
                        height={210}
                        className="h-full"
                        src={highlight.og_image_url + "/letter"}
                        alt={highlight.address} />
                    </Link>
                  ))}
                </Marquee>
                <Marquee
                  className="h-1/2"
                  pauseOnHover>
                  {highlights.map((highlight) => (
                    <Link
                      key={highlight.address}
                      to={`/v/${highlight.address}`}
                      className="h-full mx-1">
                      <Image
                        width={400}
                        height={210}
                        className="h-full"
                        src={highlight.og_image_url + "/gallery"}
                        alt={highlight.address} />
                    </Link>
                  ))}
                </Marquee>
              </div>
            </section>

            <section className="sr-only" aria-label="Create your personalized POAP card to showcase your collection">
              <h2>Create Your POAP Card</h2>
              <p>Generate a beautiful, shareable card showcasing your POAP collection. Enter your Ethereum address or ENS name to create your personalized POAP card.</p>
              <a href="/card">Get My POAP Card</a>
            </section>

            <div className="w-full mx-auto flex flex-col items-center">
              <Button
                as={Link}
                to="/card"
                size="lg"
                color="secondary"
                variant="shadow"
                className="w-full max-w-lg mx-auto sm:w-auto font-bold tracking-wide cursor-pointer rounded-lg px-6 py-4 my-8"
                startContent={<Icon icon="fluent:flash-sparkle-24-filled" className="w-5 h-5" />}
              >
                Get My POAP Card
              </Button>
            </div>
          </div>
        </div>
      }

      <div className="flex-grow"></div>
    </div>
  );
}