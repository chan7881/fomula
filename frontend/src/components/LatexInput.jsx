import { useCallback, useRef, useState } from "react";
import { LATEX_SYMBOLS } from "../data/latexSymbols.js";
import { applySnippetAtRange, findActiveTrigger } from "../utils/latexEditing.js";
import { getCaretCoordinates } from "../utils/caretPosition.js";
import AutocompleteDropdown from "./AutocompleteDropdown.jsx";
import SymbolPalette from "./SymbolPalette.jsx";

const TRIGGERABLE_SYMBOLS = LATEX_SYMBOLS.filter((s) => s.trigger);
const MAX_SUGGESTIONS = 8;
const DROPDOWN_WIDTH = 224;

export default function LatexInput({ value, onChange, disabled }) {
  const textareaRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [triggerStart, setTriggerStart] = useState(null);

  const closeDropdown = useCallback(() => {
    setSuggestions([]);
    setTriggerStart(null);
  }, []);

  const refreshAutocomplete = useCallback(
    (nextValue, cursorPos) => {
      const trigger = findActiveTrigger(nextValue, cursorPos);
      if (!trigger) {
        closeDropdown();
        return;
      }
      const query = trigger.query.toLowerCase();
      const matches = TRIGGERABLE_SYMBOLS.filter((s) => s.trigger.startsWith(query)).slice(
        0,
        MAX_SUGGESTIONS,
      );
      if (matches.length === 0) {
        closeDropdown();
        return;
      }
      setSuggestions(matches);
      setActiveIndex(0);
      setTriggerStart(trigger.start);

      const textarea = textareaRef.current;
      const coords = getCaretCoordinates(textarea, cursorPos);
      setDropdownPos({
        top: coords.top + coords.height + 4,
        left: Math.min(coords.left, Math.max(textarea.clientWidth - DROPDOWN_WIDTH, 0)),
      });
    },
    [closeDropdown],
  );

  const applyAndFocus = (newValue, cursorPos) => {
    onChange(newValue);
    closeDropdown();
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const acceptSuggestion = (symbol) => {
    const textarea = textareaRef.current;
    const { newValue, cursorPos } = applySnippetAtRange(
      textarea.value,
      triggerStart,
      textarea.selectionStart,
      symbol.insert,
    );
    applyAndFocus(newValue, cursorPos);
  };

  const handlePaletteInsert = (snippet) => {
    const textarea = textareaRef.current;
    const { newValue, cursorPos } = applySnippetAtRange(
      textarea.value,
      textarea.selectionStart,
      textarea.selectionEnd,
      snippet,
    );
    applyAndFocus(newValue, cursorPos);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    refreshAutocomplete(e.target.value, e.target.selectionStart);
  };

  const handleSelect = () => {
    const textarea = textareaRef.current;
    refreshAutocomplete(textarea.value, textarea.selectionStart);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      acceptSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown();
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="latex-input" className="mb-2 block text-sm font-medium text-slate-700">
          LaTeX 수식
        </label>
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="latex-input"
            value={value}
            disabled={disabled}
            onChange={handleChange}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            onBlur={closeDropdown}
            rows={6}
            placeholder={"예: E = mc^2  또는  \\int_{a}^{b} x^2 dx  (\\ 입력 시 자동완성)"}
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-sm leading-6 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
          />
          <AutocompleteDropdown
            items={suggestions}
            activeIndex={activeIndex}
            position={dropdownPos}
            onSelect={acceptSuggestion}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          \ 뒤에 명령어를 입력하면 자동완성이 나타납니다 — Tab 또는 Enter로 적용
        </p>
      </div>
      <SymbolPalette onInsert={handlePaletteInsert} />
    </div>
  );
}
