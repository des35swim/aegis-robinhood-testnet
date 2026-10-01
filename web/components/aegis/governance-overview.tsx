"use client";

import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  FileClock,
  Fingerprint,
  Gavel,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Play,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const controls = [
  {
    value: "policy",
    number: "01",
    icon: ShieldCheck,
    title: "Policy enforcement",
    summary: "Deterministic controls evaluate every proposed action before execution.",
    detail: "Aegis checks limits, concentration, approved assets, destinations, quote freshness and wallet permissions. A proposal that fails a required control is stopped before approval or signing.",
    status: "Allow · deny · escalate",
  },
  {
    value: "approval",
    number: "02",
    icon: Gavel,
    title: "Human approval",
    summary: "Consequential actions pause for an explicit, informed decision.",
    detail: "The reviewer sees the exact action, amount, destination and policy evidence. Approval applies only to that proposal; changing its material terms requires a new decision.",
    status: "Explicit authorization",
  },
  {
    value: "execution",
    number: "03",
    icon: LockKeyhole,
    title: "Controlled execution",
    summary: "The agent never receives unrestricted authority to move funds.",
    detail: "A constrained execution adapter acts only after the required controls have passed. Credentials, wallets and financial systems remain outside the agent's direct control.",
    status: "Least privilege",
  },
  {
    value: "evidence",
    number: "04",
    icon: FileClock,
    title: "Governance evidence",
    summary: "Every stage produces a clear record of what happened and why.",
    detail: "Aegis connects the original proposal to its policy result, human decision and execution outcome. AWS telemetry supports operations; Aegis supplies the business-level decision record.",
    status: "End-to-end trace",
  },
];

const policyChecks = ["Wallet authority", "Approved venue", "Spending limit"];

const pathwayProposals = [
  { id: "01", title: "Transfer", detail: "New wallet", policy: ["fail", "pass", "pass"] as const, requiresHuman: false },
  { id: "02", title: "Rebalance", detail: "4% shift", policy: ["pass", "pass", "pass"] as const, requiresHuman: false },
  { id: "03", title: "New venue", detail: "Unapproved", policy: ["pass", "fail", "pass"] as const, requiresHuman: false },
  { id: "04", title: "Buy asset", detail: "$3,000", policy: ["pass", "pass", "pass"] as const, requiresHuman: true },
  { id: "05", title: "Leverage", detail: "Above limit", policy: ["pass", "pass", "fail"] as const, requiresHuman: false },
];

type PathwayPhase = "creating" | "entering" | "checking" | "policy-routing" | "approval-fork" | "awaiting-human" | "routing" | "executing" | "complete";
type ProposalDecision = { status: "approved" | "rejected"; reason: string };

type GovernanceOverviewProps = {
  onLaunchDemo: () => void;
  onOpenFeedback: () => void;
};

export function GovernanceOverview({ onLaunchDemo, onOpenFeedback }: GovernanceOverviewProps) {
  const [pathwayRun, setPathwayRun] = useState(0);
  const [currentProposalIndex, setCurrentProposalIndex] = useState(0);
  const [pathwayPhase, setPathwayPhase] = useState<PathwayPhase>("creating");
  const [completedChecks, setCompletedChecks] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, ProposalDecision>>({});
  const [executedProposals, setExecutedProposals] = useState<string[]>([]);
  const currentProposal = pathwayProposals[currentProposalIndex];
  const reviewOpen = pathwayPhase === "awaiting-human";
  const failedPolicyIndex = currentProposal.policy.findIndex((result, index) => index < completedChecks && result === "fail");
  const policyPassed = completedChecks === policyChecks.length && failedPolicyIndex === -1;
  const currentDecision = decisions[currentProposal.id];
  const approvalForkReached = policyPassed && ["approval-fork", "awaiting-human", "routing", "executing"].includes(pathwayPhase);
  const showApprovalPacket = policyPassed && ["approval-fork", "awaiting-human", "routing"].includes(pathwayPhase);

  useEffect(() => {
    setCurrentProposalIndex(0);
    setPathwayPhase("creating");
    setCompletedChecks(0);
    setDecisions({});
    setExecutedProposals([]);
  }, [pathwayRun]);

  useEffect(() => {
    if (pathwayPhase === "awaiting-human" || pathwayPhase === "complete") return;

    const advance = () => {
      if (currentProposalIndex === pathwayProposals.length - 1) {
        setPathwayPhase("complete");
      } else {
        setCurrentProposalIndex((index) => index + 1);
        setCompletedChecks(0);
        setPathwayPhase("creating");
      }
    };

    let delay = 0;
    let next: () => void;

    if (pathwayPhase === "creating") {
      delay = 550;
      next = () => setPathwayPhase("entering");
    } else if (pathwayPhase === "entering") {
      delay = 1450;
      next = () => setPathwayPhase("checking");
    } else if (pathwayPhase === "checking") {
      delay = 1050;
      next = () => {
        const result = currentProposal.policy[completedChecks];
        const nextCompleted = completedChecks + 1;
        setCompletedChecks(nextCompleted);
        if (result === "fail") {
          setPathwayPhase("policy-routing");
        } else if (nextCompleted === policyChecks.length) {
          setPathwayPhase("policy-routing");
        }
      };
    } else if (pathwayPhase === "policy-routing") {
      delay = 1350;
      next = () => {
        if (policyPassed) {
          setPathwayPhase("approval-fork");
        } else {
          setDecisions((current) => ({ ...current, [currentProposal.id]: { status: "rejected", reason: `${policyChecks[failedPolicyIndex]} failed` } }));
          setPathwayPhase("routing");
        }
      };
    } else if (pathwayPhase === "approval-fork") {
      delay = 1750;
      next = () => {
        if (currentProposal.requiresHuman) {
          setPathwayPhase("awaiting-human");
        } else {
          setDecisions((current) => ({ ...current, [currentProposal.id]: { status: "approved", reason: "Policy passed · auto-authorized" } }));
          setPathwayPhase("routing");
        }
      };
    } else if (pathwayPhase === "routing") {
      delay = 1600;
      next = () => currentDecision?.status === "approved" ? setPathwayPhase("executing") : advance();
    } else {
      delay = 1600;
      next = () => {
        setExecutedProposals((current) => current.includes(currentProposal.id) ? current : [...current, currentProposal.id]);
        advance();
      };
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(next, reducedMotion ? Math.min(delay, 250) : delay);
    return () => window.clearTimeout(timer);
  }, [completedChecks, currentDecision?.status, currentProposal, currentProposalIndex, pathwayPhase]);

  const replayPathway = () => setPathwayRun((run) => run + 1);
  const resolveReview = (decision: "approved" | "rejected") => {
    setDecisions((current) => ({ ...current, [currentProposal.id]: { status: decision, reason: `Human ${decision}` } }));
    setPathwayPhase("routing");
  };

  const policyStatus = (index: number) => {
    if (index < completedChecks) return currentProposal.policy[index];
    if (pathwayPhase === "checking" && index === completedChecks) return "checking";
    if (failedPolicyIndex >= 0 && index > failedPolicyIndex) return "skipped";
    return "waiting";
  };

  return (
    <div className="governance-overview">
      <section className="governance-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles /> Financial agent governance</div>
          <h1>AI proposes. <span>Aegis governs.</span></h1>
          <p className="hero-lede">AI agents can research and propose. Aegis applies deterministic policy, requires human approval when needed, constrains execution and records the decision trail.</p>
          <div className="hero-actions">
            <Button className="primary-hero-action" onClick={onLaunchDemo}><Play /> Run the governance demo</Button>
            <Button className="secondary-hero-action" variant="outline" onClick={onOpenFeedback}>Share your view <ArrowRight /></Button>
          </div>
          <div className="hero-assurance">
            <span><CheckCircle2 /> AWS-hosted proof of concept</span>
            <span><LockKeyhole /> No real funds or transactions</span>
          </div>
        </div>

        <div className="control-path" aria-label="Simulated financial agent governance workflow">
          <div className="path-caption">
            <span>Simulated action pathway</span>
            <button type="button" onClick={replayPathway} aria-label="Replay the action pathway simulation">
              <RefreshCw /> Replay
            </button>
          </div>

          <div className="workflow-run live-workflow" key={pathwayRun}>
            <section className="workflow-stage proposal-stage" aria-label="The AI agent creates five proposals">
              <div className="workflow-heading">
                <span className="workflow-icon"><Bot /></span>
                <div><em>01 · Agent</em><strong>AI proposal queue</strong></div>
                <small>Proposal {Math.min(currentProposalIndex + 1, 5)} of 5</small>
              </div>
              <div className="proposal-stream">
                {pathwayProposals.map((proposal, index) => {
                  const decision = decisions[proposal.id];
                  const state = index > currentProposalIndex ? "is-future" : decision ? `is-${decision.status}` : index === currentProposalIndex ? "is-current" : "is-created";
                  return <div className={`proposal-chip ${state}`} key={proposal.id}><span>{proposal.id}</span><strong>{proposal.title}</strong><small>{proposal.detail}</small></div>;
                })}
              </div>
            </section>

            <div className="workflow-arrow proposal-flow">
              <span>Into Aegis</span>
              <div className="flow-packets" aria-hidden="true">{pathwayPhase === "entering" && <i className="live-packet" key={`${currentProposal.id}-enter`}>{currentProposal.id}</i>}</div>
              <ArrowDown />
            </div>

            <section className="workflow-stage governance-gate" aria-label="Aegis evaluates the proposals using policy and human review">
              <div className="workflow-heading">
                <span className="workflow-icon"><ShieldCheck /></span>
                <div><em>02 · Govern</em><strong>Aegis control boundary</strong></div>
                <small>Evaluating {currentProposal.id}</small>
              </div>
              <div className="policy-chips live-policy-checks" aria-label={`Policy checks for proposal ${currentProposal.id}`}>
                {policyChecks.map((check, index) => {
                  const status = policyStatus(index);
                  return (
                    <div className={`policy-check is-${status}`} key={check}>
                      <span>{status === "pass" ? <Check /> : status === "fail" ? <X /> : status === "checking" ? <LoaderCircle /> : <Minus />}</span>
                      <div><strong>{check}</strong><small>{status === "pass" ? "Passed" : status === "fail" ? "Failed" : status === "checking" ? "Checking…" : status === "skipped" ? "Not checked" : "Waiting"}</small></div>
                    </div>
                  );
                })}
              </div>

              <div className="gate-router policy-router" aria-label="Policy result routes the proposal onward or to rejection">
                <svg viewBox="0 0 100 48" preserveAspectRatio="none" aria-hidden="true">
                  <path className="router-trunk" d="M50 0 V13" />
                  <path className="router-continue-path" d="M50 13 C50 28 25 24 25 48" />
                  <path className="router-reject-path" d="M50 13 C50 28 75 24 75 48" />
                </svg>
                <span className="router-destination continue"><CheckCircle2 /> Policy passed</span>
                <span className="router-destination reject"><Trash2 /> Policy failed</span>
                <div className="gate-packets" aria-hidden="true">
                  {pathwayPhase === "policy-routing" && <i className={`live-gate-packet ${policyPassed ? "to-continue" : "to-reject"}`} key={`${currentProposal.id}-policy`}>{currentProposal.id}</i>}
                </div>
              </div>

              <div className={`approval-router${approvalForkReached ? " is-active" : ""}`} aria-label="Determine whether human approval is required">
                <div className="approval-router-title"><Gavel /><strong>Approval required?</strong><small>{approvalForkReached ? currentProposal.requiresHuman ? "Yes · pause for a person" : "No · auto-authorize" : "Reached only after policy passes"}</small></div>
                <div className="approval-fork-visual">
                  <svg viewBox="0 0 100 42" preserveAspectRatio="none" aria-hidden="true">
                    <path className="router-trunk" d="M50 0 V12" />
                    <path className="router-continue-path" d="M50 12 C50 25 25 22 25 42" />
                    <path className="router-review-path" d="M50 12 C50 25 75 22 75 42" />
                  </svg>
                  <span className="approval-destination automatic"><CheckCircle2 /> No · auto-authorize</span>
                  <span className="approval-destination human"><UserRound /> Yes · human review</span>
                  {showApprovalPacket && <i className={`approval-packet ${currentProposal.requiresHuman ? "to-human" : "to-auto"}`} key={`${currentProposal.id}-approval`}>{currentProposal.id}</i>}
                </div>
              </div>

              {currentProposal.requiresHuman && policyPassed && (
                <div className="human-review-status">
                  <span className="reviewer-avatar"><UserRound /></span>
                  <div><small>Human checkpoint</small><strong>{currentProposal.id} · {currentProposal.title}</strong></div>
                  <em className={currentDecision?.status ?? "pending"}>{currentDecision?.status === "approved" ? <><Check /> Approved</> : currentDecision?.status === "rejected" ? <><X /> Rejected</> : <><Gavel /> Awaiting decision</>}</em>
                </div>
              )}

              <div className="decision-routes">
                <div className="route-lane continue-lane">
                  <div className="route-heading"><CheckCircle2 /><strong>Authorized</strong><span>{Object.values(decisions).filter((decision) => decision.status === "approved").length}</span></div>
                  {pathwayProposals.filter((proposal) => decisions[proposal.id]?.status === "approved").map((proposal) => <div className="route-token resolved-token" key={proposal.id}><b>{proposal.id}</b><span>{proposal.title}</span><small>{decisions[proposal.id].reason}</small></div>)}
                </div>
                <div className="route-lane rejection-bin">
                  <div className="route-heading"><Trash2 /><strong>Rejected</strong><span>{Object.values(decisions).filter((decision) => decision.status === "rejected").length}</span></div>
                  <div className="rejected-tokens">
                    {pathwayProposals.filter((proposal) => decisions[proposal.id]?.status === "rejected").map((proposal) => <div className="route-token resolved-token" key={proposal.id}><b>{proposal.id}</b><span>{proposal.title}</span><small>{decisions[proposal.id].reason}</small></div>)}
                  </div>
                </div>
              </div>
            </section>

            <div className="workflow-arrow authorized">
              <span>Authorized only</span>
              <div className="flow-packets" aria-hidden="true">{pathwayPhase === "executing" && <i className="live-packet authorized-packet" key={`${currentProposal.id}-execute`}>{currentProposal.id}</i>}</div>
              <ArrowDown />
            </div>

            <section className="workflow-stage financial-stage" aria-label="Two authorized actions reach the financial system">
              <div className="workflow-heading">
                <span className="workflow-icon"><CircleDollarSign /></span>
                <div><em>03 · Execute</em><strong>Financial system</strong></div>
                <small>{executedProposals.length} of 5 received</small>
              </div>
              <div className="executed-actions">
                {executedProposals.map((id) => {
                  const proposal = pathwayProposals.find((item) => item.id === id)!;
                  return <span className="executed-token" key={id}><b>{id}</b><CheckCircle2 /> {proposal.title} executed</span>;
                })}
              </div>
            </section>

            {pathwayPhase === "complete" && <div className="execution-receipt live-receipt">
              <ReceiptText />
              <div><strong>Execution evidence returned</strong><small>Receipt and decision trail recorded</small></div>
              <em>Audit complete</em>
            </div>}
          </div>
        </div>
      </section>

      <Dialog open={reviewOpen} onOpenChange={() => undefined}>
        <DialogContent className="governance-review-dialog" showCloseButton={false} onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <div className="governance-review-icon"><Gavel /></div>
            <DialogTitle>Approval required</DialogTitle>
            <DialogDescription>Aegis has paused proposal {currentProposal.id}. Review the exact instruction before deciding whether it may continue.</DialogDescription>
          </DialogHeader>
          <div className="review-proposal-summary">
            <span>{currentProposal.id}</span>
            <div><small>Proposed action</small><strong>{currentProposal.title} · {currentProposal.detail}</strong></div>
            <em>Simulated</em>
          </div>
          <p className="review-decision-note">Approve sends this proposal toward the simulated financial system. Reject routes it into the Aegis rejection bin.</p>
          <DialogFooter className="review-modal-actions">
            <Button type="button" variant="outline" className="reject-review" onClick={() => resolveReview("rejected")}><X /> Reject proposal</Button>
            <Button type="button" className="approve-review" onClick={() => resolveReview("approved")}><Check /> Approve proposal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="control-section" aria-labelledby="control-heading">
        <div className="section-heading">
          <div><span className="section-kicker">How Aegis governs</span><h2 id="control-heading">Four controls. One accountable path.</h2></div>
          <p>Open each control to see what Aegis contributes beyond the underlying agent runtime.</p>
        </div>
        <Accordion type="single" collapsible className="control-accordion">
          {controls.map(({ value, number, icon: Icon, title, summary, detail, status }) => (
            <AccordionItem value={value} key={value} className="control-item">
              <AccordionTrigger className="control-trigger">
                <span className="control-number">{number}</span>
                <span className="control-icon"><Icon /></span>
                <span className="control-copy"><strong>{title}</strong><small>{summary}</small></span>
                <span className="control-status">{status}</span>
              </AccordionTrigger>
              <AccordionContent className="control-content">
                <p>{detail}</p>
                <div><Fingerprint /><span>Policy and approval decisions remain outside probabilistic agent reasoning.</span></div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="aws-foundation">
        <div className="aws-foundation-mark"><Cloud /></div>
        <div><span className="section-kicker">Built on an AWS foundation</span><h2>Aegis adds financial governance to secure agent infrastructure.</h2></div>
        <p>Amazon Bedrock AgentCore is the target runtime for future agent workloads. IAM supplies scoped roles, while CloudWatch and CloudTrail support operational visibility. The current public POC hosts the experience and feedback service on AWS; its agent and transaction flows remain simulated.</p>
        <Button variant="outline" onClick={onLaunchDemo}>Explore the testnet use case <ArrowRight /></Button>
      </section>
    </div>
  );
}
