// @ts-nocheck - Suppress chain property requirement errors for writeContract calls
import { writeContract, readContract, readContracts, waitForTransactionReceipt, getWalletClient } from "@wagmi/core";
import axios from "axios";
import {
  SDMSContract,
} from "./contracts";
import { createPublicClient, createWalletClient, encodePacked, http, keccak256, zeroAddress } from "viem";
import { SiweMessage } from "siwe";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { getWeb3AuthInstance } from "@/utils/Web3AuthStore";
import { encodeFunctionData } from "viem";
import { TBDelegator, TBDelegatorABI, TBSponsor, URLs, BaseRPC1 } from "./constants";

export const getAuthorization = async (config: any) => {
  const web3Auth = getWeb3AuthInstance();
  if (!web3Auth) throw new Error("Web3Auth not initialized");
  const pk = await web3Auth.provider.request({ method: "eth_private_key" });
  const account = privateKeyToAccount(`0x${pk}`);
  const walletClient = await getWalletClient(config);
  const authorization = await walletClient.signAuthorization({
    account,
    contractAddress: TBDelegator,
    executor: TBSponsor,
  });
  return { account: account.address, authorization };
}

export const delegate = async (config) => {
  try {
    const { account, authorization } = await getAuthorization(config);

    const payload = { account, authorization };
    const safePayload = JSON.parse(
      JSON.stringify(payload, (_, v) => (typeof v === 'bigint' ? v.toString() : v))
    );

    const response = await axios.post(`${URLs.SDMSAPI}/delegate`,
      safePayload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.isSuccess;
  } catch (e) {
    return false;
  }
}

const runSponsorTx = async (
  config: any,
  account: string,
  functionName: string,
  args: any[],
): boolean => {
  try {

    const walletClient = await getWalletClient(config);
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BaseRPC1)
    });

    // Get the contract ABI from SDMSContract
    const contractABI = SDMSContract.abi;

    // Encode the function call data
    const encodedData = encodeFunctionData({
      abi: contractABI,
      functionName: functionName,
      args: args
    });

    const calls = [{
      to: SDMSContract.address,
      value: 0n,
      data: encodedData,
    }];

    let encodedCallBytes = '0x';
    for (const call of calls) {
      const callEncoded = encodePacked(
        ["address", "uint256", "bytes"],
        [call.to, call.value, call.data]
      );
      encodedCallBytes = encodePacked(
        ["bytes", "bytes"],
        [encodedCallBytes, callEncoded]
      );
    };

    const nonce = await publicClient.readContract({
      address: account,
      abi: TBDelegatorABI,
      functionName: "nonce",
    });

    const digest = keccak256(
      encodePacked(["uint256", "bytes"], [BigInt(nonce), encodedCallBytes])
    );

    const signature = await walletClient.signMessage({
      account,
      message: { raw: digest },
    });

    const encodedCallData = encodeFunctionData({
      abi: TBDelegatorABI,
      functionName: 'execute',
      args: [calls, signature],
    });

    try {
      const response = await axios.post(`${URLs.SDMSAPI}/sponsor-tx`,
        {
          address: account,
          callData: encodedCallData
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error run EIP-7702 sponsor tx:', error);
      return { isSuccess: false }
    }
  } catch (error) {
    console.error('Error generating EIP-7702 sponsor call data:', error);
    return { isSuccess: false };
  }
}

export const getUserRole = async (config, address) => {
  const res = await readContract(config, {
    ...SDMSContract,
    functionName: "memberInfo",
    args: [address]
  })
  return { role: res[1], firstName: res[3], lastName: res[4] };
}

export const requestRegister = async (config: any, account: any, firstname: string, lastname: string, email: string) => {
  const res = await runSponsorTx(config, account, "requestRegister", [firstname, lastname, email]);
  if (res.isSuccess) {
    return true;
  }

  return false;
}

// Accept register request and assign role/division
export const acceptRegisterRequest = async (
  config: any,
  account: string,
  address: string,
  role: number,
  divisionCategory: number
) => {
  const res = await runSponsorTx(config, account, "acceptRegisterRequest", [address, role, divisionCategory]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// Decline register request
export const declineRegisterRequest = async (
  config: any,
  account: string,
  address: string
) => {
  const res = await runSponsorTx(config, account, "declineRegisterRequest", [address]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// Create contract
export const createContract = async (
  config: any,
  account: string,
  clientAddress: string,
  cLabel: string,
  title: string,
  docCid: string,
  divisionLeaders: string[],
  sectionCids: string[],
) => {
  const res = await runSponsorTx(config, account, "createDoc", [clientAddress, cLabel, title, docCid, divisionLeaders, sectionCids]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// assign clauses to members
export const assignClausesToMembers = async (
  config: any,
  account: string,
  sectionId: number,
  divisionMembers: string[],
  clauseCids: string[],
) => {
  const res = await runSponsorTx(config, account, "assignClausesToMembers", [sectionId, divisionMembers, clauseCids]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// submit clause to division leader
export const submitClauseToLeader = async (
  config: any,
  account: string,
  clauseId: number,
  clauseCid: string,
) => {
  const res = await runSponsorTx(config, account, "submitClause", [clauseId, clauseCid]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// approve clause (caller must pass sectionCid from utility.uploadSectionToPinata after building section with utility.buildSectionWithReplacedClause)
export const approveClause = async (
  config: any,
  account: string,
  clauseId: number,
  sectionCid: string,
) => {
  const res = await runSponsorTx(config, account, "leaderReviewClause", [clauseId, true, sectionCid]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// reject clause
export const rejectClause = async (
  config: any,
  account: string,
  clauseId: number,
) => {
  const res = await runSponsorTx(config, account, "leaderReviewClause", [clauseId, false, ""]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// reassign clause
export const reassignClause = async (
  config: any,
  account: string,
  clauseId: number,
) => {
  const res = await runSponsorTx(config, account, "reassignClause", [clauseId]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

// submit section to legal team (division leader)
export const submitSectionToLegal = async (
  config: any,
  account: string,
  sectionId: number,
  sectionCid: string,
) => {
  const res = await runSponsorTx(config, account, "submitSectionToLegal", [sectionId, sectionCid]);
  if (res.isSuccess) {
    return true;
  }
  return false;
}

