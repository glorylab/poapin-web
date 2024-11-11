import { getFrameMetadata } from '@coinbase/onchainkit/frame';
import { Spacer, Image } from "@nextui-org/react";
import { json, LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getGrants } from "~/api/grants";
import GrantCardComponent from "~/components/sponsors/grant-card";
import { GrantsResponse } from '~/types/grant';

export const meta: MetaFunction = ({ data }) => {

  const metaTitle = `Sponsors of POAPin | POAPin`;
  const metaDescription = `POAPin's Sponsor Records`;
  const metaKeywords = `POAPin, poap.in, POAP, Proof of Attendance Protocol, Bookmarks for your life, poap.xyz, poapxyz, Non Fungible Tokens, NFT, Gitcoin, Grants, Sponsors, Sponsor Records, GR14, GR15, Gitcoin Alpha Round, Gitcoin Beta Round, Gitcoin GG19, Gitcoin GG20, Opensource software`;
  const metaImage = "https://nexus.glorylab.xyz/1/5/6/POA_Pin_GG_20_1608a84ea6.jpg";

  const baseMeta = [
    { title: metaTitle },
    { description: metaDescription },
    { keywords: metaKeywords },
    { property: "og:title", metaTitle },
    { property: "og:image", content: metaImage },
    { property: "og:description", content: metaDescription },
    { property: "og:site_name", content: metaTitle },
    { property: "og:type", content: "website" },
    { property: "og:url", content: `https://poap.in/sponsors` },
  ];

  const twitterMeta = [
    { name: "X:card", content: "summary_large_image" },
    { name: "X:domain", content: "poap.in" },
    { name: "X:url", content: `https://poap.in/sponsors` },
    { name: "X:title", content: metaTitle },
    { name: "X:description", content: metaDescription },
    { name: "X:image", metaImage }
  ];

  const frameMetadata = getFrameMetadata({
    buttons: [
      {
        action: 'link',
        target: `https://poap.in/sponsors`,
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

    if (error) {
        return <div>{error}</div>;
    }

    if (!grants) {
        return <div className="loading">Loading grants...</div>;
    }

    const sortedGrants = grants.sort((a, b) => {
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
    });
  return (
    <section className="max-w-xl mx-auto relative py-8 lg:py-16 px-8">
      <h1 className="font-medium leading-7 text-secondary-300">POAPin&apos;s Sponsor Records</h1>
      <h2 className="text-4xl font-medium text-primary tracking-tight underline underline-offset-8 leading-relaxed decoration-wavy decoration-8 decoration-[#f0d3da]">THANKS FOR YOUR GENEROUS SUPPORT!</h2>
      <Spacer y={4} />
      <div className="flex justify-center">
        <Image
          src="https://nexus.glorylab.xyz/3/4/Bowing_person_emoji_4c1eabd350.png"
          alt="THANKS FOR YOUR GENEROUS SUPPORT!"
          width={120}
          height={120}
        />
      </div>

      <div className="mt-10">
        {sortedGrants.map((grant, index) => (
          <div key={index} className="flex-auto cursor-default max-w-xl mb-8 rounded-2xl overflow-clip shadow-sm hover:shadow-xl transition-all duration-200 border-dashed border-1.5 hover:border-dotted">
            <GrantCardComponent
              grant={grant}
            />
          </div>
        ))}
      </div>
    </section>
  );
}