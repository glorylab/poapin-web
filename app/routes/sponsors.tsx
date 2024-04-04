import { Spacer, Image } from "@nextui-org/react";
import { json, LoaderFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getGrants } from "~/api/grants";
import GrantCardComponent from "~/components/sponsors/grant-card";
import { GrantData } from "~/types/data";

export const loader: LoaderFunction = async ({ context }) => {
  try {
    const grants = await getGrants(context);
    return json(grants);
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch grants" }, { status: 500 });
  }
};


export default function SponsorsPage() {

  const grantsData = useLoaderData<GrantData>();
  if (grantsData.error) {
    return <div>{grantsData.error}</div>;
  }

  if (!grantsData || !grantsData.data) {
    return <div className="loading">Loading grants...</div>;
  }

  const sortedGrants = grantsData.data.sort((a, b) => {
    return new Date(b.attributes.start_time).getTime() - new Date(a.attributes.start_time).getTime();
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