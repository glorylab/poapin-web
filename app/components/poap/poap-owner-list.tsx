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

    const ownersCount = frontQuantity + backQuantity + poapActivityData.data.tokens.length;
    return (<div className="mx-auto min-w-96 w-full flex flex-col justify-center items-center py-8">

        <div className="py-2">
            <h3 className="text-2xl font-bold font-mono text-background-900">{ownersCount} Owners</h3>
        </div>

        {frontQuantity > 0 && (
            <div className="flex flex-col justify-center items-center bg-neutral-50/10 border border-neutral-300 rounded-md p-2 my-2">
                <p className="text-background-100 "><span className="text-background-100 font-mono font-bold ">{frontQuantity}</span> friends also got it</p>
                <p className="text-background-100 text-sm">after <span className="font-mono">{poapActivityData.data.tokens[0].created}</span>.</p>
            </div>
        )}
        <div className="max-w-2xl w-full px-2">
            {poapActivityData.data.tokens.map((activity, index) => (
                <Link
                    key={index}
                    to={`/v/${activity.owner.ens ? activity.owner.ens : activity.owner.id}`}
                    className="block w-full"
                >
                    <div

                        className={cn(
                            "rounded-xl -mr-4 mt-4 border border-neutral-100 flex-shrink-0 hover:shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)]",
                            "cursor-pointer transition-all duration-200",
                            "flex flex-row bg-neutral-50/30 items-center text-ellipsis overflow-hidden font-mono gap-2 p-4 w-full mb-2 rounded-xl shadow-sm active:shadow-none transition-all duration-200 border-dashed border-1 hover:border-solid",
                        )}

                    >
                        {activity.owner.ens && <Icon icon="token:ens" width="1.2rem" height="1.2rem" className="inline-block opacity-60 flex-shrink-0" />}
                        {!isNavigatingToAddress(activity.owner.ens ? activity.owner.ens : activity.owner.id) &&
                            <span className="text-ellipsis overflow-hidden whitespace-nowrap flex-grow">
                                {activity.owner.ens ? activity.owner.ens : activity.owner.id}
                            </span>
                        }
                        {isNavigatingToAddress(activity.owner.ens ? activity.owner.ens : activity.owner.id) &&
                            <span className="text-secondary-600 flex-grow">Loading...</span>
                        }
                    </div>
                </Link>
            ))}
        </div>
        {backQuantity > 0 && (
            <div className="flex flex-col justify-center items-center bg-neutral-50/10 border border-neutral-300 rounded-md p-2 my-2">
                <p className="text-background-100 text-sm">Before <span className="font-mono ">{poapActivityData.data.tokens[poapActivityData.data.tokens.length - 1].created}</span></p>
                <p className="text-background-100"><span className="text-background-100 font-mono font-bold ">{backQuantity}</span> people shared the same memory.</p>
            </div>
        )}
    </div>);
}
