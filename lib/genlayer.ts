import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export const BOUNTY_PROOF_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_BOUNTY_PROOF_CONTRACT_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

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
  const client = createBountyProofClient(walletAddress);
  await client.connect("studionet");
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
  const bountyId = returnedIdFromReceipt(receipt, "bounty_", "bounty");
  const bounty = await readBounty(bountyId, { walletAddress, contractAddress: address });
  return { hash, receipt, bountyId, bounty };
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
  const client = createBountyProofClient(walletAddress);
  await client.connect("studionet");
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
  const claimId = returnedIdFromReceipt(receipt, "award_", "claim");
  const claim = await readClaim(claimId, { walletAddress, contractAddress: address });
  return { hash, receipt, claimId, claim };
}

function returnedIdFromReceipt(receipt: unknown, prefix: string, label: string): string {
  const id = collectStrings(receipt).find((value) => value.startsWith(prefix));
  if (!id) {
    throw new Error(`Accepted ${label} transaction did not return its ${prefix} ID.`);
  }
  return id;
}

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value as Record<string, unknown>).flatMap(collectStrings);
}
