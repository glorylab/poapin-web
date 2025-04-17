import React, { useEffect, useState } from "react";
import { Card, CardBody, Image, CardHeader, CardFooter } from "@heroui/react";
import { m, useMotionValue, domAnimation, LazyMotion, useMotionTemplate } from "framer-motion";
import ScrollingBanner from "../shared/scrolling-banner";
import { Grant } from "~/types/grant";

interface GrantProps {
    grant: Grant;
}

export default function GrantCardComponent(props: GrantProps) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const imageRatio = props.grant.image.width / props.grant.image.height;
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
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(235, 222, 108, 0.4),
              transparent 80%
            )
          `,
                    }}
                />
            </LazyMotion>
            <CardHeader className={`relative h-[${bannerHeight}px] p-0`}>
                <Image
                    removeWrapper
                    alt={props.grant.title}
                    className={`w-full rounded-none h-[${bannerHeight}px] object-cover`}
                    src={props.grant.image.url}
                    style={{
                        WebkitMaskImage: "linear-gradient(to bottom, #000 70%, transparent 100%)",
                    }}
                />
            </CardHeader>
            <CardBody className="px-6 pb-8 pt-4">
                <div className="flex flex-col gap-2 mb-8">
                    <p id={`grant-title-${props.grant.id}`} className="text-xl text-neutral-800">{props.grant.title}</p>
                    <p className="text-small text-neutral-700">
                        {props.grant.description}
                    </p>
                </div>
                {props.grant.rounds ? <ScrollingBanner shouldPauseOnHover gap="40px">
                    {props.grant.rounds.map((round) => (
                        round.grant_rounds_id.amount[0] ?
                            <div key={round.grant_rounds_id.id} className="flex items-center gap-2 text-xl whitespace-nowrap">
                                <h6 className="text-neutral-800 text-3xl">{round.grant_rounds_id.title}</h6>
                                <p className="text-3xl text-green-700">
                                    {round.grant_rounds_id.amount[0].amount_id.number} {round.grant_rounds_id.amount[0].amount_id.quantity}
                                </p>
                            </div> : <></>
                    ))}
                </ScrollingBanner> : <></>}

            </CardBody>
            <CardFooter className="flex justify-between items-center px-6 py-4 font-mono">
                <div>
                    <div>
                        <p className="text-neutral-500 text-small">
                            {props.grant.start_time.split('T')[0]}
                            {' ~ '}
                            {props.grant.end_time.split('T')[0]}
                        </p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
