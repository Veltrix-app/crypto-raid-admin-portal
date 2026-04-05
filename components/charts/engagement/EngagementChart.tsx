type Props = {
  items: { label: string; value: number }[];
};

export default function EngagementChart({ items }: Props) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const width = (item.value / max) * 100;

        return (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-text">{item.label}</span>
              <span className="text-sub">{item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-card2">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}