import { TBDelegator, URLs } from "./constants";
import { toast } from "sonner";
import { approveClause } from "./interact";

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

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formats a date string or Unix timestamp to a locale date string
 * @param dateStr - Unix timestamp (seconds) or ISO date string
 * @returns Formatted date string or empty string if invalid
 */
export const formatRelativeDate = (dateStr: number): string => {
  const date = new Date(dateStr * 1000);
  return date.toLocaleDateString();
};

/** Normalize sectionContent from gateway (may be array of { clauseId, clauseContent } or strings) to Clause[]. */
function normalizeSectionContent(
  raw: unknown,
  minLength: number
): Array<{ clauseId: string; clauseContent: string }> {
  const arr = Array.isArray(raw) ? raw : [];
  const result: Array<{ clauseId: string; clauseContent: string }> = [];
  for (let i = 0; i < Math.max(arr.length, minLength); i++) {
    const item = arr[i];
    if (item && typeof item === 'object' && 'clauseContent' in item) {
      result.push({
        clauseId: typeof (item as { clauseId?: string }).clauseId === 'string' ? (item as { clauseId: string }).clauseId : `clause-${i}`,
        clauseContent: typeof (item as { clauseContent?: string }).clauseContent === 'string' ? (item as { clauseContent: string }).clauseContent : '',
      });
    } else if (typeof item === 'string') {
      result.push({ clauseId: `clause-${i}`, clauseContent: item });
    } else {
      result.push({ clauseId: `clause-${i}`, clauseContent: '' });
    }
  }
  return result;
}

/** Build new section JSON with the clause at clauseIndex replaced by newClauseContent (for approve flow). */
export const buildSectionWithReplacedClause = (
  currentSection: { sectionName: string; sectionContent: Array<{ clauseId: string; clauseContent: string }> },
  clauseIndex: number,
  newClauseContent: string,
): { sectionName: string; sectionContent: Array<{ clauseId: string; clauseContent: string }> } => {
  const content = currentSection.sectionContent ?? [];
  const sectionContent = content.length <= clauseIndex
    ? [...content, ...Array.from({ length: clauseIndex - content.length + 1 }, (_, i) => ({
        clauseId: `clause-${content.length + i}`,
        clauseContent: content.length + i === clauseIndex ? newClauseContent : '',
      }))]
    : content.map((c, i) =>
        i === clauseIndex ? { clauseId: c.clauseId ?? `clause-${i}`, clauseContent: newClauseContent } : { clauseId: c.clauseId ?? `clause-${i}`, clauseContent: c.clauseContent ?? '' }
      );
  return { sectionName: currentSection.sectionName, sectionContent };
};

/** Upload a single section to Pinata (UploadAPI) and return its CID. */
export const uploadSectionToPinata = async (section: {
  sectionName: string;
  sectionContent: Array<{ clauseId: string; clauseContent: string }>;
}): Promise<string> => {
  const res = await fetch(`${URLs.UploadAPI}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sections: [section] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to upload section");
  const sectionCidPairs = data.sectionCids ?? [];
  const cid = sectionCidPairs[0]?.cid;
  if (!cid) throw new Error("No section CID returned");
  return cid;
};

/** Approve clause: build new section JSON (replaced clause content), upload to Pinata, then call leaderReviewClause. */
export const approveClauseWithSectionUpdate = async (
  config: any,
  account: string,
  clauseId: number,
  currentSection: { sectionName: string; sectionContent?: unknown },
  clauseIndex: number,
  newClauseContent: string,
): Promise<boolean> => {
  const normalizedContent = normalizeSectionContent(
    currentSection.sectionContent,
    clauseIndex + 1
  );
  const normalizedSection = {
    sectionName: currentSection.sectionName,
    sectionContent: normalizedContent,
  };
  const newSection = buildSectionWithReplacedClause(normalizedSection, clauseIndex, newClauseContent);
  const sectionCid = await uploadSectionToPinata(newSection);
  return approveClause(config, account, clauseId, sectionCid);
};
