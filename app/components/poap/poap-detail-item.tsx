import React from "react";
import {
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    useDisclosure,
    BreadcrumbItem,
    Breadcrumbs,
    Chip
} from "@nextui-org/react";

import { cn } from "~/src/cn";
import { POAPDetail } from "~/types/poap";
import { POAPActivityData } from "~/types/data";
import { Link } from "@remix-run/react";

export type POAPDetailItemColor = {
    name: string;
    hex: string;
};

export type POAPDetailItemProps = Omit<React.HTMLAttributes<HTMLDivElement>, "id"> & {
    isPopular?: boolean;
    isLoading?: boolean;
    poap: POAPDetail;
    poapActivityData: POAPActivityData;
};

const POAPDetailItem = React.forwardRef<HTMLDivElement, POAPDetailItemProps>(
    (
        {
            poap: { event, supply, owner, tokenId },
            poapActivityData,
            className,
            ...props
        },
        ref,
    ) => {

        const { isOpen, onOpen, onClose } = useDisclosure();

        const handleOpen = () => {
            onOpen();
        }

        // If the owner is starting with 0x, we will show only the first 4 and the last 4 characters
        const shortOwner = owner.startsWith("0x")
            ? `${owner.slice(0, 6)}...${owner.slice(-4)}`
            : owner;

        return (
            <div
                ref={ref}
                className={cn(
                    "relative flex flex-col gap-4 pb-12 md:grid md:grid-cols-2 md:items-start md:gap-x-8 md:py-12",
                    className,
                )}
                {...props}
            >
                <div className="group relative md:max-w-sm md:aspect-square md:ml-8 overflow-visible p-4">
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
                            className="font-mono"
                            variant="flat">{supply.order}/{supply.total}</Chip>
                        }
                        {event.country && <Chip variant="flat">{event.country}</Chip>}
                        {event.city && <Chip variant="flat">{event.city}</Chip>}
                        {event.year && <Chip variant="flat">{event.year}</Chip>}
                    </div>
                    <div className="flex py-2">
                        {event.event_url && <Link to={event.event_url} prefetch="intent" target="_blank" color="primary">
                            {event.event_url}
                        </Link>}
                    </div>

                    <div className="mt-4">
                        <p className="sr-only">POAP event description</p>
                        <p className="text-medium text-default-500 whitespace-pre-wrap">{event.description}</p>
                    </div>
                </div>
                <Modal backdrop={"blur"} isOpen={isOpen} onClose={onClose}>
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1"> Who owns this POAP?</ModalHeader>
                                <ModalBody>
                                    <div className="mt-10">

                                        {poapActivityData.data.tokens.map((activity, index) => (
                                            <div key={index} className="flex-auto cursor-default font-mono p-2 max-w-xl mb-4 rounded-2xl overflow-clip shadow-sm hover:shadow-xl transition-all duration-200 border-dashed border-1.5 hover:border-dotted">
                                                <span>{activity.owner.ens ? activity.owner.ens : activity.owner.id}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ModalBody>
                                <ModalFooter>
                                </ModalFooter>
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
