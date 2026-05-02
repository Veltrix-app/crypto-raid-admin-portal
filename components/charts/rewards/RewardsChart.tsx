type Props = {
  items: { label: string; value: number }[];
};

export default function RewardsChart({ items }: Props) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const pct = Math.round((item.value / total) * 100);

        return (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-white/[0.028] bg-white/[0.014] px-4 py-4"
          >
            <span className="text-text">{item.label}</span>
            <span className="font-bold text-primary">
              {item.value} ({pct}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}