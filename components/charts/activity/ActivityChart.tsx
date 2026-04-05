type Props = {
  items: { label: string; value: number }[];
};

export default function ActivityChart({ items }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-line bg-card2 px-4 py-5"
        >
          <p className="text-sm text-sub">{item.label}</p>
          <p className="mt-2 text-2xl font-extrabold text-text">{item.value}</p>
        </div>
      ))}
    </div>
  );
}