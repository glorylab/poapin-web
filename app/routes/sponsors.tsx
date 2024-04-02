import { Spacer } from "@nextui-org/react";
import { json, LoaderFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { getGrants } from "~/api/grants";
import GrantCardComponent from "~/components/sponsors/grant-card";
import { GrantData } from "~/types/data";

export const loader: LoaderFunction = async ({ context }) => {
  const apiKey = context.cloudflare.env.SECRET_POAPIN_READ_API;
  console.log(apiKey);
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
      <h2 className="font-medium leading-7 text-secondary">POAPin&apos;s Grant Records</h2>
      <h1 className="text-4xl font-medium text-primary tracking-tight">Thanks for your generous support!</h1>
      <Spacer y={4} />
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
