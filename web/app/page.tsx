"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CircleDot,
  Cloud,
  Coins,
  Clock3,
  Command,
  FileCheck2,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageSquareText,
  Radio,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

const chartPoints = [
  [0, 148], [44, 139], [88, 144], [132, 115], [176, 121], [220, 92],
  [264, 99], [308, 73], [352, 82], [396, 48], [440, 55], [484, 27],
  [528, 38], [572, 18], [616, 25],
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Agent", icon: Bot },
  { label: "Test token", icon: Coins },
  { label: "Proposals", icon: FileCheck2 },
  { label: "Audit trail", icon: Activity },
  { label: "Feedback", icon: MessageSquareText, featured: true },
];

type Scenario = "allowed" | "denied";
type Reaction = "try" | "explore" | "work" | "no";
type FeatureVote = "wallet" | "walkthrough" | "policies" | "teams" | "other";

const reactionOptions: { value: Reaction; emoji: string; label: string }[] = [
  { value: "try", emoji: "🔥", label: "I’d try this" },
  { value: "explore", emoji: "👍", label: "Worth exploring" },
  { value: "work", emoji: "🤔", label: "Needs more work" },
  { value: "no", emoji: "👎", label: "Not for me" },
];

const featureOptions: { value: FeatureVote; title: string; detail: string }[] = [
  { value: "wallet", title: "Live wallet portfolio", detail: "Connect a wallet and inspect real testnet activity." },
  { value: "walkthrough", title: "Visual proposal walkthrough", detail: "Follow research, policy checks and approval step by step." },
  { value: "policies", title: "No-code policy builder", detail: "Create limits and approval rules visually." },
  { value: "teams", title: "Team approvals", detail: "Require multiple people to approve sensitive actions." },
  { value: "other", title: "Something else", detail: "Describe another idea in the comment box." },
];

type DemoModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: { scenario?: Scenario }) => object;
    },
    options?: { signal: AbortSignal },
  ) => void | Promise<void>;
};

export default function Home() {
  const [scenario, setScenario] = useState<Scenario>("allowed");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [tokenOpen, setTokenOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [approved, setApproved] = useState(false);
  const [reaction, setReaction] = useState<Reaction | "">("");
  const [featureVote, setFeatureVote] = useState<FeatureVote | "">("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const linePath = chartPoints.map(([x, y], index) => `${index ? "L" : "M"}${x} ${y}`).join(" ");
  const areaPath = `${linePath} L616 174 L0 174 Z`;

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: DemoModelContext }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(modelContext.registerTool({
      name: "run_governance_demo",
      title: "Run governance demo",
      description: "Show either the allowed or policy-denied proposal scenario in the visible Aegis POC.",
      inputSchema: {
        type: "object",
        properties: { scenario: { type: "string", enum: ["allowed", "denied"] } },
        required: ["scenario"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (input.scenario !== "allowed" && input.scenario !== "denied") throw new Error("Scenario must be allowed or denied");
        setScenario(input.scenario);
        setApproved(false);
        return { scenario: input.scenario, visible_status: input.scenario === "allowed" ? "ready_to_review" : "blocked_by_policy" };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("aegis-demo-feedback");
      if (!saved) return;
      const response = JSON.parse(saved) as { reaction?: Reaction; featureVote?: FeatureVote; note?: string };
      if (response.reaction) setReaction(response.reaction);
      if (response.featureVote) setFeatureVote(response.featureVote);
      if (response.note) setFeedbackNote(response.note);
      setFeedbackSaved(Boolean(response.reaction && response.featureVote));
    } catch {
      // A malformed or unavailable local store should never block the demo.
    }
  }, []);

  function chooseScenario(next: Scenario) {
    setScenario(next);
    setApproved(false);
    setAgentOpen(false);
  }

  function handleNav(label: string) {
    if (label === "Agent") setAgentOpen(true);
    if (label === "Test token") setTokenOpen(true);
    if (label === "Proposals") setReviewOpen(true);
    if (label === "Audit trail") setAuditOpen(true);
    if (label === "Feedback") setFeedbackOpen(true);
  }

  function saveFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reaction || !featureVote) return;
    try {
      window.localStorage.setItem("aegis-demo-feedback", JSON.stringify({ reaction, featureVote, note: feedbackNote.trim(), savedAt: new Date().toISOString() }));
    } catch {
      // The visible acknowledgement remains useful if browser storage is unavailable.
    }
    setFeedbackSaved(true);
  }

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <div className="brand-mark" aria-label="Aegis home">
          <div className="brand-glyph"><span /></div>
          <span className="brand-name">AEGIS</span>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map(({ label, icon: Icon, active, featured }) => (
            <button className={`${active ? "nav-item active" : "nav-item"}${featured ? " feedback-nav" : ""}`} key={label} type="button" onClick={() => handleNav(label)}>
              <Icon />
              <span>{label}</span>
              {active && <span className="nav-active-dot" />}
              {featured && <span className="feedback-nav-badge">Vote</span>}
            </button>
          ))}
        </nav>

        <div className="rail-status">
          <div className="status-orbit"><ShieldCheck /></div>
          <div>
            <span>Policy engine</span>
            <strong>Protected</strong>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" type="button"><Menu /></button>
          <div className="environment-status">
            <div className="network-pill">
              <span className="pulse-dot" />
              Robinhood Testnet
              <span className="chain-id">46630</span>
            </div>
            <div className="aws-pill">
              <Cloud />
              <span>AWS deployment target</span>
              <strong>Sydney</strong>
              <em>Simulated</em>
            </div>
          </div>
          <div className="top-actions">
            <span className="demo-badge"><Sparkles /> Demo mode</span>
            <Button className="wallet-button" variant="outline" onClick={() => setWalletConnected((value) => !value)}>
              <WalletCards /> {walletConnected ? "0x7E2A…91F2" : "Connect wallet"}
            </Button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div>
              <p className="eyebrow">Governed portfolio</p>
              <h1>Welcome to Aegis.</h1>
              <p>Your agent is monitoring exposure, policy and market signals.</p>
            </div>
            <div className="sync-state"><Radio /><span>Chain synced</span><strong>Block 122,022,802</strong></div>
          </section>

          <section className="metric-grid" aria-label="Portfolio summary">
            <article className="metric-card total-card">
              <div className="metric-top"><span>Demo portfolio</span><CircleDollarSign /></div>
              <strong className="metric-value">$128,460<span>.20</span></strong>
              <div className="metric-foot"><span className="gain">+4.82%</span><span>past 30 days</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Available</span><WalletCards /></div>
              <strong className="metric-value small">$32,140</strong>
              <div className="metric-foot"><span>25.0% liquidity</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Policy capacity</span><ShieldCheck /></div>
              <strong className="metric-value small">72%</strong>
              <Progress value={72} className="capacity-bar" />
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel performance-panel">
              <div className="panel-head">
                <div><span className="panel-kicker">Performance</span><h2>Portfolio trajectory</h2></div>
                <div className="range-tabs" aria-label="Chart range"><button type="button">1W</button><button type="button" className="selected">1M</button><button type="button">3M</button></div>
              </div>
              <div className="chart-wrap">
                <div className="chart-y"><span>$130k</span><span>$120k</span><span>$110k</span></div>
                <svg viewBox="0 0 616 180" preserveAspectRatio="none" role="img" aria-label="Portfolio value increased during the last month">
                  <defs>
                    <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6ce5ff" stopOpacity=".28"/><stop offset="1" stopColor="#6ce5ff" stopOpacity="0"/></linearGradient>
                    <filter id="lineGlow"><feGaussianBlur stdDeviation="2.8" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <path d={areaPath} fill="url(#areaGlow)" />
                  <path d={linePath} fill="none" stroke="#79e7ff" strokeWidth="2.5" filter="url(#lineGlow)" vectorEffect="non-scaling-stroke" />
                  <circle cx="616" cy="25" r="5" fill="#09131f" stroke="#79e7ff" strokeWidth="3" />
                </svg>
                <div className="chart-x"><span>Aug 20</span><span>Aug 28</span><span>Sep 05</span><span>Sep 13</span><span>Sep 20</span></div>
              </div>
            </article>

            <article className="panel proposal-panel">
              <div className="proposal-glow" />
              <div className="panel-head">
                <div><span className="panel-kicker">Agent proposal</span><h2>Opportunity detected</h2></div>
                <span className={scenario === "allowed" ? "status-chip" : "status-chip denied-chip"}>{approved ? "Approved · simulated" : scenario === "allowed" ? "Ready to review" : "Blocked by policy"}</span>
              </div>
              <div className="proposal-asset">
                <div className="asset-monogram">A</div>
                <div><strong>Mock Amazon Exposure</strong><span>mAMZN · Test asset</span></div>
                <div className="proposal-price"><strong>$226.18</strong><span>+1.64%</span></div>
              </div>
              <div className="proposal-stats">
                <div><span>Suggested allocation</span><strong>{scenario === "allowed" ? "$4,500" : "$31,800"}</strong></div>
                <div><span>Portfolio impact</span><strong>{scenario === "allowed" ? "3.5%" : "24.8%"}</strong></div>
                <div><span>Confidence</span><strong>{scenario === "allowed" ? "86%" : "91%"}</strong></div>
              </div>
              <div className={scenario === "allowed" ? "policy-pass" : "policy-pass policy-denied"}>{scenario === "allowed" ? <ShieldCheck /> : <AlertTriangle />}<div><strong>{scenario === "allowed" ? "All 6 policy checks passed" : "Concentration limit exceeded"}</strong><span>{scenario === "allowed" ? "Limits, concentration and provenance verified" : "24.8% requested · 20% policy maximum"}</span></div>{scenario === "allowed" ? <Check /> : <Ban />}</div>
              <Button className={scenario === "allowed" ? "review-button" : "review-button denied-button"} onClick={() => setReviewOpen(true)}>{scenario === "allowed" ? "Review proposal" : "View policy decision"} <ArrowUpRight /></Button>
              <p className="simulation-note"><LockKeyhole /> Simulated proposal. No transaction will be submitted.</p>
            </article>
          </section>

          <section className="agent-bar">
            <div className="agent-avatar"><Command /></div>
            <div className="agent-copy"><span>Ask Aegis</span><strong>What should we evaluate next?</strong></div>
            <div className="suggestions"><button type="button" onClick={() => chooseScenario("denied")}>Run denied scenario</button><button type="button" onClick={() => setAgentOpen(true)}>Explain this proposal</button><button className="feedback-cta" type="button" onClick={() => setFeedbackOpen(true)}><MessageSquareText /><span>Share feedback</span><em>2 min</em></button></div>
            <Button className="ask-button" size="icon" aria-label="Open agent" onClick={() => setAgentOpen(true)}><ChevronRight /></Button>
          </section>
        </div>
      </section>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="review-dialog">
          <DialogHeader>
            <div className={scenario === "allowed" ? "dialog-icon" : "dialog-icon warning"}>{scenario === "allowed" ? <ShieldCheck /> : <Ban />}</div>
            <DialogTitle>{scenario === "allowed" ? "Review governed proposal" : "Proposal blocked"}</DialogTitle>
            <DialogDescription>{scenario === "allowed" ? "A deterministic demo of the information a user would verify before authorizing a wallet request." : "The deterministic policy engine rejected this simulated proposal before approval."}</DialogDescription>
          </DialogHeader>

          <div className="trade-summary">
            <div><span>Action</span><strong>Buy mAMZN</strong></div>
            <div><span>Amount</span><strong>{scenario === "allowed" ? "$4,500.00" : "$31,800.00"}</strong></div>
            <div><span>Max slippage</span><strong>0.50%</strong></div>
            <div><span>Network</span><strong>Testnet · 46630</strong></div>
          </div>

          <div className="checks-list">
            {["Mock asset registry", "Quote freshness", "Wallet allowlist", "Daily notional limit", "Price provenance"].map((label) => <div key={label}><CheckCircle2 /><span>{label}</span><strong>Passed</strong></div>)}
            <div className={scenario === "denied" ? "failed" : ""}>{scenario === "denied" ? <AlertTriangle /> : <CheckCircle2 />}<span>Concentration limit</span><strong>{scenario === "denied" ? "Denied" : "Passed"}</strong></div>
          </div>

          <div className="disclosure"><Sparkles /><span><strong>Demo mode</strong>This approval changes only local demonstration state. It cannot sign, submit or settle a transaction.</span></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Close</Button>
            {scenario === "allowed" && <Button className="approve-button" disabled={approved} onClick={() => { setApproved(true); setReviewOpen(false); setAuditOpen(true); }}>{approved ? "Approved" : "Approve simulation"}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={agentOpen} onOpenChange={setAgentOpen}>
        <SheetContent className="agent-sheet">
          <SheetHeader>
            <div className="agent-sheet-title"><div className="agent-avatar"><Command /></div><div><SheetTitle>Aegis agent</SheetTitle><SheetDescription>Deterministic demo assistant</SheetDescription></div></div>
          </SheetHeader>
          <div className="conversation">
            <div className="agent-message"><span>Aegis</span><p>I found a mock Amazon exposure proposal that fits the demo portfolio&apos;s remaining policy capacity. No market order or transaction has been created.</p></div>
            <div className="reasoning-card"><strong>Why this proposal?</strong><ul><li>Technology exposure is below the demo target.</li><li>The proposed allocation remains under the 20% concentration cap.</li><li>All price and registry records are simulated fixtures.</li></ul></div>
            <p className="conversation-label">Try a scenario</p>
            <button className="scenario-option" type="button" onClick={() => chooseScenario("allowed")}><ShieldCheck /><span><strong>Allowed proposal</strong><small>$4,500 · 3.5% portfolio impact</small></span><ChevronRight /></button>
            <button className="scenario-option danger" type="button" onClick={() => chooseScenario("denied")}><Ban /><span><strong>Policy denial</strong><small>$31,800 · exceeds concentration limit</small></span><ChevronRight /></button>
          </div>
          <div className="agent-input"><span>Demo responses are scripted</span><Button size="icon" aria-label="Send demo prompt" disabled><ChevronRight /></Button></div>
        </SheetContent>
      </Sheet>

      <Sheet open={auditOpen} onOpenChange={setAuditOpen}>
        <SheetContent className="audit-sheet">
          <SheetHeader><SheetTitle>Audit trail</SheetTitle><SheetDescription>Simulated events for proposal DEMO-1042</SheetDescription></SheetHeader>
          <div className="audit-timeline">
            <div><span className="timeline-icon complete"><Check /></span><section><strong>Proposal created</strong><p>Deterministic fixture assembled from the mock registry.</p><time>14:02:11</time></section></div>
            <div><span className="timeline-icon complete"><ShieldCheck /></span><section><strong>Policy evaluated</strong><p>{scenario === "allowed" ? "6 of 6 controls passed." : "Concentration control denied the proposal."}</p><time>14:02:12</time></section></div>
            <div><span className={approved ? "timeline-icon complete" : "timeline-icon pending"}>{approved ? <Check /> : <Clock3 />}</span><section><strong>{approved ? "Human approval recorded" : "Awaiting human review"}</strong><p>{approved ? "Local demonstration state only." : "No authorization has been given."}</p><time>{approved ? "14:02:24" : "Pending"}</time></section></div>
            <div><span className="timeline-icon locked"><CircleDot /></span><section><strong>Wallet authorization</strong><p>Not implemented in this POC. No transaction will be sent.</p><time>Deferred</time></section></div>
          </div>
          <div className="audit-footer"><LockKeyhole /> Simulation only · no onchain activity</div>
        </SheetContent>
      </Sheet>

      <Sheet open={tokenOpen} onOpenChange={setTokenOpen}>
        <SheetContent className="token-sheet">
          <SheetHeader>
            <div className="token-sheet-heading">
              <div className="token-emblem"><ShieldCheck /><span>G</span></div>
              <div><SheetTitle>Aegis Guard Dog Test</SheetTitle><SheetDescription>GDOGT · Valueless testnet demo token</SheetDescription></div>
            </div>
          </SheetHeader>

          <div className="token-status-card">
            <span className="token-status-dot" />
            <div><strong>Contract prepared</strong><span>Deployment has not been submitted</span></div>
            <em>Not deployed</em>
          </div>

          <div className="token-facts">
            <div><span>Network</span><strong>Robinhood Testnet</strong><small>Chain ID 46630</small></div>
            <div><span>Fixed supply</span><strong>1,000,000,000</strong><small>18 decimals</small></div>
            <div><span>Market price</span><strong>None</strong><small>No sale or liquidity</small></div>
            <div><span>Admin controls</span><strong>None</strong><small>No mint, tax or blacklist</small></div>
          </div>

          <div className="token-notice"><AlertTriangle /><div><strong>Test harness only</strong><p>This token is prepared solely for software demonstrations. It has no monetary value, investment rights, backing, official market, or affiliation with Robinhood. Do not send real funds.</p></div></div>

          <div className="contract-checks">
            <p>Contract safeguards</p>
            {["Fixed supply minted once", "No owner or administrator", "No transfer tax or fee", "No blacklist or pause", "Source prepared for verification"].map((item) => <div key={item}><CheckCircle2 /><span>{item}</span></div>)}
          </div>

          <Button className="deploy-pending" disabled><LockKeyhole /> Deployment pending testnet gas</Button>
          <p className="token-footnote">A browser wallet must explicitly authorize any future testnet deployment.</p>
        </SheetContent>
      </Sheet>

      <Sheet open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <SheetContent className="feedback-sheet">
          <SheetHeader>
            <div className="feedback-heading">
              <div className="feedback-mark"><MessageSquareText /></div>
              <div><SheetTitle>Shape the next demo</SheetTitle><SheetDescription>Two quick choices. No commitment, no token purchase.</SheetDescription></div>
            </div>
          </SheetHeader>

          {feedbackSaved ? (
            <div className="feedback-success" role="status">
              <div className="success-orbit"><Check /></div>
              <p className="feedback-kicker">Response saved</p>
              <h3>Thanks for helping steer the experiment.</h3>
              <p>Your response is stored on this device for the POC. It is not a product order, investment expression or development commitment.</p>
              <div className="saved-response">
                <span>{reactionOptions.find((option) => option.value === reaction)?.emoji}</span>
                <div><strong>{reactionOptions.find((option) => option.value === reaction)?.label}</strong><small>{featureOptions.find((option) => option.value === featureVote)?.title}</small></div>
              </div>
              <Button variant="outline" onClick={() => setFeedbackSaved(false)}>Update response</Button>
            </div>
          ) : (
            <form className="feedback-form" onSubmit={saveFeedback}>
              <fieldset>
                <legend><span>01</span> Is this concept worth exploring?</legend>
                <RadioGroup className="reaction-grid" value={reaction} onValueChange={(value) => setReaction(value as Reaction)} aria-label="Reaction to the Aegis concept">
                  {reactionOptions.map((option) => (
                    <label className="reaction-option" data-selected={reaction === option.value} key={option.value} htmlFor={`reaction-${option.value}`}>
                      <RadioGroupItem id={`reaction-${option.value}`} value={option.value} />
                      <span className="reaction-emoji" aria-hidden="true">{option.emoji}</span>
                      <strong>{option.label}</strong>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>

              <fieldset>
                <legend><span>02</span> Which capability should a future demo explore?</legend>
                <RadioGroup className="feature-vote-list" value={featureVote} onValueChange={(value) => setFeatureVote(value as FeatureVote)} aria-label="Next demo capability">
                  {featureOptions.map((option) => (
                    <label className="feature-vote" data-selected={featureVote === option.value} key={option.value} htmlFor={`feature-${option.value}`}>
                      <RadioGroupItem id={`feature-${option.value}`} value={option.value} />
                      <span><strong>{option.title}</strong><small>{option.detail}</small></span>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>

              <label className="feedback-note">
                <span>Anything else? <em>Optional</em></span>
                <Textarea value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} maxLength={500} placeholder="What would make this demo more useful?" />
                <small>{feedbackNote.length}/500</small>
              </label>

              <div className="research-notice"><LockKeyhole /><p><strong>Exploratory research only.</strong> This vote is not an investment, purchase, token allocation, product order or promise that anything will be developed.</p></div>
              <Button className="feedback-submit" type="submit" disabled={!reaction || !featureVote}>Save my response</Button>
              <p className="feedback-storage-note">POC mode · saved only in this browser until a feedback service is connected.</p>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
