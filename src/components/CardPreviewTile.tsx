import VisitingCardFace from "@/components/VisitingCardFace";
import type { VisitingCard } from "@/lib/types";

export default function CardPreviewTile({
  card,
  onSelect,
}: {
  card: VisitingCard;
  onSelect: (card: VisitingCard) => void;
}) {
  return (
    <article className="min-w-0">
      <div className="relative mx-auto w-full overflow-hidden rounded-[18px] transition duration-200 hover:-translate-y-1 hover:shadow-xl focus-within:ring-4 focus-within:ring-blue-500/30">
        <VisitingCardFace {...card} />
        <button
          type="button"
          onClick={() => onSelect(card)}
          aria-label={`Open full preview for ${card.fullName}`}
          title="Open full preview"
          className="absolute inset-0 z-20 cursor-zoom-in rounded-[18px] focus-visible:outline-none"
        >
          <span className="sr-only">Open full preview</span>
        </button>
      </div>
    </article>
  );
}
