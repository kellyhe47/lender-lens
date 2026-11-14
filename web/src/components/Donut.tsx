import { formatCurrency } from '../format';

interface Props {
  principal: number;
  interest: number;
  total: number;
}

// With this radius the circle's circumference is 100, so a dash of length N
// covers N percent of the ring.
const RADIUS = 15.915;
const STROKE = 5;
const GAP = 1; // a sliver of background between the two segments
// The stroke is centered on the radius, so the ring reaches RADIUS + STROKE / 2
// from the middle. The drawing area has to be at least that big or the ring's
// edges are clipped.
const CENTER = 20;
const SIZE = CENTER * 2;

/**
 * Principal vs total interest as a two-segment ring (FR-F6). The breakdown
 * under it is the text equivalent, so the SVG is hidden from screen readers. The
 * only arithmetic here is the interest's share of the ring, for drawing.
 */
export function Donut({ principal, interest, total }: Props) {
  const interestShare = Math.min(Math.max((interest / total) * 100, 0), 100);
  const principalShare = 100 - interestShare;

  return (
    <figure className="donut">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        {/* Rotated so the ring starts at 12 o'clock: principal first, then interest. */}
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`} fill="none" strokeWidth={STROKE}>
          <circle
            className="donut-principal"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeDasharray={`${Math.max(principalShare - GAP, 0)} 100`}
          />
          <circle
            className="donut-interest"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeDasharray={`${Math.max(interestShare - GAP, 0)} 100`}
            strokeDashoffset={-principalShare}
          />
        </g>
      </svg>
      {/* One row each: color dot, label, amount. The total gets its own row. */}
      <figcaption className="breakdown">
        <i className="legend-dot donut-principal" />
        <span>Principal</span>
        <span className="breakdown-amount">{formatCurrency(principal)}</span>

        <i className="legend-dot donut-interest" />
        <span>Interest</span>
        <span className="breakdown-amount">{formatCurrency(interest)}</span>

        <span>=</span>
        <span className="breakdown-amount breakdown-total">{formatCurrency(total)}</span>
      </figcaption>
    </figure>
  );
}
