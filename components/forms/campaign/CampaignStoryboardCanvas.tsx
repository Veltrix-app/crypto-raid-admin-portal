"use client";

import type {
  CampaignStoryboardBlock as CampaignStoryboardBlockModel,
  CampaignStoryboardBlockId,
} from "@/lib/studio/campaign-storyboard";
import CampaignStoryboardBlock from "@/components/forms/campaign/CampaignStoryboardBlock";

export default function CampaignStoryboardCanvas({
  blocks,
  selectedBlockId,
  onSelect,
}: {
  blocks: CampaignStoryboardBlockModel[];
  selectedBlockId: CampaignStoryboardBlockId;
  onSelect: (blockId: CampaignStoryboardBlockId) => void;
}) {
  if (blocks.length === 0) {
    return (
      <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
        <p className="text-lg font-black tracking-[-0.02em] text-text">
          Storyboard is still empty
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-sub">
          Pick a campaign direction or template first, then the storyboard will project the
          launch journey here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {blocks.map((block) => (
        <CampaignStoryboardBlock
          key={block.id}
          block={block}
          selected={block.id === selectedBlockId}
          onSelect={() => onSelect(block.id)}
        />
      ))}
    </div>
  );
}
