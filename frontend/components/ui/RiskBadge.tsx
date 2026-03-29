type Risk = "critical" | "high" | "medium" | "low";

const RISK_CLASSES: Record<Risk, string> = {
  critical: "risk-critical",
  high: "risk-high",
  medium: "risk-medium",
  low: "risk-low",
};

const RISK_LABELS: Record<Risk, string> = {
  critical: "Critical Risk",
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
};

interface RiskBadgeProps {
  risk: Risk;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  return <span className={RISK_CLASSES[risk]}>{RISK_LABELS[risk]}</span>;
}
