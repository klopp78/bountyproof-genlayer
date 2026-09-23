"use client";

import { useState } from "react";
import { assessClaim, BOUNTY_PROOF_CONTRACT_ADDRESS, type WalletAddress } from "@/lib/genlayer";

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

export default function ClaimPage() {
  const [bountyId, setBountyId] = useState("bounty_");
  const [claimantWallet, setClaimantWallet] = useState("0x0000000000000000000000000000000000000002");
  const [claimTitle, setClaimTitle] = useState("Fix missing authorization check in API route");
  const [issueUrl, setIssueUrl] = useState("https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/issue.md");
  const [prUrl, setPrUrl] = useState("https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/pull-request.md");
  const [commitUrl, setCommitUrl] = useState("https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/commit.md");
  const [reproUrl, setReproUrl] = useState("https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/reproduction.md");
  const [amount, setAmount] = useState("750");
  const [address, setAddress] = useState(BOUNTY_PROOF_CONTRACT_ADDRESS);
  const [wallet, setWallet] = useState<WalletAddress | null>(null);
  const [message, setMessage] = useState("Paste a bounty ID and submit claim evidence for consensus review.");
  const [record, setRecord] = useState("");
  const [busy, setBusy] = useState(false);

  async function connectWallet() {
    if (!window.ethereum) throw new Error("No browser wallet detected.");
    const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as WalletAddress[];
    if (!accounts[0]) throw new Error("No wallet account returned.");
    setWallet(accounts[0]);
    return accounts[0];
  }

  async function submit() {
    try {
      setBusy(true);
      setRecord("");
      setMessage("Waiting for validators to compare claim evidence with bounty rules...");
      const account = wallet ?? (await connectWallet());
      const result = await assessClaim({
        walletAddress: account,
        bountyId,
        claimantWallet,
        claimTitle,
        issueUrl,
        pullRequestUrl: prUrl,
        commitUrl,
        reproductionUrl: reproUrl,
        requestedAmount: amount,
        contractAddress: address as `0x${string}`,
      });
      setRecord(typeof result.claim === "string" ? result.claim : JSON.stringify(result.claim, null, 2));
      setMessage(`Claim assessment accepted: ${result.claimId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 text-[#161814]">
      <a className="pill" href="/">BountyProof</a>
      <h1 className="mt-7 text-4xl font-semibold">Assess bounty claim</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[#596452]">
        Submit issue, PR, commit, and reproduction evidence. The contract stores
        an award_* verdict tied to validator-fetched source commitments.
      </p>
      <section className="tool-panel mt-8 grid gap-4">
        <Field id="bounty" label="Bounty ID" value={bountyId} setValue={setBountyId} />
        <Field id="claimant" label="Claimant wallet" value={claimantWallet} setValue={setClaimantWallet} />
        <Field id="title" label="Claim title" value={claimTitle} setValue={setClaimTitle} />
        <Field id="issue" label="Issue URL" value={issueUrl} setValue={setIssueUrl} />
        <Field id="pr" label="Pull request URL" value={prUrl} setValue={setPrUrl} />
        <Field id="commit" label="Commit URL" value={commitUrl} setValue={setCommitUrl} />
        <Field id="repro" label="Reproduction URL" value={reproUrl} setValue={setReproUrl} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="amount" label="Requested amount" value={amount} setValue={setAmount} />
          <Field id="address" label="Studio contract address" value={address} setValue={setAddress} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="action-button" onClick={() => connectWallet().then(() => setMessage("Wallet connected.")).catch((error) => setMessage(error.message))}>Connect wallet</button>
          <button className="action-button primary" disabled={busy} onClick={submit}>{busy ? "Awaiting consensus" : "Assess claim"}</button>
        </div>
        <p className="text-sm text-[#596452]">{message}</p>
      </section>
      {record ? <pre className="result-card mt-6 overflow-x-auto text-sm">{record}</pre> : null}
    </main>
  );
}

function Field({ id, label, value, setValue }: { id: string; label: string; value: string; setValue: (value: string) => void }) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="field-label">{label}</span>
      <input className="text-input" id={id} value={value} onChange={(event) => setValue(event.target.value)} />
    </label>
  );
}
