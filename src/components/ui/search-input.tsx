"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "Search…",
  debounceMs = 300,
  className,
  autoFocus,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if controlled value changes externally
  useEffect(() => {
    if (controlledValue !== undefined) setLocalValue(controlledValue);
  }, [controlledValue]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setLocalValue(next);
    onChange?.(next);

    if (onSearch) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onSearch(next), debounceMs);
    }
  }

  function handleClear() {
    setLocalValue("");
    onChange?.("");
    onSearch?.("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (timer.current) clearTimeout(timer.current);
      onSearch?.(localValue);
    }
    if (e.key === "Escape") handleClear();
  }

  return (
    <Input
      type="text"
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={cn("h-9", className)}
      leftAdornment={<SearchIcon className="w-4 h-4" />}
      rightAdornment={
        localValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="rounded hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <XIcon className="w-4 h-4" />
          </button>
        ) : undefined
      }
    />
  );
}
