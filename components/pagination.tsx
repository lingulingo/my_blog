import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
};

export function Pagination({ currentPage, totalPages, makeHref }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <Link
          key={page}
          href={makeHref(page)}
          className={`rounded-full px-4 py-2 text-sm ${
            page === currentPage ? "bg-[var(--color-gold)] text-[var(--color-ink)]" : "border border-white/10 text-white"
          }`}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
