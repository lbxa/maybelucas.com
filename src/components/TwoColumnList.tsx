import { For } from "solid-js";

interface TwoColumnItem {
  left: string;
  right: string;
  url?: string;
}

interface TwoColumnListProps {
  items: TwoColumnItem[];
}

export default function TwoColumnList(props: TwoColumnListProps) {
  return (
    <div class="w-full">
      <For each={props.items}>
        {(item) => (
          <div class="flex gap-4 py-3 md:gap-8 md:py-2">
            <div class="min-w-[100px] md:min-w-[120px]">
              {item.url ? (
                <a
                  href={item.url}
                  class="text-blue-500 hover:underline py-md"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.left}
                </a>
              ) : (
                <span>{item.left}</span>
              )}
            </div>
            <div class="flex-1">{item.right}</div>
          </div>
        )}
      </For>
    </div>
  );
}
