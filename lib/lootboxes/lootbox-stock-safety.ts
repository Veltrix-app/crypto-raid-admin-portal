export type LootboxStockSafetyStatus = "ready" | "needs_setup";

export type LootboxStockSafetyInput = {
  reserveRpcReady: boolean;
  restoreRpcReady: boolean;
  totalOutcomes: number;
  activeOutcomes: number;
  finiteStockOutcomes: number;
  finiteActiveOutcomes: number;
};

export type LootboxStockSafetyRead = LootboxStockSafetyInput & {
  status: LootboxStockSafetyStatus;
  label: string;
  summary: string;
  metrics: Array<{
    label: string;
    value: number | string;
  }>;
};

export function buildLootboxStockSafetyRead(
  input: LootboxStockSafetyInput
): LootboxStockSafetyRead {
  const rpcReady = input.reserveRpcReady && input.restoreRpcReady;
  const status: LootboxStockSafetyStatus = rpcReady ? "ready" : "needs_setup";
  const limitedLabel = pluralize(input.finiteActiveOutcomes, "active limited outcome");

  return {
    ...input,
    status,
    label: rpcReady ? "Stock RPC live" : "Stock RPC pending",
    summary: rpcReady
      ? input.finiteActiveOutcomes > 0
        ? `${limitedLabel} are protected before shard spend.`
        : "Limited stock will be protected before shard spend when operators enable it."
      : "Run the stock reservation migration before enabling finite-stock outcomes.",
    metrics: [
      { label: "Finite live", value: input.finiteActiveOutcomes },
      { label: "Finite total", value: input.finiteStockOutcomes },
      { label: "Active pool", value: input.activeOutcomes },
      { label: "RPC pair", value: rpcReady ? "Ready" : "Pending" },
    ],
  };
}

function pluralize(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}
