import { CURSOR_MARKER } from "../data/latexSymbols.js";

// Replaces value.slice(start, end) with `snippetWithMarker` (which contains
// exactly one CURSOR_MARKER) and returns the new full value plus the cursor
// position the marker resolved to.
export function applySnippetAtRange(value, start, end, snippetWithMarker) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const markerIndex = snippetWithMarker.indexOf(CURSOR_MARKER);
  const snippet = snippetWithMarker.split(CURSOR_MARKER).join("");
  const newValue = before + snippet + after;
  const cursorPos =
    markerIndex === -1 ? before.length + snippet.length : before.length + markerIndex;
  return { newValue, cursorPos };
}

export function insertSnippetAtCursor(textarea, snippetWithMarker) {
  return applySnippetAtRange(
    textarea.value,
    textarea.selectionStart,
    textarea.selectionEnd,
    snippetWithMarker,
  );
}

// Detects an in-progress "\command" the user is typing immediately before
// the cursor, e.g. "...\fr" -> { query: "fr", start: <index of the \\> }.
// Returns null when the cursor isn't right after a bare backslash-word.
export function findActiveTrigger(value, cursorPos) {
  const beforeCursor = value.slice(0, cursorPos);
  const match = beforeCursor.match(/\\([a-zA-Z]*)$/);
  if (!match) return null;
  return { query: match[1], start: cursorPos - match[1].length - 1 };
}
