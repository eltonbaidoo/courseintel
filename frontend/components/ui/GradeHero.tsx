interface GradeHeroProps {
  percent: number;
  letterGrade: string;
  subtitle?: string;
}

export function GradeHero({ percent, letterGrade, subtitle }: GradeHeroProps) {
  return (
    <div className="card p-6 text-center">
      <p className="stat-number text-5xl">{percent.toFixed(1)}%</p>
      <p className="mt-1 font-display text-xl font-semibold text-espresso-950">
        {letterGrade}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-burnt-peach-500">{subtitle}</p>
      )}
    </div>
  );
}
