interface GradeHeroProps {
  percent: number;
  letterGrade: string;
  subtitle?: string;
}

export function GradeHero({ percent, letterGrade, subtitle }: GradeHeroProps) {
  return (
    <div className="card p-6 text-center">
      <p className="stat-number text-5xl">{percent.toFixed(1)}%</p>
      <p className="mt-1 font-display text-xl font-semibold text-honeydew-800">
        {letterGrade}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-honeydew-500">{subtitle}</p>
      )}
    </div>
  );
}
