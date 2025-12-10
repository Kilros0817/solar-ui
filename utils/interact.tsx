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

export const getUserRole = async (config, address) => {
  const res = await readContract(config, {
    ...SDMSContract,
    functionName: "memberInfo",
    args: [address]
  })

  return res;
}


export const getUserStatus = async (config, address) => {
  const res = await readContract(config, {
    ...SDMSContract,
    functionName: "users",
    args: [address]
  })

  return res[6];
}

export const getSubscribe = async (config, address) => {
  const res = await readContract(config, {
    ...SDMSContract,
    functionName: "deadline",
    args: [address]
  })

  const now = Math.floor((new Date()).getTime() / 1000);
  return Number(res) > now;
}


