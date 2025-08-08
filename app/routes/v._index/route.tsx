import { MetaFunction, LoaderFunctionArgs, LinksFunction } from "@remix-run/cloudflare";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "@remix-run/react";
import AddressInputComponent from "~/components/poap/address-input";
import BubblePOAPs from "~/components/poap/bubble-poaps";
import { getEnv } from "~/src/env";

export const meta: MetaFunction = () => {
    return [
        { title: "POAP Explorer | POAP.in" },
        { description: "Discover the latest POAP mints across the network. A live bubble showcase of newly issued POAP drops updated in near real time." },
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
    ];
};

export const links: LinksFunction = () => {
    return [
        { rel: "canonical", href: "/v" },
    ];
};

interface POAPData {
    id: number;
    drop_id?: number;
    drop: {
        image_url: string;
        name: string;
    };
    minted_on: number;
    collector_address: string;
}

export async function loader({ context }: LoaderFunctionArgs) {
    // Fetch a small, SEO-friendly subset server-side for JSON-LD and semantic list
    try {
        const poapGraphQLBaseUrl = getEnv({ context }).poapGraphQLBaseUrl;
        const query = `
          query LatestPOAPs {
            poaps(order_by: {minted_on: desc_nulls_last}, limit: 20) {
              drop { image_url name }
              minted_on
              collector_address
              id
              drop_id
            }
          }
        `;

        const response = await fetch(poapGraphQLBaseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            console.warn(`SEO loader GraphQL HTTP ${response.status}`);
            return { context, latestPoaps: [] as POAPData[] };
        }

        const result = await response.json() as { data?: { poaps?: POAPData[] }, errors?: any[] };
        if (result.errors) {
            console.warn('SEO loader GraphQL errors:', result.errors);
            return { context, latestPoaps: [] as POAPData[] };
        }

        const raw = result.data?.poaps ?? [];
        // Dedupe by drop_id, keeping latest minted_on
        const byDrop = new Map<number, typeof raw[number]>();
        for (const p of raw) {
            if (p?.drop_id == null) continue;
            const existing = byDrop.get(p.drop_id as unknown as number);
            if (!existing || ((p.minted_on || 0) > (existing.minted_on || 0))) byDrop.set(p.drop_id as unknown as number, p);
        }
        const deduped = Array.from(byDrop.values())
            .sort((a, b) => (b.minted_on || 0) - (a.minted_on || 0))
            .slice(0, 12);
        return { context, latestPoaps: deduped };
    } catch (e) {
        console.warn('SEO loader fetch failed:', e);
        return { context, latestPoaps: [] as POAPData[] };
    }
}

export default function ExplorerPage() {
    const { context, latestPoaps } = useLoaderData<typeof loader>();
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const [docked, setDocked] = useState(false);
    const [dockBottomPx, setDockBottomPx] = useState<number>(0);

    const initialTopPx = 96;
    const dockGapPx = 32; // desired space between input bottom and footer top

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const footerEl = document.querySelector('[data-poapin-footer]') as HTMLElement | null;
        if (!footerEl) return;

        const recompute = () => {
            const rect = footerEl.getBoundingClientRect();
            const footerTop = rect.top;
            const inputH = inputWrapperRef.current?.offsetHeight ?? 0;
            const inputBottom = initialTopPx + inputH;
            // If footer top reaches the input bottom, dock it to footer
            if (footerTop <= inputBottom + dockGapPx) {
                setDocked(true);
                setDockBottomPx(Math.max(0, window.innerHeight - footerTop + dockGapPx));
            } else {
                setDocked(false);
            }
        };

        // Observe footer movement
        const io = new IntersectionObserver(() => recompute(), { root: null, threshold: [0, 0.01, 1] });
        io.observe(footerEl);

        // Also listen to scroll/resize for precise bottom offset updates while docked
        const onScroll = () => recompute();
        const onResize = () => recompute();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        // Initial compute
        recompute();
        return () => {
            io.disconnect();
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    // Build JSON-LD ItemList once per render
    const jsonLd = useMemo(() => {
        const items = (latestPoaps || []).slice(0, 10).map((p, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `https://poap.in/poap/${p.id}`,
            name: p.drop?.name || `POAP #${p.id}`,
            image: p.drop?.image_url,
        }));
        return {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Latest POAP mints",
            description: "The newly minted POAP in the world!",
            itemListElement: items,
        };
    }, [latestPoaps]);

    // WebPage JSON-LD
    const webPageLd = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "POAP Explorer | POAP.in",
        url: "https://poap.in/v",
        description: "Discover the latest POAP mints across the network. A live bubble showcase of newly issued POAP drops updated in near real time.",
        isPartOf: {
            "@type": "WebSite",
            name: "POAP.in",
            url: "https://poap.in"
        }
    }), []);

    // BreadcrumbList JSON-LD
    const breadcrumbLd = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://poap.in" },
            { "@type": "ListItem", position: 2, name: "POAP Explorer", item: "https://poap.in/v" },
        ]
    }), []);

    return (
        <div className="min-h-screen w-full flex flex-col relative">
            {/* JSON-LD: expose latest mints to crawlers */}
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Additional structured data */}
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageLd) }}
            />
            <script
                type="application/ld+json"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
            />
            {/* SR-only semantic headings & intro for SEO/accessibility */}
            <h1 className="sr-only">POAP Explorer</h1>
            <h2 className="sr-only">Live bubble showcase of newly minted POAP drops</h2>
            <p className="sr-only">Explore the most recent POAP mints from across the network. This page highlights fresh POAP drops and updates frequently to reflect new activity in the POAP ecosystem.</p>
            <BubblePOAPs context={context} initialPoaps={latestPoaps} />
            <section className="max-w-lg mx-auto relative px-2 xs:px-8 flex-grow md:flex flex-col justify-center md:justify-start pt-12 md:pt-16 z-10">
                {/* Fixed at initial position; docks to footer when overlapping */}
                <div
                    ref={inputWrapperRef}
                    className={`flex justify-center fixed inset-x-0 mx-auto z-30 w-full max-w-lg px-2 xs:px-8 ${docked ? '' : 'top-24 md:top-24'}`}
                    style={docked ? { bottom: dockBottomPx, top: 'auto' as unknown as undefined } : { bottom: 'auto' as unknown as undefined }}
                >
                    <AddressInputComponent isClearable />
                </div>
                {/* Spacer to offset the fixed element height and preserve flow */}
                <div className="md:pb-12 h-20 md:h-24"></div>
            </section>
            {/* Semantic fallback list for SEO/accessibility (visually hidden, not display:none) */}
            {latestPoaps?.length ? (
                <section aria-label="Latest POAP mints" className="sr-only">
                    <h2>Latest POAP mints</h2>
                    <ul>
                        {latestPoaps.slice(0, 20).map((p) => (
                            <li key={p.id}>
                                <a href={`https://poap.in/poap/${p.id}`}>
                                    {p.drop?.name || `POAP #${p.id}`} • {new Date((p.minted_on || 0) * 1000).toISOString()}
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
            <div className="flex-grow"></div>
        </div>
    );
}