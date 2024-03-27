import React, { useEffect, useState } from "react";
import { Card, CardBody, Image, CardHeader, CardFooter } from "@nextui-org/react";
import { m, useMotionValue, domAnimation, LazyMotion, useMotionTemplate } from "framer-motion";
import { Grant } from "~/types/grant";
import ScrollingBanner from "../shared/scrolling-banner";

interface GrantProps {
    grant: Grant;
}

export default function GrantCardComponent(props: GrantProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const imageRatio = props.grant.attributes.image.file.data.attributes.width / props.grant.attributes.image.file.data.attributes.height;

    const [bannerHeight, setBannerHeight] = useState<number>(0);
    const cardRef = React.useRef<HTMLDivElement>(null);

    // Set banner image's height to fit the full width
    useEffect(() => {
        // Get the width of the card
        const cardWidth = cardRef.current?.offsetWidth ?? 0;
        // Calculate the height of the banner image
        setBannerHeight(cardWidth / imageRatio);

    }, [cardRef, imageRatio]);



    function onMouseMove({ clientX, clientY }: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (!cardRef.current) return;

        const { left, top } = cardRef.current.getBoundingClientRect() ?? { left: 0, top: 0 };

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <Card
            {...props}
            ref={cardRef}
            className="group relative max-w-xl bg-neutral-50 shadow-large rounded-none font-serif"
            radius="lg"
            onMouseMove={onMouseMove}
        >
            <LazyMotion features={domAnimation}>
                <m.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-250 group-hover:opacity-100"
                    style={{
                        background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              rgba(120, 40, 200, 0.2),
              transparent 80%
            )
          `,
                    }}
                />
            </LazyMotion>
            <CardHeader className={`relative h-[${bannerHeight}px] p-0`}>
                <Image
                    removeWrapper
                    alt={props.grant.attributes.title}
                    className={`w-full rounded-none h-[${bannerHeight}px] object-cover`}
                    src={props.grant.attributes.image.file.data.attributes.url}
                    style={{
                        WebkitMaskImage: "linear-gradient(to bottom, #000 70%, transparent 100%)",
                    }}
                />
            </CardHeader>
            <CardBody className="px-6 pb-8 pt-4">
                <div className="flex flex-col gap-2 mb-8">
                    <p className="text-xl text-neutral-800">{props.grant.attributes.title}</p>
                    <p className="text-small text-neutral-700">
                        {props.grant.attributes.description}
                    </p>
                </div>
                {props.grant.attributes.grants ? <ScrollingBanner shouldPauseOnHover gap="40px">
                    {props.grant.attributes.grants.map((grant) => (
                        grant.amount[0] ?
                            <div key={grant.id} className="flex items-center gap-2 text-xl whitespace-nowrap">
                                <h6 className="text-neutral-800 text-3xl">{grant.title}</h6>
                                <p className="text-3xl text-green-700">
                                    {grant.amount[0].number} {grant.amount[0].quantity}
                                </p>
                            </div> : <></>
                    ))}
                </ScrollingBanner> : <></>}

            </CardBody>
            <CardFooter className="flex justify-between items-center px-6 py-4 font-mono">
                <div>
                    <p className="text-neutral-500 text-small">
                        {new Date(props.grant.attributes.start_time).toLocaleDateString()} -{" "}
                        {new Date(props.grant.attributes.end_time).toLocaleDateString()}
                    </p>
                </div>

            </CardFooter>
        </Card>
    );
}
