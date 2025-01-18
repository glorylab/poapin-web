import React, { useEffect } from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure,
    BreadcrumbItem,
    Breadcrumbs,
    Chip,
    Button
} from "@heroui/react";

import { cn } from "~/src/cn";
import { POAPDetail } from "~/types/poap";
import { POAPActivityData } from "~/types/data";
import { Link, useNavigation } from "@remix-run/react";
import { Icon } from "@iconify/react/dist/iconify.js";

export type POAPDetailItemColor = {
    name: string;
    hex: string;
};

export type POAPDetailItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
    isPopular?: boolean;
    isLoading?: boolean;
    poap: POAPDetail;
    poapActivityData: POAPActivityData;
    frontQuantity: number;
    backQuantity: number;
};

const POAPDetailItem = React.forwardRef<HTMLDivElement, POAPDetailItemProps>(
    (
        {
            poap: { event, supply, owner, tokenId },
            poapActivityData,
            frontQuantity,
            backQuantity,
            className,
            ...props
        },
        ref,
    ) => {

        const { isOpen, onOpen, onClose } = useDisclosure();
        const navigation = useNavigation();

        const handleOpen = () => {
            onOpen();
        }

        // If the owner is starting with 0x, we will show only the first 4 and the last 4 characters
        const shortOwner = owner.startsWith("0x")
            ? `${owner.slice(0, 6)}...${owner.slice(-4)}`
            : owner;

        function isNavigatingToAddress(address: string) {
            return navigation.state === "loading" && navigation.location.pathname === `/v/${address}`;
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex flex-col gap-4 pb-12 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:py-12",
                    className,
                )}
                {...props}
            >
                <div className="group relative md:max-w-sm md:aspect-square md:ml-8 overflow-visible p-4 md:sticky md:top-20">
                    <div className="relative">

                        <img
                            alt={event.name}
                            className="h-full w-full rounded-full transition-all duration-500 ease-in-out object-cover blur-2xl group-hover:blur-lg group-active:blur-xl"
                            src={event.image_url}
                        />
                        <img
                            alt={event.name}
                            className="absolute inset-0 h-full w-full rounded-full object-cover group-hover:p-2 group-active:p-1 transition-all duration-500 ease-in-out"
                            src={event.image_url}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:max-w-sm px-8 py-4 backdrop-blur-xl">
                    <div className="flex flex-col flex-wrap mb-4 mt-2">

                        <Breadcrumbs
                            classNames={{
                                list: "font-mono text-primary bg-gradient-to-br from-secondary-400 to-secondary-200 shadow-lg shadow-secondary-50/30",
                            }}
                            variant={"solid"}>
                            <BreadcrumbItem
                                href={`/v/${owner}`}
                                target="_blank"
                                classNames={{
                                    item: "text-secondary-700 hover:text-secondary-900",
                                }}
                            >{shortOwner}</BreadcrumbItem>
                            <BreadcrumbItem
                                classNames={{
                                    item: "text-secondary-600"
                                }}
                            >#{tokenId}</BreadcrumbItem>
                        </Breadcrumbs>

                    </div>
                    <h1 className="text-3xl text-primary font-bold tracking-tight">{event.name}</h1>
                    <h2 className="sr-only">POAP information</h2>
                    <div className="my-2 flex items-center gap-2">
                    </div>
                    <div className="flex gap-2 pb-1 pt-2">
                        {<Chip
                            onClick={() => handleOpen()}
                            className="font-mono cursor-pointer hover:bg-secondary-100 hover:text-secondary-700 transition-all duration-200 hover:shadow-lg hover:scale-[0.96] active:scale-[0.94]"
                            variant="flat">{supply.order}/{supply.total}</Chip>
                        }
                        {event.country && <Chip variant="flat">{event.country}</Chip>}
                        {event.city && <Chip variant="flat">{event.city}</Chip>}
                        {event.year && <Chip variant="flat">{event.year}</Chip>}
                    </div>
                    <div className="flex py-2">
                        {event.event_url &&
                            <Link
                                to={event.event_url}
                                rel="noreferrer"
                                className="text-primary hover:opacity-80 transition-all duration-200 flex flex-row items-center gap-2 hover:underline"
                                prefetch="intent" target="_blank" color="primary">
                                <Icon icon="akar-icons:link" width="1rem" height="1rem" className="inline-block" />
                                {event.event_url}
                            </Link>}
                    </div>

                    <div className="mt-4">
                        <p className="sr-only">POAP event description</p>
                        <p className="text-medium text-default-500 whitespace-pre-wrap">{event.description}</p>
                    </div>
                </div>
                <Modal
                    classNames={{
                        base: "max-h-[90vh] h-auto",
                        body: "max-h-[calc(90vh-130px)] overflow-y-auto",
                    }}
                    backdrop={"blur"}
                    isOpen={isOpen}
                    isDismissable
                    hideCloseButton
                    onClose={onClose}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1 border-b-1 border-neutral-200">{poapActivityData.data.total} POAPs</ModalHeader>
                                <ModalBody>
                                    {frontQuantity > 0 && (
                                        <div className="flex flex-col justify-center items-center bg-neutral-50 border border-neutral-300 rounded-md p-2">
                                            <p><span className="font-mono font-bold ">{frontQuantity}</span> friends also got it</p>
                                            <p className="text-neutral-400 text-sm">after <span className="font-mono">{poapActivityData.data.tokens[0].created}</span>.</p>
                                        </div>
                                    )}
                                    <div className="my-0">

                                        {poapActivityData.data.tokens.map((activity, index) => (
                                            <Link
                                                key={index}
                                                to={`/v/${activity.owner.ens ? activity.owner.ens : activity.owner.id}`}
                                            >
                                                <div key={index} className="flex flex-row items-center cursor-pointer text-ellipsis overflow-hidden font-mono gap-2 p-2 max-w-xl mb-2 rounded-xl shadow-sm hover:shadow-md active:shadow-none transition-all duration-200 border-dashed border-1.5 hover:border-solid">
                                                    {activity.owner.ens && <Icon icon="token:ens" width="1.2rem" height="1.2rem" className="inline-block opacity-60" />}
                                                    {!isNavigatingToAddress(activity.owner.ens ? activity.owner.ens : activity.owner.id) && <span className="text-ellipsis">{activity.owner.ens ? activity.owner.ens : activity.owner.id}</span>}
                                                    {isNavigatingToAddress(activity.owner.ens ? activity.owner.ens : activity.owner.id) && <span className="text-secondary-600">Loading...</span>}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {backQuantity > 0 && (
                                        <div className="flex flex-col justify-center items-center bg-neutral-50 border border-neutral-300 rounded-md p-2">
                                            <p className="text-neutral-400 text-sm">Before <span className="font-mono ">{poapActivityData.data.tokens[poapActivityData.data.tokens.length - 1].created}</span></p>
                                            <p><span className="font-mono font-bold ">{backQuantity}</span> people shared the same memory.</p>
                                        </div>
                                    )}
                                </ModalBody>
                                {/* <ModalFooter className="border-t-1 border-neutral-100">
                                    <Button
                                        variant="shadow"
                                        className="w-full bg-background-100 text-base font-medium tracking-wide text-background-600 hover:bg-background-200 hover:text-background-900"
                                    >
                                        Load more
                                    </Button>
                                </ModalFooter> */}
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        );
    },
);

POAPDetailItem.displayName = "POAP Detail Item";

export default POAPDetailItem;
