import { useState, type KeyboardEvent } from 'react';
import { resolveProcedure, suggestProcedures, type Procedure } from '../procedures';

interface Props {
  id: string;
  value: string;
  onChange: (text: string) => void;
  invalid: boolean;
}

/**
 * Type-ahead for the procedure (FR-F1): a plain text input with a list of
 * matching known procedures below it. The user can keep typing, click a
 * suggestion, or use the arrow keys and Enter. Whether the final text is a
 * listed procedure is checked on submit, not here.
 */
export function ProcedureInput({ id, value, onChange, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // -1: no suggestion highlighted
  const suggestions = suggestProcedures(value);
  // The list overlays what is below it (the submit button), so it is shown only
  // while it can help: not once the text is already a listed procedure, and not
  // when nothing matches.
  const listVisible = open && suggestions.length > 0 && resolveProcedure(value) === null;
  const listId = `${id}-suggestions`;
  const optionId = (index: number) => `${id}-option-${index}`;

  function choose(procedure: Procedure) {
    onChange(procedure.label);
    setOpen(false);
    setActiveIndex(-1);
  }

  function highlight(index: number) {
    setOpen(true);
    setActiveIndex(index);
    document.getElementById(optionId(index))?.scrollIntoView({ block: 'nearest' });
  }

  function handleKeyDown(event: KeyboardEvent) {
    const active = listVisible ? suggestions[activeIndex] : undefined;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlight(Math.min(activeIndex + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlight(Math.max(activeIndex - 1, 0));
    } else if (event.key === 'Enter' && active) {
      event.preventDefault(); // pick the suggestion instead of submitting the form
      choose(active);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="typeahead">
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        placeholder="Start typing, e.g. crowns"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        aria-expanded={listVisible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={listVisible && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
      />
      {listVisible && (
        <ul className="suggestions" id={listId} role="listbox" aria-label="Procedures">
          {suggestions.map((procedure, index) => (
            <li
              key={procedure.value}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={index === activeIndex ? 'active' : undefined}
              // Keep focus in the input so the list does not close before the click lands.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(procedure)}
            >
              {procedure.label}
              <span className="suggestion-category">{procedure.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
