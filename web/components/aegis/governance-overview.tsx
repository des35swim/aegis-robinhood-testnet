import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cloud,
  FileClock,
  Fingerprint,
  Gavel,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

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

type GovernanceOverviewProps = {
  onLaunchDemo: () => void;
  onOpenFeedback: () => void;
};

export function GovernanceOverview({ onLaunchDemo, onOpenFeedback }: GovernanceOverviewProps) {
  return (
    <div className="governance-overview">
      <section className="governance-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><Sparkles /> Financial agent governance</div>
          <h1>The control layer between <span>AI intent</span> and financial execution.</h1>
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

        <div className="control-path" aria-label="Agent action governance flow">
          <div className="path-caption"><span>Action pathway</span><em>Interactive POC</em></div>
          <div className="path-node agent-node">
            <div className="path-icon"><Bot /></div>
            <div><span>01 · Propose</span><strong>AI agent</strong><small>Researches and requests an action</small></div>
          </div>
          <div className="path-connector"><span>Structured proposal</span><ArrowRight /></div>
          <div className="path-node aegis-node">
            <div className="aegis-scan" />
            <div className="path-icon"><ShieldCheck /></div>
            <div><span>02 · Govern</span><strong>Aegis control boundary</strong><small>Policy · approval · authorization</small></div>
            <em>Decision enforced</em>
          </div>
          <div className="path-connector"><span>Approved instruction</span><ArrowRight /></div>
          <div className="path-node execution-node">
            <div className="path-icon"><WalletCards /></div>
            <div><span>03 · Execute</span><strong>Financial system</strong><small>Receives only an authorized action</small></div>
          </div>
          <div className="path-outcomes">
            <span className="outcome-allow">Allowed</span>
            <span className="outcome-review">Human review</span>
            <span className="outcome-deny">Blocked</span>
          </div>
        </div>
      </section>

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
