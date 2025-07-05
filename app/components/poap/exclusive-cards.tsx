import { OGImageCard } from "~/components/poap/og-image-card";

interface ExclusiveCardsProps {
    address: string;
}

export function ExclusiveCards({ address }: ExclusiveCardsProps) {
    if (!address) return null;

    return (
        <div className="flex flex-col gap-2 p-4 bg-default-50 bg-opacity-30 backdrop-blur-sm rounded-medium mx-auto mb-4">
            <h2 className="text-medium font-medium text-background-700">Exclusive Cards</h2>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <OGImageCard
                        address={address}
                        theme="default"
                        className="bg-[#d4dbe0]"
                    />
                </div>
                <div className="flex-1">
                    <OGImageCard
                        address={address}
                        theme="letter"
                        className="bg-[#E8E4D8]"
                    />
                </div>
                <div className="flex-1">
                    <OGImageCard
                        address={address}
                        theme="gallery"
                        className="bg-[#E8E4D8]"
                    />
                </div>
            </div>
        </div>
    );
}
