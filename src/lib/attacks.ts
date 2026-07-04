export type AttackCategory =
  | "Malware"
  | "Network"
  | "Social"
  | "Insider"
  | "Cloud"
  | "Web";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Attack {
  id: string;
  title: string;
  category: AttackCategory;
  difficulty: Difficulty;
  duration: string;
  description: string;
  objectives: string[];
  icon: string;
  color: string;
}

export interface ResumeSession {
  attackId: string;
  attackTitle: string;
  progress: number;
  lastPlayed: string;
  module: string;
}

export const attacks: Attack[] = [
  {
    id: "ransomware",
    title: "Ransomware on Defense Contractor Network",
    category: "Malware",
    difficulty: "Intermediate",
    duration: "45 min",
    description:
      "02:47 AM — FS-01 and FS-02 are encrypting. Shadow copies are being deleted. You are the IR Lead on a defense contractor network. Based on Colonial Pipeline, 2021.",
    objectives: [
      "Activate IR plan and preserve forensic evidence",
      "Contain lateral movement toward DC-01",
      "Recover from offline backups in correct sequence",
    ],
    icon: "🔒",
    color: "from-red-500 to-orange-500",
  },
  {
    id: "phishing",
    title: "Spear Phishing Campaign",
    category: "Social",
    difficulty: "Beginner",
    duration: "30 min",
    description:
      "Multiple employees report suspicious emails impersonating your CFO. Investigate the campaign, assess credential exposure, and deploy user communication before damage spreads.",
    objectives: [
      "Analyze phishing indicators",
      "Reset compromised credentials",
      "Draft employee awareness alert",
    ],
    icon: "🎣",
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "ddos",
    title: "DDoS Attack",
    category: "Network",
    difficulty: "Intermediate",
    duration: "35 min",
    description:
      "Your public-facing services are overwhelmed by a volumetric attack. Work with your ISP, enable mitigation, and keep stakeholders informed while revenue-critical systems stay online.",
    objectives: [
      "Activate DDoS mitigation",
      "Preserve critical service availability",
      "Document attack patterns for forensics",
    ],
    icon: "🌊",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "insider",
    title: "Insider Threat",
    category: "Insider",
    difficulty: "Advanced",
    duration: "50 min",
    description:
      "Anomalies suggest a departing employee is exfiltrating IP. Balance HR sensitivity with security urgency — gather evidence, preserve chain of custody, and coordinate termination safely.",
    objectives: [
      "Detect data exfiltration patterns",
      "Preserve forensic evidence",
      "Coordinate HR and legal response",
    ],
    icon: "👤",
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "supply-chain",
    title: "Supply Chain Compromise",
    category: "Cloud",
    difficulty: "Advanced",
    duration: "55 min",
    description:
      "A trusted vendor update contains a backdoor. Determine blast radius across your environment, revoke compromised credentials, and rebuild trust with third-party integrations.",
    objectives: [
      "Map affected systems and dependencies",
      "Revoke vendor-issued credentials",
      "Implement vendor risk controls",
    ],
    icon: "🔗",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "zero-day",
    title: "Zero-Day Exploit",
    category: "Web",
    difficulty: "Advanced",
    duration: "60 min",
    description:
      "An unknown vulnerability is actively exploited in your web application. Patch under fire, engage your incident response team, and decide what to disclose to customers and regulators.",
    objectives: [
      "Identify exploited vulnerability",
      "Deploy emergency patch or WAF rule",
      "Manage external communications",
    ],
    icon: "⚡",
    color: "from-brand-500 to-indigo-500",
  },
  {
    id: "apt",
    title: "Advanced Persistent Threat",
    category: "Malware",
    difficulty: "Advanced",
    duration: "65 min",
    description:
      "Long-dwell adversary activity is discovered in your network. Hunt for C2 channels, evict the attacker without tipping them off, and harden detection for future campaigns.",
    objectives: [
      "Conduct threat hunting",
      "Identify C2 infrastructure",
      "Execute coordinated eviction",
    ],
    icon: "🎯",
    color: "from-slate-600 to-slate-800",
  },
  {
    id: "credential-stuffing",
    title: "Credential Stuffing",
    category: "Web",
    difficulty: "Beginner",
    duration: "25 min",
    description:
      "Automated login attempts spike using leaked credentials. Enable MFA enforcement, block malicious IPs, and assess whether any accounts were successfully compromised.",
    objectives: [
      "Detect brute-force patterns",
      "Enforce MFA on affected accounts",
      "Notify impacted users",
    ],
    icon: "🔑",
    color: "from-orange-500 to-red-400",
  },
];

export const resumeSession: ResumeSession = {
  attackId: "phishing",
  attackTitle: "Spear Phishing Campaign",
  progress: 62,
  lastPlayed: "2 days ago",
  module: "Module 3 — Credential Assessment",
};

export const categoryColors: Record<AttackCategory, string> = {
  Malware: "bg-red-50 text-red-700 border-red-100",
  Network: "bg-cyan-50 text-cyan-700 border-cyan-100",
  Social: "bg-amber-50 text-amber-700 border-amber-100",
  Insider: "bg-purple-50 text-purple-700 border-purple-100",
  Cloud: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Web: "bg-brand-50 text-brand-700 border-brand-100",
};

export const difficultyColors: Record<Difficulty, string> = {
  Beginner: "bg-green-50 text-green-700",
  Intermediate: "bg-yellow-50 text-yellow-700",
  Advanced: "bg-red-50 text-red-700",
};
