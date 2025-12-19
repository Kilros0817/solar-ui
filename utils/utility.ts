import { TBDelegator } from "./constants";
import { toast } from "sonner";

/**
 * Checks if an address has EIP-7702 delegation to TBDelegator
 * @param address - The address to check
 * @param publicClient - The public client for blockchain interaction
 * @param TBDelegator - The delegator address from constants
 * @returns Promise<boolean> - True if the address is delegated to TBDelegator
 */
export const checkEIP7702Delegation = async (
  address: string, 
  publicClient: any, 
): Promise<boolean> => {
  try {
    // Get the bytecode of the address
    const bytecode = await publicClient.getBytecode({
      address: address as `0x${string}`
    });

    if (!bytecode || bytecode === '0x') {
      return false;
    }

    // EIP-7702 delegation bytecode format: 0xef0100 + 20-byte delegator address + 1-byte chainId + 1-byte version
    // The pattern should be: 0xef0100 + delegator address (20 bytes) + chainId (1 byte) + version (1 byte)
    const delegationPrefix = '0xef0100';
    
    // Check if bytecode starts with EIP-7702 prefix
    if (!bytecode.startsWith(delegationPrefix)) {
      return false;
    }

    // Extract the delegator address from the bytecode
    // Skip the prefix (0xef0100 = 6 characters) and get the next 40 characters (20 bytes)
    const delegatorInBytecode = '0x' + bytecode.slice(8, 48);
    
    // Compare with the expected TBDelegator address (case-insensitive)
    return delegatorInBytecode.toLowerCase() === TBDelegator.toLowerCase();
  } catch (error) {
    console.error('Error checking EIP-7702 delegation:', error);
    return false;
  }
}

/**
 * Copies an address to the clipboard and shows a toast notification
 * @param address - The address to copy
 * @returns Promise<boolean> - True if copy was successful, false otherwise
 */
export const copyAddressToClipboard = async (address: string): Promise<boolean> => {
  if (!address) {
    toast.error('No address to copy');
    return false;
  }

  try {
    await navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
    return true;
  } catch (error) {
    console.error('Failed to copy address:', error);
    toast.error('Failed to copy address');
    return false;
  }
}