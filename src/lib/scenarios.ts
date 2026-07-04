import { attacks } from "@/lib/attacks";

export type NodeStatus = "critical" | "warning" | "online";
export type InjectSeverity = "critical" | "info" | "warning";

export interface ScenarioNode {
  id: string;
  status: NodeStatus;
}

export interface ScenarioInject {
  time: number;
  message: string;
  severity: InjectSeverity;
}

export interface DecisionOption {
  id: string;
  text: string;
  correct: boolean;
  explanation: string;
}

export interface ScenarioDecision {
  id: string;
  trigger_time: number;
  nist_phase: string;
  question: string;
  options: DecisionOption[];
}

export interface Scenario {
  id: string;
  title: string;
  reference: string;
  severity: string;
  role: string;
  briefing: string;
  nodes: ScenarioNode[];
  injects: ScenarioInject[];
  decisions: ScenarioDecision[];
}

export const scenarios: Scenario[] = [
  {
    id: "scenario_01",
    title: "Ransomware on Defense Contractor Network",
    reference: "Colonial Pipeline, 2021",
    severity: "CRITICAL",
    role: "Incident Response Lead",
    briefing:
      "It is 02:47 AM. Alarms are firing across your SOC. A ransomware strain has been detected actively encrypting files on file servers FS-01 and FS-02 inside a defense contractor's internal network. Preliminary logs show the attacker has been inside the network for approximately 6 hours before triggering encryption. The malware is deleting shadow copies to prevent recovery. You are the Incident Response Lead. Your team is online and waiting for your direction.",
    nodes: [
      { id: "FS-01", status: "critical" },
      { id: "FS-02", status: "critical" },
      { id: "DC-01", status: "warning" },
      { id: "BK-01", status: "warning" },
      { id: "FW-EDGE", status: "online" },
      { id: "SOC-WS", status: "online" },
    ],
    injects: [
      {
        time: 60,
        message:
          "DC-01 showing unusual login attempts — possible lateral movement toward domain controller",
        severity: "critical",
      },
      {
        time: 120,
        message:
          "C2 beacon identified: 185.220.101.47 — known Conti ransomware infrastructure",
        severity: "info",
      },
      {
        time: 180,
        message:
          "Backup server BK-01 now unreachable — shadow copies deletion confirmed",
        severity: "critical",
      },
    ],
    decisions: [
      {
        id: "d1",
        trigger_time: 30,
        nist_phase: "Detect",
        question:
          "Alarms are firing. FS-01 is showing mass file encryption and unusual process activity. What is your very first action?",
        options: [
          {
            id: "a",
            text: "Immediately shut down all servers across the entire network to stop the spread",
            correct: false,
            explanation:
              "Total shutdown destroys volatile memory forensics and causes operational disruption far beyond the affected systems. It does not stop malware already running on other hosts.",
          },
          {
            id: "b",
            text: "Activate your IR plan, alert your team, and begin capturing a memory dump of FS-01 before isolating it",
            correct: true,
            explanation:
              "Correct. Activating the IR plan first ensures structured response. Memory capture before isolation preserves volatile forensic evidence including encryption keys that exist only in RAM.",
          },
          {
            id: "c",
            text: "Call senior leadership immediately and wait for their approval before taking any technical action",
            correct: false,
            explanation:
              "Ransomware encrypts thousands of files per minute. Waiting for leadership approval as a first step costs critical containment time. Notify leadership in parallel, not as a gate.",
          },
          {
            id: "d",
            text: "Run a full antivirus scan across all systems to identify the malware",
            correct: false,
            explanation:
              "Modern ransomware like DarkSide uses legitimate system tools to evade AV detection. An AV scan at this stage wastes critical minutes and will likely return clean results.",
          },
        ],
      },
      {
        id: "d2",
        trigger_time: 90,
        nist_phase: "Contain",
        question:
          "Memory dump captured. FS-01 and FS-02 are confirmed infected. Lateral movement toward DC-01 has been detected. What is your immediate priority?",
        options: [
          {
            id: "a",
            text: "Isolate FS-01 and FS-02 at the network switch level and block outbound traffic to the identified C2 IP at the firewall",
            correct: true,
            explanation:
              "Surgical network isolation at the switch level stops lateral movement without shutting down the entire network. Blocking the C2 IP cuts the attacker's command channel immediately.",
          },
          {
            id: "b",
            text: "Begin restoring FS-01 from last night's backup to resume operations as quickly as possible",
            correct: false,
            explanation:
              "Critical error. Restoring into an active attacker environment means your restored data will be re-encrypted within minutes. Containment must always precede recovery.",
          },
          {
            id: "c",
            text: "Shut down DC-01 immediately to protect the domain controller",
            correct: false,
            explanation:
              "Shutting down the domain controller brings down authentication for the entire network, preventing your own team from responding. Isolate selectively, not broadly.",
          },
          {
            id: "d",
            text: "Pay the ransom to get the decryption key before more files are encrypted",
            correct: false,
            explanation:
              "Paying ransom does not guarantee decryption, funds further attacks, and in some jurisdictions may be illegal if the group is sanctioned. FBI and CISA both advise against it.",
          },
        ],
      },
      {
        id: "d3",
        trigger_time: 150,
        nist_phase: "Contain",
        question:
          "FS-01 and FS-02 are isolated. BK-01 backup server is now unreachable — shadow copies appear to have been deleted. How do you proceed?",
        options: [
          {
            id: "a",
            text: "Check offline backup storage — tape or air-gapped drives — and verify integrity before planning restoration",
            correct: true,
            explanation:
              "Offline backups are your only reliable recovery path once shadow copies and network backups are compromised. Integrity verification before restoration prevents restoring corrupted data.",
          },
          {
            id: "b",
            text: "Attempt to recover shadow copies using Windows recovery tools",
            correct: false,
            explanation:
              "The malware has already confirmed shadow copy deletion. Attempting recovery here wastes time that should be spent on offline backup verification.",
          },
          {
            id: "c",
            text: "Restore DC-01 from BK-01 immediately since leadership needs access",
            correct: false,
            explanation:
              "BK-01 is unreachable and potentially compromised. Restoring from a potentially infected backup risks spreading the malware to your domain controller.",
          },
          {
            id: "d",
            text: "Declare the incident unrecoverable and notify customers of permanent data loss",
            correct: false,
            explanation:
              "Premature declaration of total loss before checking all backup options is an operational and legal failure. Offline backups have not been checked yet.",
          },
        ],
      },
      {
        id: "d4",
        trigger_time: 210,
        nist_phase: "Recover",
        question:
          "Offline backups are intact. The network has been cleared. You are ready to begin restoration. What is the correct restoration sequence?",
        options: [
          {
            id: "a",
            text: "Restore all systems simultaneously to minimize downtime",
            correct: false,
            explanation:
              "Simultaneous restoration without priority sequencing risks restoring systems before the network is fully verified clean, potentially re-infecting restored systems.",
          },
          {
            id: "b",
            text: "Restore DC-01 first to re-establish authentication, then FS-01 and FS-02, then verify each before going live",
            correct: true,
            explanation:
              "Correct sequence. Domain controller restoration first re-establishes identity and access control. Sequential restoration with verification at each step prevents re-infection.",
          },
          {
            id: "c",
            text: "Restore FS-01 and FS-02 first since they contain the most critical data",
            correct: false,
            explanation:
              "Without DC-01 restored first, there is no authentication system to control who can access the restored file servers — creating a security gap during the most vulnerable recovery window.",
          },
          {
            id: "d",
            text: "Bring the entire original network back online and then restore from backups on top of it",
            correct: false,
            explanation:
              "Bringing the original compromised network back online before restoration means you are restoring into a potentially still-infected environment.",
          },
        ],
      },
    ],
  },
];

/** Maps attack library IDs to full simulation scenarios */
export const attackToScenarioId: Record<string, string> = {
  ...Object.fromEntries(
    attacks.map((attack) => [
      attack.id,
      attack.id === "ransomware" ? "scenario_01" : `scenario_${attack.id}`,
    ])
  ),
};

export function getScenarioForAttack(attackId: string): Scenario | undefined {
  const scenarioId = attackToScenarioId[attackId];
  if (!scenarioId) return undefined;
  const authoredScenario = scenarios.find((s) => s.id === scenarioId);
  if (authoredScenario) return authoredScenario;

  const attack = attacks.find((item) => item.id === attackId);
  if (!attack) return undefined;

  return {
    id: scenarioId,
    title: attack.title,
    reference: `BreachWise ${attack.category} scenario`,
    severity: attack.difficulty.toUpperCase(),
    role: "Incident Response Lead",
    briefing: attack.description,
    nodes: [],
    injects: [],
    decisions: [],
  };
}

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export const nodeStatusStyles: Record<
  NodeStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  critical: {
    dot: "bg-red-500",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    label: "Critical",
  },
  warning: {
    dot: "bg-amber-500",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    label: "Warning",
  },
  online: {
    dot: "bg-green-500",
    bg: "bg-green-50 border-green-200",
    text: "text-green-700",
    label: "Online",
  },
};

export const injectSeverityStyles: Record<
  InjectSeverity,
  { text: string; badge: string }
> = {
  critical: { text: "text-red-600", badge: "bg-red-100 text-red-700" },
  info: { text: "text-brand-600", badge: "bg-brand-100 text-brand-700" },
  warning: { text: "text-amber-600", badge: "bg-amber-100 text-amber-700" },
};
