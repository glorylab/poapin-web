import { ethers } from "ethers";

export function createAnkrProvider(network: string, apiKey: string): ethers.AnkrProvider {
  return new ethers.AnkrProvider(network, apiKey);
}