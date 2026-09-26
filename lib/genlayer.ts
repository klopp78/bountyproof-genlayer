import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export const BOUNTY_PROOF_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_BOUNTY_PROOF_CONTRACT_ADDRESS ??
    "0xD0DbCf127Ba660355e5Fce671e76A5d64b993495") as `0x${string}`;

export type WalletAddress = `0x${string}`;

export type ChainReadOptions = {
  walletAddress?: WalletAddress;
  contractAddress?: `0x${string}`;
};

export type BountyInput = {
  walletAddress: WalletAddress;
  programTitle: string;
  sponsorWallet: string;
  rewardCurrency: string;
  maxReward: string;
  rulesUrl: string;
  repositoryUrl: string;
  payoutPolicyUrl: string;
  contractAddress?: `0x${string}`;
};

export type ClaimInput = {
  walletAddress: WalletAddress;
  bountyId: string;
  claimantWallet: string;
  claimTitle: string;
  issueUrl: string;
  pullRequestUrl: string;
  commitUrl: string;
  reproductionUrl: string;
  requestedAmount: string;
  contractAddress?: `0x${string}`;
};

export function createBountyProofClient(walletAddress?: WalletAddress) {
  return createClient({
    chain: studionet,
    account: walletAddress,
  });
}

function createBountyProofWriteClient(walletAddress: WalletAddress) {
  const provider = typeof window !== "undefined" ? window.ethereum : undefined;
  if (!provider) throw new Error("No browser wallet detected.");

  return createClient({
    chain: studionet,
    account: walletAddress,
    provider,
  });
}

function bountyProofAddress(contractAddress?: `0x${string}`) {
  return contractAddress ?? BOUNTY_PROOF_CONTRACT_ADDRESS;
}

export async function readBounty(bountyId: string, options: ChainReadOptions = {}) {
  const client = createBountyProofClient(options.walletAddress);
  return client.readContract({
    address: bountyProofAddress(options.contractAddress),
    functionName: "get_bounty",
    args: [bountyId],
    jsonSafeReturn: true,
    leaderOnly: true,
  });
}

export async function readClaim(claimId: string, options: ChainReadOptions = {}) {
  const client = createBountyProofClient(options.walletAddress);
  return client.readContract({
    address: bountyProofAddress(options.contractAddress),
    functionName: "get_claim",
    args: [claimId],
    jsonSafeReturn: true,
    leaderOnly: true,
  });
}

export async function registerBounty({
  walletAddress,
  programTitle,
  sponsorWallet,
  rewardCurrency,
  maxReward,
  rulesUrl,
  repositoryUrl,
  payoutPolicyUrl,
  contractAddress,
}: BountyInput) {
  const client = createBountyProofWriteClient(walletAddress);
  const address = bountyProofAddress(contractAddress);
  const hash = await client.writeContract({
    address,
    functionName: "register_bounty",
    args: [programTitle, sponsorWallet, rewardCurrency, maxReward, rulesUrl, repositoryUrl, payoutPolicyUrl],
    value: BigInt(0),
    leaderOnly: false,
  });
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    fullTransaction: true,
  });
  const bountyId = idFromReceipt(receipt, /bounty_[a-f0-9]{20}/, "bounty");
  const { data: bounty, warning: readbackWarning } = await tryReadback(() =>
    readBounty(bountyId, { walletAddress, contractAddress: address }),
  );
  return { hash, receipt, bountyId, bounty, readbackWarning };
}

export async function assessClaim({
  walletAddress,
  bountyId,
  claimantWallet,
  claimTitle,
  issueUrl,
  pullRequestUrl,
  commitUrl,
  reproductionUrl,
  requestedAmount,
  contractAddress,
}: ClaimInput) {
  const client = createBountyProofWriteClient(walletAddress);
  const address = bountyProofAddress(contractAddress);
  const hash = await client.writeContract({
    address,
    functionName: "assess_claim",
    args: [bountyId, claimantWallet, claimTitle, issueUrl, pullRequestUrl, commitUrl, reproductionUrl, requestedAmount],
    value: BigInt(0),
    leaderOnly: false,
  });
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    fullTransaction: true,
  });
  const claimId = idFromReceipt(receipt, /award_[a-f0-9]{20}/, "claim");
  const { data: claim, warning: readbackWarning } = await tryReadback(() =>
    readClaim(claimId, { walletAddress, contractAddress: address }),
  );
  return { hash, receipt, claimId, claim, readbackWarning };
}

async function tryReadback<T>(read: () => Promise<T>): Promise<{ data: T | null; warning?: string }> {
  try {
    return { data: await read() };
  } catch (error) {
    return {
      data: null,
      warning: `The transaction was accepted, but the immediate readback was not available yet: ${compactError(error)}`,
    };
  }
}

export function compactError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    for (const key of ["shortMessage", "message", "reason", "details", "error"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}") return serialized;
  } catch {
    // Fall through to the generic message.
  }
  return "Unknown GenLayer transaction error.";
}

function idFromReceipt(receipt: unknown, pattern: RegExp, label: string): string {
  const id = collectStrings(receipt)
    .map((value) => value.match(pattern)?.[0])
    .find((value): value is string => Boolean(value));
  if (!id) {
    throw new Error(`Accepted ${label} transaction did not return its ID.`);
  }
  return id;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
}
