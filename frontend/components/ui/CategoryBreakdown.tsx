"use client";

interface Category {
  name: string;
  weight: number; // 0–1
  percent?: number; // category grade 0–100, optional
}

interface CategoryBreakdownProps {
  categories: Category[];
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-honeydew-800">{cat.name}</span>
            <span className="font-mono text-honeydew-600">
              {(cat.weight * 100).toFixed(0)}%
              {cat.percent != null && (
                <span className="ml-2 text-honeydew-800 font-semibold">
                  ({cat.percent.toFixed(1)}%)
                </span>
              )}
            </span>
          </div>
          <div className="h-2 rounded-full bg-honeydew-100 overflow-hidden">
            <div
              className="h-2 rounded-full bg-honeydew-400 transition-all duration-500"
              style={{ width: `${cat.weight * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
