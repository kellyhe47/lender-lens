import { useId } from 'react';

interface Props {
  code: string;
  explanation: string;
  declined?: boolean;
}

/**
 * The raw reason code, with its explanation as a tooltip on hover and on
 * keyboard focus (FR-F8). The tooltip is plain CSS: see `.chip-tooltip`.
 */
export function ReasonChip({ code, explanation, declined = false }: Props) {
  const tooltipId = useId();
  return (
    <span className={declined ? 'chip chip-decline' : 'chip chip-ok'} tabIndex={0} aria-describedby={tooltipId}>
      {code}
      <span className="chip-tooltip" role="tooltip" id={tooltipId}>
        {explanation}
      </span>
    </span>
  );
}
