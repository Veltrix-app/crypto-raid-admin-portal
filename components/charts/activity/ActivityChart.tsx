type Props = {
  items: { label: string; value: number }[];
};

export default function ActivityChart({ items }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[18px] border border-line bg-card2 px-3.5 py-3.5"
        >
          <p className="text-[13px] text-sub">{item.label}</p>
          <p className="mt-1.5 text-[1.02rem] font-extrabold text-text">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
