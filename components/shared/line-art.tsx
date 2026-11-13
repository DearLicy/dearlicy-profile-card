import { cn } from "@/lib/utils";

export function LineArt({ className }: { className?: string }) {
  return (
    <div className={cn("line-art", className)} aria-hidden="true">
      <svg viewBox="0 0 1440 960" preserveAspectRatio="xMidYMid slice">
        <g className="drift">
          <path
            className="stroke-a dash-a opacity-45"
            strokeWidth="1.2"
            d="M-80 220C180 80 305 289 520 208s340-95 508 12 311 40 480-37"
          />
          <path
            className="stroke-b dash-b opacity-35"
            strokeWidth="1"
            d="M-120 390C134 244 312 478 549 361s379-72 535 40 292 102 456 9"
          />
          <path
            className="stroke-c opacity-20"
            strokeWidth="14"
            d="M120 848C346 712 485 880 707 795s323-116 505-10 233 84 348 22"
          />
        </g>
        <g transform="translate(1170 118)" className="drift opacity-50">
          {[0, 28, 56, 84].map((offset) => (
            <ellipse
              key={offset}
              className="stroke-b"
              strokeWidth="1"
              cx="0"
              cy="0"
              rx={172 - offset}
              ry={76 - offset / 2}
              transform={`rotate(-22) translate(0 ${offset})`}
            />
          ))}
          <circle className="stroke-a" strokeWidth="2" cx="-88" cy="-28" r="4" />
        </g>
        <g transform="translate(142 782)" className="opacity-45">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <path
              key={index}
              className={index % 2 ? "stroke-a" : "stroke-b"}
              strokeWidth="1"
              d={`M${index * 22} 0L${55 + index * 27} ${-44 - index * 8}`}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
