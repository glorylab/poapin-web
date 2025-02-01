import { LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { showResultsAtom, walletAddressAtom } from "~/atoms/address";
import { AddressDisplay } from "~/components/card/address-display";
import { ResultBox } from "~/components/card/result-box";
import { motion } from "framer-motion";

export async function loader({ params }: LoaderFunctionArgs) {
    const address = params.address;
    if (!address) {
        throw new Response("Not Found", { status: 404 });
    }
    return json({ address });
}

export default function CardAddressPage() {
    const { address } = useLoaderData<typeof loader>();
    const [, setWalletAddress] = useAtom(walletAddressAtom);
    const [, setShowResults] = useAtom(showResultsAtom);
    const navigate = useNavigate();

    useEffect(() => {
        setWalletAddress(address);
        setShowResults(true);
    }, [address, setWalletAddress, setShowResults]);

    const handleBack = () => {
        navigate("/card");
    };

    return (
        <div className="w-full mx-auto px-2 md:px-4 lg:px-8">
            <div className="max-w-2xl w-full mx-auto border-x-1 md:border-x-2 lg:border-x-4 border-yellow-400 border-solid shadow-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-neutral-50 p-8"
                >
                    <h2 className="text-2xl font-bold text-center mb-6">Showcase your POAP collection</h2>
                    <AddressDisplay onBack={handleBack} />
                    <ResultBox walletAddress={address} />
                </motion.div>
            </div>
        </div>
    );
}
