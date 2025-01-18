import { Button, Input, Card, Tooltip } from "@heroui/react";
import { useState } from "react";
import { Icon } from "@iconify/react";

interface AddressFormProps {
    onSubmit: (address: string) => void;
}

export function AddressForm({ onSubmit }: AddressFormProps) {
    const [walletAddress, setWalletAddress] = useState("");
    const [isValidAddress, setIsValidAddress] = useState(true);

    const isValidEthAddress = (address: string) => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    };

    const isValidEns = (address: string) => {
        return /^[a-zA-Z0-9-]+\.eth$/.test(address);
    };

    const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const address = e.target.value;
        setWalletAddress(address);
        setIsValidAddress(isValidEthAddress(address) || isValidEns(address));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isValidAddress && walletAddress) {
            onSubmit(walletAddress);
        }
    };

    const getInputColor = () => {
        if (!walletAddress) return "default";
        return isValidAddress ? "success" : "danger";
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col max-w-2xl mx-auto">
            <Card
                shadow="none"
                className="p-4 rounded-none bg-transparent">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Icon icon="heroicons:wallet-20-solid" className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-700">Where is your POAP?</h3>
                    </div>
                    <Input
                        type="text"
                        placeholder="ETH address (0x...) or ENS (...eth)"
                        value={walletAddress}
                        labelPlacement="outside"
                        onChange={handleWalletAddressChange}
                        color={getInputColor()}
                        variant="bordered"
                        size="lg"
                        startContent={
                            <Icon icon="cryptocurrency:eth" className="w-5 h-5 text-gray-400" />
                        }
                        endContent={
                            walletAddress && (
                                <Tooltip content={isValidAddress ? "Valid address" : "Invalid address"}>
                                    <Icon
                                        icon={isValidAddress ? "heroicons:check-circle-20-solid" : "heroicons:exclamation-circle-20-solid"}
                                        className={`w-5 h-5 ${isValidAddress ? 'text-green-500' : 'text-red-500'}`}
                                    />
                                </Tooltip>
                            )
                        }
                        classNames={{
                            label: "text-gray-600 font-medium",
                            input: "text-lg",
                            inputWrapper: [
                                "shadow-sm",
                                "backdrop-blur-sm",
                                "backdrop-saturate-200",
                                "hover:bg-white/80",
                                "group-data-[focused=true]:bg-white/80",
                            ],
                        }}
                        errorMessage={!isValidAddress && walletAddress && "Please enter a valid ETH address or ENS name"}
                    />
                    <div className="flex justify-center mt-8">
                        <Button
                            type="submit"
                            size="lg"
                            color="secondary"
                            variant="shadow"
                            disabled={!isValidAddress || !walletAddress}
                            className="w-full sm:w-auto font-bold tracking-wide cursor-pointer rounded-lg px-6 py-4"
                            startContent={<Icon icon="fluent:flash-sparkle-24-filled" className="w-5 h-5" />}
                        >
                            Get Exclusive Card
                        </Button>
                    </div>
                </div>
            </Card>
        </form>
    );
}
