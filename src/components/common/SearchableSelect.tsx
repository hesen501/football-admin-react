import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface SearchableSelectOption {
  value: number;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: number | '';
  onChange: (value: number | '') => void;
  placeholder: string;
  /**
   * When set, a selectable row with this label (value '') is pinned to the
   * top of the dropdown — the "All venues"-style entry for a filter-bar
   * select. Create-modal pickers (customer/venue/field) that always need a
   * real selection omit this.
   */
  emptyOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

/**
 * A searchable stand-in for a plain `<select>` over a list already loaded
 * client-side (venues/fields/customers/items — every list in this app small
 * enough to fetch in one page, see the `per_page: 100` callers) — filtering
 * is a local substring match, no extra API calls. Typing narrows the
 * dropdown; clicking a row (or the venue/field/etc. it belongs to) selects
 * it, same end result as choosing a `<select>` option.
 */
const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  emptyOptionLabel,
  disabled,
  required,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((o) => o.label.toLowerCase().includes(normalizedQuery))
    : options;
  const showEmptyRow = Boolean(emptyOptionLabel) && (!normalizedQuery || emptyOptionLabel!.toLowerCase().includes(normalizedQuery));

  const selectValue = (v: number | '') => {
    onChange(v);
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length === 1) {
        selectValue(filteredOptions[0].value);
      } else if (filteredOptions.length === 0 && showEmptyRow) {
        selectValue('');
      }
    }
  };

  return (
    <div className="searchable-select" ref={wrapperRef}>
      <div className="searchable-select-input-wrap">
        <input
          id={id}
          type="text"
          className="form-input"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          autoComplete="off"
          required={required && !value}
          disabled={disabled}
          placeholder={placeholder}
          value={isOpen ? query : selectedLabel}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {value !== '' && !isOpen ? (
          <button
            type="button"
            className="searchable-select-clear"
            onClick={() => selectValue('')}
            aria-label="Seçimi ləğv et"
          >
            <X size={14} />
          </button>
        ) : (
          <ChevronDown size={14} className="searchable-select-chevron" />
        )}
      </div>

      {isOpen && (
        <ul className="searchable-select-dropdown" role="listbox" id={listboxId}>
          {showEmptyRow && (
            <li>
              <button type="button" role="option" aria-selected={value === ''} onClick={() => selectValue('')}>
                {emptyOptionLabel}
              </button>
            </li>
          )}
          {filteredOptions.length === 0 && !showEmptyRow ? (
            <li className="searchable-select-empty">Nəticə tapılmadı</li>
          ) : (
            filteredOptions.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={option.value === value ? 'is-selected' : ''}
                  onClick={() => selectValue(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default SearchableSelect;
