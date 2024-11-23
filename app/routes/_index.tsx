import { json, LoaderFunction, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { getHighLights } from "~/api/og";
import footerPositionAtom from "~/atoms/footer-position-atom";
import { BackgroundGradientAnimation } from "~/components/background-gradient-animation";
import AddressInputComponent from "~/components/poap/address-input";
import { HighLightPoaps, HighLightPoapsProps } from "~/components/poap/high-light-poaps";
import BlurFade from "~/components/shared/blur-fade";
import { SparklesCore } from "~/components/sparkles";
import { HighLightsResponse } from "~/types/og";
import Marquee from "~/components/shared/marquee";
import { Image } from "@nextui-org/react";


export const meta: MetaFunction = () => {
  return [
    { title: "POAPin" },
    { description: "POAPin helps you organize and share POAPs - the bookmarks of your life." },
    { charSet: "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
  ];
};

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

export const loader: LoaderFunction = async ({ context }) => {
  try {
    const hightlights = await getHighLights(context) as HighLightsResponse;
    return json(hightlights);
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch hightlights" }, { status: 500 });
  }
};

export default function Index() {

  const { data: hightlights } = useLoaderData<HighLightsResponse>();

  const [footerPosition] = useAtom(footerPositionAtom);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const [isFooterVisible, setIsFooterVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      setIsFooterVisible(documentHeight - footerPosition >= documentHeight - scrollTop - viewportHeight);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [footerPosition]);

  return (
    <div className=" min-h-[2048px] w-full flex flex-col">

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
            <p className="drop-shadow-2xl text-shadow">
              Dive into the world of POAP
            </p>
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

      <section className="hidden max-w-lg mx-auto relative px-2 xs:px-8 md:flex flex-col justify-center md:justify-start md:pt-16">
        <div className="md:pb-8">
          <BlurFade delay={0.25} inView><AddressInputComponent isClearable /></BlurFade>
        </div>
      </section>
      <section className="w-full mx-auto relative px-2 xs:px-8 md:flex flex-col justify-center md:justify-start md:pt-0">
        <div className="md:pb-8">
          <BlurFade delay={0.55} inView>
            <HighLightPoaps data={highlightPoaps} />
          </BlurFade>
        </div>
      </section>

      {hightlights && hightlights.length > 0 &&

        <section className="w-full mx-auto relative px-2 xs:px-8 md:flex flex-col justify-center md:justify-start md:pt-0 h-[256px]">
          <div className="h-full">

            <Marquee
              className="h-full"
              pauseOnHover>
              {hightlights.map((hightlight) => (
                <Image
                  width={400}
                  height={210}
                  className="h-full"
                  key={hightlight.address}
                  src={hightlight.og_image_url + "/default"}
                  alt={hightlight.address} />
              ))}
            </Marquee>
            <Marquee
              className="h-full"
              pauseOnHover>
              {hightlights.map((hightlight) => (
                <Image
                  width={400}
                  height={210}
                  className="h-full"
                  key={hightlight.address}
                  src={hightlight.og_image_url + "/letter"}
                  alt={hightlight.address} />
              ))}
            </Marquee>
          </div>
        </section>}

      <div className="flex-grow"></div>
      <div
        ref={inputWrapperRef}
        className="md:hidden p-4 flex flex-col justify-center items-center w-full transition-all duration-300"
        style={{
          position: isFooterVisible ? 'relative' : 'fixed',
          bottom: isFooterVisible ? undefined : 0,
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-secondary-100 to-transparent backdrop-filter backdrop-blur-lg z-0 [mask-image:linear-gradient(180deg,rgba(0,0,0,0),#000)]"></div>
        <div className="w-full max-w-md z-10">
          <AddressInputComponent isClearable />
        </div>
      </div>
    </div>
  );
}