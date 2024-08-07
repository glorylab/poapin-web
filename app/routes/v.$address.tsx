import { Moment, POAP } from "~/types/poap";
import { getPoapsOfAddress } from "~/api/poap";
import { Collection, getCollectionsByDropIds, getLastMomentsByAuthor, getMomentsCountByAuthor } from "~/api/poap-graph";
import { LoaderFunction, MetaFunction, json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { cn } from "~/src/cn";
import PoapListItem from "~/components/poap/poap-list-item";
import { Button, Select, SelectItem, Image, Spacer, useDisclosure } from "@nextui-org/react";
import AddressInputComponent from "~/components/poap/address-input";
import { getEnv } from "~/src/env";
import FiltersWrapper from "~/components/poap/filters-wrapper";
import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { Icon } from "@iconify/react/dist/iconify.js";
import SidebarDrawer from "~/components/poap/sidebar-drawer";
import { FilterTypeEnum } from "~/types/filter";
import type { Filter } from "app/types/filter";
import { useEffect, useState } from "react";
import { MagicCard } from "~/components/shared/magic-card";
import Marquee from "~/components/shared/marquee";
import { MomentCard } from "~/components/poap/moment-card";
import { CollectionCard } from "~/components/poap/collection-card";

export const meta: MetaFunction = ({ data }) => {
    const loaderData = data as LoaderData | undefined;

    if (!loaderData || !loaderData.meta) {
        return [];
    }

    const { title, description, keywords, address, ogimageurl } = loaderData.meta;

    const baseMeta = [
        { title },
        { description },
        { keywords },
        { property: "og:title", content: title },
        { property: "og:image", content: ogimageurl },
        { property: "og:description", content: description },
        { property: "og:site_name", content: "POAPin" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://poap.in/v/${address}` },
    ];

    const twitterMeta = [
        { name: "X:card", content: "summary_large_image" },
        { name: "X:domain", content: "poap.in" },
        { name: "X:url", content: `https://poap.in/v/${address}` },
        { name: "X:title", content: title },
        { name: "X:description", content: description },
        { name: "X:image", ogimageurl }
    ];

    const frameMetadata = getFrameMetadata({
        buttons: [
            {
                action: 'link',
                target: `https://poap.in/v/${address}`,
                label: 'We love POAP',
            },
        ],
        image: ogimageurl,
    })
    const frameMeta = Object.entries(frameMetadata).map(([key, value]) => ({ name: key, content: value }));

    return [...baseMeta, ...twitterMeta, ...frameMeta];
}

export const loader: LoaderFunction = async ({ context, params, request }) => {
    const address = params.address;

    if (!address) {
        return json({ error: "Address not found" }, { status: 404 });
    }

    try {
        const poaps: POAP[] = await getPoapsOfAddress(context, address);

        if (!poaps || !poaps.length) {
            return json({ error: "No POAPs found" }, { status: 404 });
        }

        // Get the eth address from any of the poaps owner
        const ethAddress = poaps[0].owner;

        let metaTitle = `POAPs of ${address} | POAPin`;

        if (ethAddress != address) {
            metaTitle = `POAPs of ${address} (${ethAddress}) | POAPin`;
        }

        const titles = poaps.map(poap => poap.event.name).slice(0, 100);
        const metaDescription = `${address} has ${poaps.length} POAPs. POAP, short for "Proof of Attendance Protocol," allows you to mint memories as digital mementos we call "POAPs. POAPs are bookmarks for your life.`;
        const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Bookmarks for your life, poap.xyz, poapxyz, Non Fungible Tokens, NFT, ${address}, ${titles.join(", ")}`;

        let latestMoments;
        let dropsWithMoments = [];

        // Get moments count
        const momentsCount = await getMomentsCountByAuthor({ context, author: ethAddress });
        dropsWithMoments = momentsCount.uniqueDropIds;
        if (momentsCount && momentsCount.totalMoments && momentsCount.totalMoments > 0) {
            // Get the latest moments
            latestMoments = await getLastMomentsByAuthor({ context, author: ethAddress, limit: 10 });
            console.log('latestMoments:', latestMoments);
        }

        // Get the user agent
        const userAgent = request.headers.get("User-Agent");

        // Check if the request is from a search engine bot
        const isSearchEngineBot = userAgent && /Googlebot|Mediapartners|AdsBot|Bingbot|MSNBot|AdIdxBot|BingPreview|Desktop|Mobile|Yandex|DuckDuckBot|Slurp/i.test(userAgent);

        let ogimageurl = "";

        // If the request is not from a search engine bot, get the OG image
        if (!isSearchEngineBot) {
            // Get the OG image
            const ogResponse = await fetch(`https://og.poap.in/api/poap/v/${address}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    poaps,
                    latestMoments,
                    poapapikey: getEnv({ context }).poapApiKey,
                }),
            });

            if (!ogResponse.ok) {
                console.error(`Failed to fetch ogImage: ${ogResponse.statusText}`);
            }

            ogimageurl = ogResponse.url;
        }

        const meta = {
            title: `${metaTitle}`,
            description: `${metaDescription}`,
            keywords: `${metaKeywords}`,
            poaps,
            address,
            ogimageurl,
        };

        const totalMomentsCount = momentsCount.totalMoments;

        if (momentsCount && totalMomentsCount && totalMomentsCount > 0) {
            meta.description += ` ${address} created ${totalMomentsCount} POAP moments.`;
        }

        return json({ poaps, totalMomentsCount, latestMoments, dropsWithMoments, meta });
    } catch (error) {
        console.error(error);
        return json({ error: `Failed to fetch POAPs of ${address}` }, { status: 500 });
    }
};

interface LoaderData {
    poaps: POAP[];
    totalMomentsCount: number;
    latestMoments: Moment[];
    dropsWithMoments: number[];
    error: string;
    meta: {
        title: string;
        description: string;
        keywords: string;
        poaps: POAP[];
        address: string;
        ogimageurl: string;
    };
}

function getMomentsCountOfDrop(poap: POAP, dropsWithMoments: number[]) {
    let momentsCount = 0;
    if (!dropsWithMoments || dropsWithMoments.length == 0) return momentsCount;
    // Return the number of moments for the given POAP
    momentsCount = dropsWithMoments.filter((dropId) => dropId === poap.event.id).length;
    return momentsCount;
}

export default function POAPList({ className }: { className?: string }) {
    const { poaps, meta, totalMomentsCount, latestMoments, dropsWithMoments, error } = useLoaderData<LoaderData>();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({});
    const [selectedSort, setSelectedSort] = useState<string>("collected_newest");

    const [collections, setCollections] = useState<Collection[]>([]);

    useEffect(() => {
        
        if (!poaps || !poaps.length) return;

        const fetchCollections = async () => {
            const dropIds = poaps.map(poap => poap.event.id);
            const queryParams = new URLSearchParams({ dropIds: dropIds.join(',') });
            try {
                const response = await fetch(`/api/collections?${queryParams}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch collections');
                }
                const data: Collection[] = await response.json();
                setCollections(data);
            } catch (error) {
                console.error('Error fetching collections:', error);
            }
        };

        fetchCollections();
    }, [poaps]);

    if (!poaps || !poaps.length) {
        if (error) {
            return (
                <div className="w-full flex flex-col items-center py-24">
                    <div className="relative flex flex-col items-center max-w-lg text-center">

                        <h2 className="font-medium leading-7 text-secondary-300">404</h2>
                        <h1 className="text-4xl font-medium tracking-tight text-background-800">{error}</h1>
                        <Spacer y={4} />
                        <h2 className="text-large text-background-700">
                            Check out other friends&apos; POAP 👇
                        </h2>
                    </div>
                    <Spacer y={4} />
                    <div className="relative flex flex-col items-center max-w-lg">
                        <AddressInputComponent />
                    </div>
                </div>
            );
        } else {
            return <div className="info">No POAPs found</div>;
        }
    }

    const countryFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Country",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const country = poap.event.country || "(None)";
            if (acc) {
                if (!acc.find((option) => option.value === country)) {
                    acc.push({ title: country, value: country });
                }
                return acc;
            }
            return [{ title: country, value: country }];
        }, []),
    };

    const cityFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "City",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            const city = poap.event.city || "(None)";
            if (acc) {
                if (!acc.find((option) => option.value === city)) {
                    acc.push({ title: city, value: city });
                }
                return acc;
            }
            return [{ title: city, value: city }];
        }, []),
    };

    const chainFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Chain",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            if (acc) {
                if (!acc.find((option) => option.value === poap.chain)) {
                    acc.push({ title: poap.chain, value: poap.chain });
                }
                return acc;
            }
            return [{ title: poap.chain, value: poap.chain }];
        }, []),
    };

    const yearFilter: Filter = {
        type: FilterTypeEnum.CheckboxGroup,
        title: "Year",
        options: poaps.reduce((acc: Filter["options"], poap) => {
            if (acc) {
                if (!acc.find((option) => option.value === poap.event.year.toString())) {
                    acc.push({ title: poap.event.year.toString(), value: poap.event.year.toString() });
                }
                return acc;
            }
            return [{ title: poap.event.year.toString(), value: poap.event.year.toString() }];
        }, []),
    };

    const filteredPoaps = poaps.filter((poap) => {
        return Object.entries(selectedFilters).every(([key, values]) => {
            if (values.length === 0) return true;
            switch (key) {
                case "Country":
                    return values.includes(poap.event.country || "(None)");
                case "City":
                    return values.includes(poap.event.city || "(None)");
                case "Chain":
                    return values.includes(poap.chain);
                case "Year":
                    return values.includes(poap.event.year.toString());
                default:
                    return true;
            }
        });
    }).sort((a, b) => {
        switch (selectedSort) {
            case "collected_newest":
                return new Date(b.created).getTime() - new Date(a.created).getTime();
            case "collected_oldest":
                return new Date(a.created).getTime() - new Date(b.created).getTime();
            case "start_date_newest":
                return new Date(b.event.start_date).getTime() - new Date(a.event.start_date).getTime();
            case "start_date_oldest":
                return new Date(a.event.start_date).getTime() - new Date(b.event.start_date).getTime();
            case "most_moments":
                return getMomentsCountOfDrop(b, dropsWithMoments) - getMomentsCountOfDrop(a, dropsWithMoments);
            case "most_popular":
                return b.event.supply - a.event.supply;
            default:
                return new Date(b.created).getTime() - new Date(a.created).getTime();

        }
    });


    const handleFilterChange = (key: string, values: string[]) => {
        setSelectedFilters((prevFilters) => ({
            ...prevFilters,
            [key]: values,
        }));
    };

    return (
        <div className="flex gap-x-6 mb-8">
            <SidebarDrawer isOpen={isOpen} onOpenChange={onOpenChange}>
                <FiltersWrapper
                    className="md:bg-default-50 sm:ml-4 bg-transparent md:bg-opacity-30 backdrop-blur-sm min-w-64"
                    items={[
                        countryFilter,
                        cityFilter,
                        yearFilter,
                        chainFilter,
                    ]}
                    scrollShadowClassName="max-h-full pb-12"
                    showActions={false}
                    title="Filter by"
                    onFilterChange={handleFilterChange}
                />
            </SidebarDrawer>
            <div className="w-full flex-1 flex-col">
                <header className="relative z-20 mx-4 px-4 mt-4 flex flex-col gap-2 rounded-medium bg-default-50 bg-opacity-30 backdrop-blur-sm pb-3 pt-2 md:pt-3">
                    <div className="flex items-center gap-1 md:hidden md:gap-2">
                        <h1 className="text-large font-medium text-background-700">{meta.address}</h1>
                        <span className="text-small text-background-500">({poaps.length})</span>
                        <span className="text-small text-background-500"> {totalMomentsCount > 0 ? `(${totalMomentsCount} moments)` : ""}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-row grow gap-2">
                            <Button
                                className="flex md:hidden border-background-200 hover:border-background-100 bg-background-100 bg-opacity-20 hover:bg-background-100 hover:bg-opacity-70 active:bg-opacity-70 text-background-600 hover:text-background-800 active:text-background-800"
                                startContent={
                                    <Icon
                                        className="text-background-600 hover:text-background-800 active:text-background-800"
                                        height={16}
                                        icon="solar:filter-linear"
                                        width={16}
                                    />
                                }
                                variant="bordered"
                                onPress={onOpen}
                            >
                                Filters
                            </Button>
                            <div className="hidden items-center gap-1 md:flex">
                                <h1 className="text-medium font-medium text-background-700">{meta.address}</h1>
                                <span className="text-small text-background-500">({poaps.length})</span>
                                <span className="text-small text-background-500"> {totalMomentsCount > 0 ? `(${totalMomentsCount} moments)` : ""}</span>
                            </div>
                        </div>
                        <div className="flex grow">
                            <Select
                                aria-label="Sort by"
                                classNames={{
                                    base: "items-center justify-end",
                                    trigger: "border-background-200 hover:border-background-100 bg-background-100 bg-opacity-20 hover:bg-background-100 hover:bg-opacity-70 active:bg-opacity-70 text-background-600 hover:text-background-800 active:text-background-800",
                                    label:
                                        "hidden lg:block text-tiny whitespace-nowrap md:text-small text-background-600",
                                    mainWrapper: "max-w-xs",
                                }}
                                defaultSelectedKeys={[selectedSort]}
                                onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0];
                                    if (typeof selectedKey === "string") {
                                        setSelectedSort(selectedKey);
                                    }
                                }}

                                label="Sort by"
                                labelPlacement="outside-left"
                                placeholder="Select an option"
                                variant="bordered"
                            >
                                <SelectItem key="collected_newest" value="collected_newest"
                                    classNames={{
                                        title: "text-secondary-600 hover:text-secondary-900 active:text-secondary-800",
                                        description: "text-secondary-600 hover:text-secondary-900 active:text-secondary-800",
                                        selectedIcon: "text-secondary-600 hover:text-secondary-900 active:text-secondary-800",
                                    }}
                                >
                                    Collected date: Newest
                                </SelectItem>
                                <SelectItem key="collected_oldest" value="collected_oldest">
                                    Collected date: Oldest
                                </SelectItem>
                                <SelectItem key="start_date_newest" value="start_date_newest">
                                    Start Date: Newest
                                </SelectItem>
                                <SelectItem key="start_date_oldest" value="start_date_oldest">
                                    Start Date: Oldest
                                </SelectItem>
                                <SelectItem key="most_popular" value="most_popular">
                                    Most Popular
                                </SelectItem>
                                <SelectItem key="most_moments" value="most_moments">
                                    Most Moments
                                </SelectItem>
                            </Select>
                        </div>
                    </div>
                </header>
                <main className="mt-4 h-full w-full overflow-visible px-1 sm:pr-2 max-w-5xl">
                    {latestMoments && latestMoments.length > 0 && (
                        <div className="flex flex-col gap-2 p-4 bg-default-50 bg-opacity-30 backdrop-blur-sm rounded-medium mx-auto mb-4">
                            <h2 className="text-medium font-medium text-background-700">Latest Moments</h2>
                            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg">
                                <Marquee pauseOnHover>
                                    {latestMoments.map((moment) => (
                                        <MomentCard key={moment.id} moment={moment} />
                                    ))}
                                </Marquee>
                            </div>
                        </div>
                    )}
                    {collections && collections.length > 0 && (
                        <div className="flex flex-col gap-2 p-4 bg-default-50 bg-opacity-30 backdrop-blur-sm rounded-medium mx-auto mb-4">
                            <h2 className="text-medium font-medium text-background-700">Collections</h2>
                            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg">
                                <Marquee pauseOnHover>
                                    {collections.map((collection) => (
                                        <CollectionCard key={collection.id} collection={collection} />
                                    ))}
                                </Marquee>
                            </div>
                        </div>
                    )}
                    <div className="block rounded-medium border-background-200 border-dashed border-[1px]">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    "my-auto grid max-w-7xl gap-5 p-4 grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
                                    className
                                )}
                            >
                                {filteredPoaps.map((poap) => (
                                    <PoapListItem key={poap.tokenId} poap={poap} momentsCount={getMomentsCountOfDrop(poap, dropsWithMoments)} />
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>

    );
}