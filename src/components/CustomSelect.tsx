import { useCallback, useEffect, useRef, useState } from "react";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  id?: string;
  variant?: "default" | "compact";
}

export default function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  id,
  variant = "default",
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  const select = useCallback(
    (val: T) => {
      onChange(val);
      close();
      triggerRef.current?.focus();
    },
    [onChange, close],
  );

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Focus list when opened, scroll focused option into view
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || focusedIndex < 0) return;
    const list = listRef.current;
    const item = list?.children[focusedIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [open, focusedIndex]);

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        e.preventDefault();
        setOpen(true);
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        break;
    }
  };

  const handleListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0) select(options[focusedIndex].value);
        break;
      case "Escape":
        e.preventDefault();
        close();
        triggerRef.current?.focus();
        break;
      case "Tab":
        close();
        break;
    }
  };

  const isCompact = variant === "compact";
  const bg = isCompact ? "bg-gray-700" : "bg-gray-800";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center justify-between whitespace-nowrap rounded text-left text-sm text-gray-100 transition-colors ${bg} ${
          isCompact ? "py-1 pl-2.5 pr-7" : "py-2 pl-3 pr-8"
        } ${open ? "ring-2 ring-emerald-500" : ""}`}
      >
        <span className="truncate">{selectedOption?.label ?? value}</span>
        <svg
          className={`pointer-events-none absolute ${isCompact ? "right-2" : "right-2.5"} top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          onKeyDown={handleListKeyDown}
          tabIndex={-1}
          className="absolute right-0 z-50 mt-1 max-h-56 min-w-[10rem] overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl"
          style={{ animation: "fade-in 120ms cubic-bezier(0.25,1,0.5,1)" }}
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isFocused = i === focusedIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setFocusedIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(option.value);
                }}
                className={`flex cursor-pointer items-center px-3 text-sm transition-colors duration-75 ${
                  isCompact ? "py-1.5" : "py-2"
                } ${
                  isFocused
                    ? "bg-gray-700 text-gray-100"
                    : "text-gray-300"
                } ${isSelected ? "text-emerald-400" : ""}`}
              >
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <svg
                    className="ml-2 h-3.5 w-3.5 shrink-0 text-emerald-400"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 8 6.5 11.5 13 4.5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
