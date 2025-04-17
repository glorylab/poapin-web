import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { Spacer, Image } from "@heroui/react";
import { json, LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getGrants } from "~/api/grants";
import GrantCardComponent from "~/components/sponsors/grant-card";
import { GrantsResponse } from '~/types/grant';

export const meta: MetaFunction = ({ data }) => {

  const metaTitle = `Sponsors of POAPin | POAPin`;
  const metaDescription = `Explore POAPin's sponsor records and grant history. View our participation in Gitcoin Grants rounds including GR14, GR15, GG19, GG20 and more.`;
  const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Bookmarks for your life, poap.xyz, poapxyz, Non Fungible Tokens, NFT, Gitcoin, Grants, Sponsors, Sponsor Records, GR14, GR15, Gitcoin Alpha Round, Gitcoin Beta Round, Gitcoin GG19, Gitcoin GG20, Opensource software`;
  const metaImage = "https://nexus.glorylab.xyz/1/5/6/POA_Pin_GG_20_1608a84ea6.jpg";
  const canonicalUrl = `https://poap.in/sponsors`;

  const baseMeta = [
    { title: metaTitle },
    { description: metaDescription },
    { keywords: metaKeywords },
    { property: "og:title", content: metaTitle },
    { property: "og:image", content: metaImage },
    { property: "og:description", content: metaDescription },
    { property: "og:site_name", content: "POAPin" },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl },
    { rel: "canonical", href: canonicalUrl },
  ];

  const twitterMeta = [
    { name: "X:card", content: "summary_large_image" },
    { name: "X:domain", content: "poap.in" },
    { name: "X:url", content: canonicalUrl },
    { name: "X:title", content: metaTitle },
    { name: "X:description", content: metaDescription },
    { name: "X:image", content: metaImage }
  ];

  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        action: 'link',
        target: canonicalUrl,
        label: 'I like POAPin!',
      },
    ],
    image: metaImage,
  })
  const frameMeta = Object.entries(frameMetadata).map(([key, value]) => ({ name: key, content: value }));

  return [...baseMeta, ...twitterMeta, ...frameMeta];
}

export const loader: LoaderFunction = async ({ context }) => {
  try {
    const grants = await getGrants(context) as GrantsResponse;
    return json(grants);
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch grants" }, { status: 500 });
  }
};

export default function SponsorsPage() {

  const { data: grants, error } = useLoaderData<GrantsResponse>();
  
  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Sponsors of POAPin | POAPin",
    "description": "Explore POAPin's sponsor records and grant history. View our participation in Gitcoin Grants rounds including GR14, GR15, GG19, GG20 and more.",
    "url": "https://poap.in/sponsors",
    "image": "https://nexus.glorylab.xyz/1/5/6/POA_Pin_GG_20_1608a84ea6.jpg",
    "publisher": {
      "@type": "Organization",
      "name": "POAPin",
      "logo": {
        "@type": "ImageObject",
        "url": "https://poap.in/favicon.ico"
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "POAPin's Sponsor Records",
      "description": "List of grants and sponsorships supporting POAPin",
      "itemListOrder": "https://schema.org/ItemListOrderDescending",
      "numberOfItems": grants?.length || 0,
      "itemListElement": grants?.slice(0, 10).map((grant, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Event",
          "name": grant.title,
          "description": grant.description,
          "startDate": grant.start_time,
          "endDate": grant.end_time,
          "url": `https://poap.in/sponsors#grant-${grant.id}`
        }
      })) || []
    }
  };

  if (error) {
    return (
      <main className="max-w-xl mx-auto relative py-8 lg:py-16 px-8 text-center bg-red-100" aria-labelledby="error-heading">
        <h1 id="error-heading" className="text-2xl font-medium text-red-400 mb-4">Oops! Something went wrong</h1>
        <p className="text-gray-400">{error}</p>
        <div className='flex justify-center'>
          <Image
            src="https://nexus.glorylab.xyz/3/4/Bowing_person_emoji_4c1eabd350.png"
            alt="Error"
            width={120}
            height={120}
            className="mx-auto mt-8"
          />
        </div>
      </main>
    );
  }

  if (!grants) {
    return <div className="loading" aria-live="polite">Loading grants...</div>;
  }

  const sortedGrants = grants.sort((a, b) => {
    return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
  });

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <main className="max-w-xl mx-auto relative py-8 lg:py-16 px-8" aria-labelledby="sponsors-heading">
        <header>
          <h1 id="sponsors-heading" className="font-medium leading-7 text-secondary-300">POAPin&apos;s Sponsor Records</h1>
          <h2 className="text-4xl font-medium text-primary tracking-tight underline underline-offset-8 leading-relaxed decoration-wavy decoration-8 decoration-[#f0d3da]">
            THANKS FOR YOUR GENEROUS SUPPORT!
          </h2>
        </header>
        <Spacer y={4} />
        <div className="flex justify-center">
          <Image
            src="https://nexus.glorylab.xyz/3/4/Bowing_person_emoji_4c1eabd350.png"
            alt="THANKS FOR YOUR GENEROUS SUPPORT!"
            width={120}
            height={120}
          />
        </div>

        <section className="mt-10" aria-label="Grant list">
          {sortedGrants.map((grant, index) => (
            <article 
              key={index} 
              id={`grant-${grant.id}`}
              className="flex-auto cursor-default max-w-xl mb-8 rounded-2xl overflow-clip shadow-sm hover:shadow-xl transition-all duration-200 border-dashed border-1.5 hover:border-dotted"
              aria-labelledby={`grant-title-${index}`}
            >
              <GrantCardComponent
                grant={grant}
              />
            </article>
          ))}
        </section>
      </main>
    </>
  );
}