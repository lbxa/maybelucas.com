import { For } from "solid-js";

const COLORS = {
  add: "border-[#3fb950] bg-[#3fb950]",
  del: "border-[#cf222e] bg-[repeating-linear-gradient(-45deg,#cf222e_0px,#cf222e_3px,#ffd8d3_3px,#ffd8d3_6px)]",
  neutral: "border-[#484f58] bg-transparent",
};

function DiffstatBlocks({ additions, deletions }: { additions: number, deletions: number }) {
  const total = additions + deletions;
  if (total === 0) return null;

  const addRatio = additions / total;
  const delRatio = deletions / total;
  let greenBlocks = Math.floor(addRatio * 5);
  let redBlocks = Math.floor(delRatio * 5);
  let neutralBlocks = 5 - greenBlocks - redBlocks;

  const blocks = [
    ...Array(greenBlocks).fill("add"),
    ...Array(redBlocks).fill("del"),
    ...Array(neutralBlocks).fill("neutral"),
  ];

  return (
    <div class="flex gap-[3px] ml-2">
      <For each={blocks}>
        {(type) => (
          <div
            class={`w-[18px] h-[18px] rounded-[3px] border ${COLORS[type as keyof typeof COLORS]}`}
          />
        )}
      </For>
    </div>
  );
}

function Diffstat({ additions, deletions }: { additions: number, deletions: number }) {
  const formatNumber = (n: number) => n.toLocaleString("en-US");

  return (
    <div class="flex items-center gap-2">
      <span class="text-[#3fb950] text-[22px] font-bold tracking-tight">
        +{formatNumber(additions)}
      </span>
      <span class="text-[#f85149] text-[22px] font-bold tracking-tight ml-1.5">
        -{formatNumber(deletions)}
      </span>
      <DiffstatBlocks additions={additions} deletions={deletions} />
    </div>
  );
}

type GitHubLineChangesProps = {
  additions: number;
  deletions: number;
  class?: string;
};

export default function GitHubLineChanges(props: GitHubLineChangesProps) {
  const cardClasses =
    "inline-flex rounded-xl border border-black/10 bg-white/60 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5";

  return (
    <div class={`${cardClasses} ${props.class ?? ""}`}>
      <Diffstat additions={props.additions} deletions={props.deletions} />
    </div>
  );
}