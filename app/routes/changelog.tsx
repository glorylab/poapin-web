import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { json, LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getChangelogs } from "~/lib/changelog";
import ChangelogArticle from "~/components/changelog/changelog-article";
import { ChangelogLayout } from '~/components/changelog/ChangelogLayout';
import { ChangelogResponse } from '~/types/changelog';

export const meta: MetaFunction = ({ data }) => {
  const metaTitle = `Changelog | POAPin`;
  const metaDescription = `Stay updated with POAPin's latest features, improvements, and updates. View our complete changelog including Time Capsule, POAP Moments, and more.`;
  const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Changelog, Updates, Features, Time Capsule, Moments, Release Notes, Version History`;
  const metaImage = "https://nexus.glorylab.xyz/1/5/6/POA_Pin_GG_20_1608a84ea6.jpg";
  const canonicalUrl = `https://poap.in/changelog`;

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
        label: 'Check Updates!',
      },
    ],
    image: metaImage,
  });
  const frameMeta = Object.entries(frameMetadata).map(([key, value]) => ({ name: key, content: value }));

  return [...baseMeta, ...twitterMeta, ...frameMeta];
}

export const loader: LoaderFunction = async ({ context }) => {
  try {
    const changelogs = await getChangelogs(context) as ChangelogResponse;
    return json(changelogs);
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch changelogs" }, { status: 500 });
  }
};

export default function ChangelogPage() {
  const { data: changelogs, error } = useLoaderData<ChangelogResponse>();
  
  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Changelog | POAPin",
    "description": "Stay updated with POAPin's latest features, improvements, and updates. View our complete changelog including Time Capsule, POAP Moments, and more.",
    "url": "https://poap.in/changelog",
    "image": "https://nexus.glorylab.xyz/1/5/6/POA_Pin_GG_20_1608a84ea6.jpg",
    "publisher": {
      "@type": "Organization",
      "name": "POAPin",
      "logo": {
        "@type": "ImageObject",
        "url": "https://poap.in/images/title_poapin_s.png"
      }
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": changelogs?.length || 0,
      "itemListElement": changelogs?.map((changelog, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Article",
          "headline": changelog.title,
          "description": `Version ${changelog.version} - ${changelog.tags.join(', ')}`,
          "datePublished": changelog.date_created,
          "dateModified": changelog.date_updated,
          "author": {
            "@type": "Organization",
            "name": "POAPin Team"
          }
        }
      })) || []
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Error</h1>
          <p className="text-foreground-600">Failed to load changelog. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Complete commit-ts Layout Implementation */}
      <ChangelogLayout>
        {changelogs && changelogs.length > 0 ? (
          changelogs.map((changelog, index) => (
            <ChangelogArticle key={changelog.id} changelog={changelog} index={index} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-foreground-500">No changelog entries found.</p>
          </div>
        )}
      </ChangelogLayout>
    </>
  );
}
