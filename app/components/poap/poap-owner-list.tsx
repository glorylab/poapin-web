import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, useNavigation } from "@remix-run/react";
import { cn } from "~/src/cn";
import { POAPActivityData } from "~/types/data";

export type POAPOwnerListProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
    poapActivityData: POAPActivityData;
    frontQuantity: number;
    backQuantity: number;
};

export const POAPOwnerList: React.FC<POAPOwnerListProps> = ({ poapActivityData,
    frontQuantity, backQuantity }) => {

    const navigation = useNavigation();

    function isNavigatingToAddress(address: string) {
        return navigation.state === "loading" && navigation.location.pathname === `/v/${address}`;
    }

    // Use total count from GraphQL response, fallback to current page count
    const ownersCount = poapActivityData.data.total || poapActivityData.data.tokens.length;
    return (<div className="mx-auto w-full max-w-2xl px-4 flex flex-col justify-center items-center py-8">

        <div className="py-2">
            <h3 className="text-2xl font-bold font-mono text-background-900">Top Collectors</h3>
            <p className="text-sm text-background-700">Sorted by total POAPs owned</p>
        </div>
        <ul className="w-full list-none" aria-label="List of POAP owners">
            {poapActivityData.data.tokens.map((activity, index) => (
                <li key={index}>
                    <Link
                        to={`/v/${activity.owner.ens ? activity.owner.ens : activity.owner.id}`}
                        className="block w-full min-w-0"
                        aria-label={`View profile of ${activity.owner.ens ? activity.owner.ens : activity.owner.id}`}
                    >
                        <div
                            className={cn(
                                "rounded-xl mt-4 border border-neutral-100 hover:shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]",
                                "cursor-pointer transition-all duration-200",
                                "flex flex-row bg-neutral-50/30 items-center font-mono p-3 sm:p-4 mb-2 rounded-xl shadow-sm active:shadow-none border-dashed border-1 hover:border-solid",
                                "w-full max-w-full overflow-hidden", // Ensure container respects screen width
                            )}
                            role="button"
                        >
                            {/* Left section with ENS icon and address - takes remaining space */}
                            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
                                {activity.owner.ens && 
                                    <Icon 
                                        icon="token:ens" 
                                        width="1rem" 
                                        height="1rem" 
                                        className="inline-block opacity-60 flex-shrink-0" 
                                        aria-label="ENS name" 
                                    />
                                }
                                {!isNavigatingToAddress(activity.owner.ens ? activity.owner.ens : activity.owner.id) &&
                                    <span className="text-ellipsis overflow-hidden whitespace-nowrap text-xs sm:text-sm">
                                        {activity.owner.ens ? activity.owner.ens : activity.owner.id}
                                    </span>
                                }
                                {isNavigatingToAddress(activity.owner.ens ? activity.owner.ens : activity.owner.id) &&
                                    <span className="text-secondary-600 text-xs sm:text-sm" aria-live="polite">Loading...</span>
                                }
                            </div>
                            
                            {/* Right section with POAP count - fixed position */}
                            <span className="text-xs sm:text-sm text-background-700 font-medium flex-shrink-0 ml-1 sm:ml-2 whitespace-nowrap">
                                {activity.owner.tokensOwned}
                            </span>
                        </div>
                    </Link>
                </li>
            ))}
        </ul>
    </div>);
}
