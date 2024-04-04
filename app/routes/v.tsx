import { Input } from "@nextui-org/react";
import { SearchIcon } from "~/components/shared/common-icons";

export default function ExplorePage() {
    return (
        <div
            className=
            "h-screen w-full"
        >
            <section
                className="max-w-sm mx-auto relative py-8 lg:py-16 px-2 xs:px-8"
            >
                <Input
                    label="Search"
                    isClearable
                    radius="lg"
                    classNames={{
                        mainWrapper: [
                            "transition-all duration-200",
                            "shadow-xl shadow-background-50/40",
                            "hover:shadow-lg focus:shadow-md",
                            "bg-background-200/50",
                            "backdrop-blur-xl",
                            "backdrop-saturate-200",
                            "group-data-[focused=true]:bg-background-200/50",
                        ],
                        label: [
                            "group-data-[hover=true]:text-background-900",
                        ],
                        inputWrapper: [
                            "transition-all duration-200",
                            "shadow-xl shadow-background-50/40",
                            "hover:shadow-lg focus:shadow-md",
                            "bg-background-200/50",
                            "backdrop-blur-xl",
                            "backdrop-saturate-200",
                            "group-data-[hover=true]:scale-[1.1] group-data:transition-all group-data:duration-200",
                            "group-data-[focused=true]:bg-background-100/50",
                            "group-data-[hover=true]:bg-background-100/50",
                            "group-data-[active=true]:bg-background-100/50",
                            "!cursor-text",
                        ],
                    }}
                    placeholder="Type to search..."
                    startContent={
                        <SearchIcon className="text-black/50 mb-0.5 text-slate-400 pointer-events-none flex-shrink-0" />
                    }
                />
            </section>
        </div>
    );
}