"use client";

import { useState } from "react";
import { BOUNTY_PROOF_CONTRACT_ADDRESS, compactError, readBounty, readClaim } from "@/lib/genlayer";

export default function RecordsPage() {
  const [address, setAddress] = useState(BOUNTY_PROOF_CONTRACT_ADDRESS);
  const [bountyId, setBountyId] = useState("bounty_");
  const [claimId, setClaimId] = useState("award_");
  const [record, setRecord] = useState("");
  const [message, setMessage] = useState("Read a bounty_* baseline or award_* claim verdict from Studionet.");

  async function read(kind: "bounty" | "claim") {
    try {
      setRecord("");
      const result = kind === "bounty"
        ? await readBounty(bountyId, { contractAddress: address as `0x${string}` })
        : await readClaim(claimId, { contractAddress: address as `0x${string}` });
      setRecord(typeof result === "string" ? result : JSON.stringify(result, null, 2));
      setMessage(`Loaded ${kind} record.`);
    } catch (error) {
      setMessage(compactError(error));
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 text-[#161814]">
      <a className="pill" href="/">BountyProof</a>
      <h1 className="mt-7 text-4xl font-semibold">Inspect records</h1>
      <p className="mt-3 max-w-2xl text-lg leading-8 text-[#596452]">
        Verify that a bounty baseline or award verdict is read from the live
        GenLayer contract, including snapshot commitments and bundle hashes.
      </p>
      <section className="tool-panel mt-8 grid gap-4">
        <Field id="address" label="Studio contract address" value={address} setValue={setAddress} />
        <Field id="bounty" label="Bounty ID" value={bountyId} setValue={setBountyId} />
        <Field id="claim" label="Claim verdict ID" value={claimId} setValue={setClaimId} />
        <div className="flex flex-wrap gap-3">
          <button className="action-button primary" onClick={() => read("bounty")}>Read bounty</button>
          <button className="action-button" onClick={() => read("claim")}>Read claim verdict</button>
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
