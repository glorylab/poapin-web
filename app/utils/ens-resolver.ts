import { getEnv } from "~/src/env";

/**
 * Resolves ENS name to Ethereum address using a simple HTTP service
 */
export async function resolveENSToAddress(ensName: string, context: any): Promise<string | null> {
  // If it's already an Ethereum address, return as is
  if (isEthereumAddress(ensName)) {
    return ensName;
  }

  // If it's not an ENS name, return null
  if (!isENSName(ensName)) {
    return null;
  }

  try {
    const response = await fetch(`https://api.ensideas.com/ens/resolve/${ensName}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`ENS resolution failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json() as {
      address?: string;
      error?: string;
    };
    
    if (data.error) {
      console.error('ENS resolution error:', data.error);
      return null;
    }

    const resolvedAddress = data.address;
    
    // Validate the resolved address
    if (resolvedAddress && isEthereumAddress(resolvedAddress)) {
      return resolvedAddress;
    }

    return null;
  } catch (error) {
    console.error('Error resolving ENS name:', error);
    return null;
  }
}

/**
 * Checks if a string is a valid Ethereum address
 */
export function isEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Checks if a string is a valid ENS name
 */
export function isENSName(name: string): boolean {
  return /^[a-zA-Z0-9-]+\.eth$/.test(name);
}

/**
 * Resolves an address (ENS or ETH) to an Ethereum address
 * Returns the original address if it's already an ETH address
 * Returns the resolved address if it's an ENS name
 * Returns null if resolution fails
 */
export async function resolveAddress(address: string, context: any): Promise<string | null> {
  if (isEthereumAddress(address)) {
    return address;
  }
  
  if (isENSName(address)) {
    return await resolveENSToAddress(address, context);
  }
  
  return null;
}
