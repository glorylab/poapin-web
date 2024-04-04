import AddressInputComponent from "~/components/poap/address-input";

export default function ExplorePage() {
    return (
        <div
            className=
            "h-screen w-full"
        >
            <section
                className="max-w-md mx-auto relative pb-8 pt-4 lg:pt-16 lg:pb-12 px-2 xs:px-8"
            >
                <div className="">
                    <AddressInputComponent />
                </div>

            </section>
        </div>
    );
}