import { escapeRegExp } from "@/lib/utils";

type HighlightTextProps = {
  text: string;
  query: string;
  className?: string;
};

export function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, "ig");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded bg-[rgba(212,177,106,0.28)] px-1 text-[var(--color-cream)]">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  );
}
