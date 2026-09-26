"use client";

import { useState } from "react";
import { BOUNTY_PROOF_CONTRACT_ADDRESS, compactError, registerBounty, type WalletAddress } from "@/lib/genlayer";

declare global {
  interface Window {
    ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
  }
}

export default function BountyPage() {
  const [programTitle, setProgramTitle] = useState("Critical API authorization bounty");
  const [sponsorWallet, setSponsorWallet] = useState("0x0000000000000000000000000000000000000001");
  const [currency, setCurrency] = useState("GEN");
  const [maxReward, setMaxReward] = useState("1500");
  const [rulesUrl, setRulesUrl] = useState("https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/bounty-rules.md");
  const [repoUrl, setRepoUrl] = useState("https://github.com/klopp78/bountyproof-genlayer");
  const [policyUrl, setPolicyUrl] = useState("https://github.com/klopp78/bountyproof-genlayer/blob/main/examples/payout-policy.md");
  const [address, setAddress] = useState(BOUNTY_PROOF_CONTRACT_ADDRESS);
  const [wallet, setWallet] = useState<WalletAddress | null>(null);
  const [message, setMessage] = useState("Connect a browser wallet to register a bounty baseline.");
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
      setMessage("Waiting for validators to bind bounty rules and policy snapshots...");
      const account = wallet ?? (await connectWallet());
      const result = await registerBounty({
        walletAddress: account,
        programTitle,
        sponsorWallet,
        rewardCurrency: currency,
        maxReward,
        rulesUrl,
        repositoryUrl: repoUrl,
        payoutPolicyUrl: policyUrl,
        contractAddress: address as `0x${string}`,
      });
      setRecord(result.bounty
        ? typeof result.bounty === "string" ? result.bounty : JSON.stringify(result.bounty, null, 2)
        : JSON.stringify({ bountyId: result.bountyId, transactionHash: result.hash }, null, 2));
      setMessage(result.readbackWarning
        ? `Bounty baseline accepted: ${result.bountyId}. ${result.readbackWarning}`
        : `Bounty baseline accepted: ${result.bountyId}`);
    } catch (error) {
      setMessage(compactError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 text-[#161814]">
      <a className="pill" href="/">BountyProof</a>
      <h1 className="mt-7 text-4xl font-semibold">Register bounty baseline</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[#596452]">
        Store the reward rules, repository, and payout policy before claimants
        request a consensus award verdict.
      </p>
      <section className="tool-panel mt-8 grid gap-4">
        <Field id="title" label="Program title" value={programTitle} setValue={setProgramTitle} />
        <Field id="sponsor" label="Sponsor wallet" value={sponsorWallet} setValue={setSponsorWallet} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="currency" label="Reward currency" value={currency} setValue={setCurrency} />
          <Field id="reward" label="Maximum reward" value={maxReward} setValue={setMaxReward} />
        </div>
        <Field id="rules" label="Bounty rules URL" value={rulesUrl} setValue={setRulesUrl} />
        <Field id="repo" label="Repository URL" value={repoUrl} setValue={setRepoUrl} />
        <Field id="policy" label="Payout policy URL" value={policyUrl} setValue={setPolicyUrl} />
        <Field id="address" label="Studio contract address" value={address} setValue={setAddress} />
        <div className="flex flex-wrap gap-3">
          <button className="action-button" onClick={() => connectWallet().then(() => setMessage("Wallet connected.")).catch((error) => setMessage(compactError(error)))}>Connect wallet</button>
          <button className="action-button primary" disabled={busy} onClick={submit}>{busy ? "Awaiting consensus" : "Register bounty"}</button>
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
