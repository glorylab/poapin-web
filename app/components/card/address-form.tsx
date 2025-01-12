import { Button, Input } from "@nextui-org/react";
import { useState } from "react";

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

    return (
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col justify-center">
            <Input
                type="text"
                label="Where you store your POAPs"
                placeholder="ETH address or ENS"
                value={walletAddress}
                labelPlacement="outside"
                onChange={handleWalletAddressChange}
                classNames={{
                    input: "text-lg !text-gray-800",
                    label: "!text-gray-800",
                    inputWrapper: "text-gray-800",
                }}
                errorMessage={!isValidAddress && "Please enter a valid ETH address or ENS"}
            />
            <Button
                type="submit"
                size="lg"
                disabled={!isValidAddress || !walletAddress}
                className="bg-green-500 tracking-wider text-white px-8 text-2xl py-4 font-bold w-auto mx-auto"
            >
                Go
            </Button>
        </form>
    );
}
