interface TwoColumnItem {
  left: string;
  right: string;
  url?: string;
}

interface TwoColumnListProps {
  items: TwoColumnItem[];
}

export default function TwoColumnList({ items }: TwoColumnListProps) {
  return (
    <div className="w-full">
      {items.map((item, index) => (
        <div key={index} className="flex gap-4 py-3 md:gap-8 md:py-2">
          <div className="min-w-[100px] md:min-w-[120px]">
            {item.url ? (
              <a
                href={item.url}
                className="text-blue-500 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.left}
              </a>
            ) : (
              <span>{item.left}</span>
            )}
          </div>
          <div className="flex-1">{item.right}</div>
        </div>
      ))}
    </div>
  );
}

