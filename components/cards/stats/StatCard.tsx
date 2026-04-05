type Props = {
  label: string;
  value: string | number;
  sub?: string;
};

export default function StatCard({ label, value, sub }: Props) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5 shadow-neon">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-text">{value}</p>
      {sub ? <p className="mt-2 text-sm text-primary">{sub}</p> : null}
    </div>
  );
}