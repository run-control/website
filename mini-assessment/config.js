window.ASSESSMENT_CONFIG = {
  brand: {
    logoUrl: "../static/assets/logo-bar.png",
    tagline: "Quick security check",
    bg: "#000000",
    surface: "#0A0A0A",
    surfaceElev: "#0E0E0E",
    text: "#FFFFFF",
    muted: "#A9B1BC",
    accentOrange: "#FF8A00",
    accentBlue: "#00AEEF",
    headerBarColor: "#00172C",
    headerBarHeight: "8px",
    border: "rgba(0,174,239,0.35)",
    shadow: "0 8px 30px rgba(0,0,0,0.45)",
    strokeWhite: "rgba(255,255,255,0.85)",
    riskHigh: "#e53935",
    riskMedium: "#fb8c00",
    riskLow: "#fdd835",
    riskMin: "#43a047",
  },
  cta: {
    text: "Book a free consultation",
    url: "https://outlook.office.com/book/VectariIntroduction@vectari.co/?ismsaljsauthenabled",
  },
  texts: {
    seeResults: "See Results",
    next: "Next",
    startOver: "Retake assessment",
    gapsTitle: "Opportunities for improvement",
    severityCritical: "Critical",
    severityMajor: "Major",
    severityMinor: "Minor",
    noGaps: "No immediate gaps detected",
  },
  wizard: {
    autoAdvance: true,
    history: true,
  },
  ranges: [
    {
      min: 0,
      max: 10,
      title: "Critical Security Gaps Detected",
      message:
        "Your business is at significant risk. A single phishing email, lost laptop, or vendor breach could cause major damage — financial loss, legal exposure, or reputational harm. Most companies in this range lack foundational controls, so attackers or auditors will find gaps quickly.",
    },
    {
      min: 11,
      max: 20,
      title: "Gaps Leave You Vulnerable",
      message:
        "You have some protections, but big gaps remain — like locking the front door while the windows are open. Incomplete coverage creates blind spots that attackers (and regulators) can exploit. Focused improvements can close risks quickly without slowing the business.",
    },
    {
      min: 21,
      max: 30,
      title: "Strong Foundation, Keep Improving",
      message:
        "You’re on the right track. Threats and rules evolve constantly, and strong programs still fail if not maintained, tested, and improved. Keep momentum with regular validation, training, and reviews.",
    },
  ],
  questions: [
    {
      text: "Do you have a written security policy in place for employees?",
      options: [
        {
          label: "No policy at all",
          score: 0,
          risk: "Without a written policy, employees are left guessing, which leads to mistakes and liability.",
        },
        {
          label: "Informal or outdated",
          score: 1,
          risk: "An outdated policy is almost as risky as having none — regulators expect current documentation.",
        },
        { label: "Yes, documented", score: 2 },
        { label: "Yes, reviewed annually", score: 3 },
      ],
    },
    {
      text: "How do you manage employee access to systems?",
      options: [
        {
          label: "Everyone has same access",
          score: 0,
          risk: "If everyone is an admin, a single compromised account can take down your whole business.",
        },
        {
          label: "Accounts rarely reviewed",
          score: 1,
          risk: "Stale accounts (like ex-employees) are a favorite attack path for hackers.",
        },
        { label: "Role-based, reviewed occasionally", score: 2 },
        {
          label: "Role-based, reviewed regularly + consistent offboarding",
          score: 3,
        },
      ],
    },
    {
      text: "Do you use Multi-Factor Authentication (MFA)?",
      options: [
        {
          label: "Not at all",
          score: 0,
          risk: "Passwords alone are the #1 cause of breaches — MFA is the easiest and most effective fix.",
        },
        {
          label: "Only for email",
          score: 1,
          risk: "Attackers go after finance, SSO, and files — partial MFA leaves major gaps.",
        },
        { label: "Some critical systems", score: 2 },
        { label: "Everywhere possible", score: 3 },
      ],
    },
    {
      text: "Do you regularly back up critical business data?",
      options: [
        {
          label: "No backups",
          score: 0,
          risk: "If ransomware hits tomorrow, you may have no way to recover your data.",
        },
        {
          label: "Manual, occasional",
          score: 1,
          risk: "Unverified manual backups often fail when needed most — testing is critical.",
        },
        {
          label: "Automated, untested",
          score: 2,
          risk: "Backups can be corrupt or incomplete; test restores validate them.",
        },
        { label: "Automated and tested", score: 3 },
      ],
    },
    {
      text: "How do you handle employee cybersecurity training?",
      options: [
        {
          label: "None",
          score: 0,
          risk: "Employees are your biggest risk — phishing and mishandling data are common entry points.",
        },
        {
          label: "One-time only",
          score: 1,
          risk: "Threats evolve constantly; a one-and-done class leaves staff unprepared.",
        },
        { label: "Annual training or phishing tests", score: 2 },
        { label: "Ongoing, role-based training & awareness", score: 3 },
      ],
    },
    {
      text: "Do you have a process for responding to security incidents?",
      options: [
        {
          label: "No process",
          score: 0,
          risk: "In a breach, every minute counts. Without a plan, confusion and delay multiply damage.",
        },
        {
          label: "Ad-hoc only",
          score: 1,
          risk: "Unpracticed plans usually fail — rehearsals make response effective.",
        },
        {
          label: "Documented, untested",
          score: 2,
          risk: "Runbooks must be exercised to work under pressure.",
        },
        { label: "Documented, tested, updated", score: 3 },
      ],
    },
    {
      text: "How do you manage vendor and third-party risks?",
      options: [
        {
          label: "No checks",
          score: 0,
          risk: "Third parties are a fast-growing source of breaches. If they’re weak, you’re weak.",
        },
        {
          label: "Informal checks",
          score: 1,
          risk: "Verbal assurances don’t count in audits — you need evidence and contracts.",
        },
        { label: "Occasional documentation", score: 2 },
        { label: "Formal reviews, contracts, monitoring", score: 3 },
      ],
    },
    {
      text: "What protections are in place for endpoints (laptops, PCs, mobile)?",
      options: [
        {
          label: "None/basic AV",
          score: 0,
          risk: "Modern attackers bypass traditional AV quickly — EDR/MDR is the new baseline.",
        },
        {
          label: "AV + occasional updates",
          score: 1,
          risk: "Weak patching leaves known holes exploitable within days of disclosure.",
        },
        { label: "Endpoint protection + patching policy", score: 2 },
        { label: "EDR/MDR monitoring + enforced patching", score: 3 },
      ],
    },
    {
      text: "Do you perform security testing or audits?",
      options: [
        {
          label: "Never",
          score: 0,
          risk: "If you never test, you’re blind to gaps until an attacker or auditor finds them first.",
        },
        {
          label: "Sometimes, after issues",
          score: 1,
          risk: "Reactive testing means you’re always a step behind threats.",
        },
        { label: "Annual external audit or penetration test", score: 2 },
        { label: "Regular assessments + ongoing monitoring", score: 3 },
      ],
    },
    {
      text: "How do you ensure compliance with industry or regulatory requirements?",
      options: [
        {
          label: "We don’t",
          score: 0,
          risk: "Non-compliance can result in fines, lawsuits, and lost clients — even without a breach.",
        },
        {
          label: "Aware but undocumented",
          score: 1,
          risk: "Regulators expect proof, not intent. Documentation and monitoring are required.",
        },
        { label: "Partial compliance", score: 2 },
        { label: "Fully documented, monitored, and validated", score: 3 },
      ],
    },
  ],
};
