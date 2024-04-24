import React from "react";
import { Card, CardFooter, Image, Button, Link } from "@nextui-org/react";

export default function BannerWithButton() {
    return (
        <Card
            isFooterBlurred
            radius="lg"
            className="border-none relative"
        >
            <Image
                alt="Woman listing to music"
                className="object-cover"
                height={300}
                src="https://nexus.glorylab.xyz/1/2/Gitcoin_GG_20_f45d8d6652.png"
                width={600}
            />
            <CardFooter className="justify-between bg-secondary-100 before:bg-gradient-to-r before:from-yellow-400 before:to-yellow-600 border-white/20 border-1 overflow-hidden py-1 mx-4 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_32px)] shadow-small z-10">
                <p className="text-tiny text-secondary-800/80 text-start">Gitcoin GG20 has started!</p>
                <Button
                    as={Link}
                    href="https://explorer.gitcoin.co/#/round/42161/25/53"
                    target="_blank"
                    className="text-tiny font-mono text-white bg-secondary/90 font-bold"
                    variant="shadow" color="secondary"
                    radius="lg"
                    size="sm">
                    Support now
                </Button>
            </CardFooter>
        </Card>
    );
}