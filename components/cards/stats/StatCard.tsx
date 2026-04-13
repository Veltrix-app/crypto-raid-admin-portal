import { OpsMetricCard } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  label: string;
  value: string | number;
  sub?: string;
};

export default function StatCard({ label, value, sub }: Props) {
  return <OpsMetricCard label={label} value={value} sub={sub} />;
}
