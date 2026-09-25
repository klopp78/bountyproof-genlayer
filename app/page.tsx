import { BOUNTY_PROOF_CONTRACT_ADDRESS } from "@/lib/genlayer";

const repoUrl = "https://github.com/klopp78/bountyproof-genlayer";
const studioUrl = `https://explorer-studio.genlayer.com/address/${BOUNTY_PROOF_CONTRACT_ADDRESS}`;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f6f2] text-[#161814]">
      <section className="border-b border-[#d9ded2] bg-[#fbfcf8]">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
          <span className="pill">GenLayer Project</span>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">
                BountyProof
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#596452]">
                Consensus review for bug bounty and grant milestone claims.
                Register reward rules, submit GitHub evidence, and receive a
                durable GenLayer verdict with snapshot commitments.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a className="action-button primary" href="/bounty">Register bounty</a>
                <a className="action-button" href="/claim">Assess claim</a>
                <a className="action-button" href="/records">Inspect records</a>
              </div>
            </div>
            <div className="bounty-board">
              <div>
                <span>Sponsor baseline</span>
                <strong>Reward rules, repository, and payout policy are snapshotted first</strong>
              </div>
              <div>
                <span>Claimant package</span>
                <strong>Issue, PR, commit, and reproduction URLs are fetched by validators</strong>
              </div>
              <div>
                <span>Award receipt</span>
                <strong>award_* records bind payout recommendation to on-chain evidence hashes</strong>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-8 md:grid-cols-3 lg:px-8">
        <article className="tool-panel">
          <span className="field-label">01 Register</span>
          <h2 className="mt-2 text-2xl font-semibold">Immutable bounty rules</h2>
          <p className="mt-3 leading-7 text-[#596452]">
            Sponsors record the bounty scope, repository, and payout policy
            before any claimant asks for an award.
          </p>
          <a className="mt-5 inline-block text-sm font-semibold text-[#25614b]" href="/bounty">Open bounty flow</a>
        </article>
        <article className="tool-panel">
          <span className="field-label">02 Assess</span>
          <h2 className="mt-2 text-2xl font-semibold">Consensus award gate</h2>
          <p className="mt-3 leading-7 text-[#596452]">
            Validators compare claim evidence against the stored rules and
            produce approve, partial, reject, or needs_review decisions.
          </p>
          <a className="mt-5 inline-block text-sm font-semibold text-[#25614b]" href="/claim">Open claim flow</a>
        </article>
        <article className="tool-panel">
          <span className="field-label">03 Inspect</span>
          <h2 className="mt-2 text-2xl font-semibold">Verifiable payout context</h2>
          <p className="mt-3 leading-7 text-[#596452]">
            Every bounty_* and award_* receipt exposes snapshot commitments,
            evidence bundle hashes, and the consensus summary.
          </p>
          <a className="mt-5 inline-block text-sm font-semibold text-[#25614b]" href="/records">Open records</a>
        </article>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-8 lg:px-8">
        <div className="difference-panel">
          <span className="field-label">Distinct workflow</span>
          <h2 className="text-2xl font-semibold">This is not a reused release or risk checker</h2>
          <p className="mt-3 max-w-4xl leading-7 text-[#596452]">
            BountyProof is a two-sided bounty adjudication product: sponsors
            register reward rules before a claim exists, claimants submit
            issue/PR/commit/reproduction evidence, and the contract stores an
            award_* payout receipt. It is separate from release provenance,
            model-risk scoring, data-consent, escrow, or policy-change tools.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div>
              <strong>Bounty scope first</strong>
              <span>Rules and payout policy are committed before assessment.</span>
            </div>
            <div>
              <strong>Claim evidence bundle</strong>
              <span>Validators compare four claimant evidence URLs to the stored scope.</span>
            </div>
            <div>
              <strong>Award-specific output</strong>
              <span>Receipts return approve, partial, reject, or needs_review payout guidance.</span>
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-6xl flex-wrap gap-4 px-5 pb-10 text-sm text-[#596452] lg:px-8">
        <a href={repoUrl} rel="noreferrer" target="_blank">Source repository</a>
        <a href={studioUrl} rel="noreferrer" target="_blank">Studio contract</a>
        <code>{BOUNTY_PROOF_CONTRACT_ADDRESS}</code>
      </footer>
    </main>
  );
}
