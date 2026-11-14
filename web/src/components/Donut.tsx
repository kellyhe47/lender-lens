import { formatCurrency } from '../format';

interface Props {
  principal: number;
  interest: number;
  total: number;
}

// With this radius the circle's circumference is 100, so a dash of length N
// covers N percent of the ring.
const RADIUS = 15.915;
const GAP = 1; // a sliver of background between the two segments

/**
 * Principal vs total interest as a two-segment ring (FR-F6). The caption is
 * the text equivalent, so the SVG itself is hidden from screen readers. The
 * only arithmetic here is the interest's share of the ring, for drawing.
 */
export function Donut({ principal, interest, total }: Props) {
  const interestShare = Math.min(Math.max((interest / total) * 100, 0), 100);
  const principalShare = 100 - interestShare;

  return (
    <figure className="donut">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        {/* Rotated so the ring starts at 12 o'clock: principal first, then interest. */}
        <g transform="rotate(-90 18 18)" fill="none" strokeWidth="5">
          <circle
            className="donut-principal"
            cx="18"
            cy="18"
            r={RADIUS}
            strokeDasharray={`${Math.max(principalShare - GAP, 0)} 100`}
          />
          <circle
            className="donut-interest"
            cx="18"
            cy="18"
            r={RADIUS}
            strokeDasharray={`${Math.max(interestShare - GAP, 0)} 100`}
            strokeDashoffset={-principalShare}
          />
        </g>
      </svg>
      <figcaption>
        <span>
          <i className="legend-dot donut-principal" />
          {formatCurrency(principal)} principal
        </span>
        {' + '}
        <span>
          <i className="legend-dot donut-interest" />
          {formatCurrency(interest)} interest
        </span>
        {' = '}
        <span>{formatCurrency(total)}</span>
      </figcaption>
    </figure>
  );
}
