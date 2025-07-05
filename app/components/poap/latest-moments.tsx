import { Moment } from "~/types/poap";
import Marquee from "~/components/shared/marquee";
import { MomentCard } from "~/components/poap/moment-card";

interface LatestMomentsProps {
    latestMoments: Moment[];
}

export function LatestMoments({ latestMoments }: LatestMomentsProps) {
    if (!latestMoments || latestMoments.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 p-4 bg-default-50 bg-opacity-30 backdrop-blur-sm rounded-medium mx-auto mb-4">
            <h2 className="text-medium font-medium text-background-700">Latest Moments</h2>
            <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-lg">
                <Marquee pauseOnHover>
                    {latestMoments.map((moment) => (
                        <MomentCard key={moment.id} moment={moment} />
                    ))}
                </Marquee>
            </div>
        </div>
    );
}
