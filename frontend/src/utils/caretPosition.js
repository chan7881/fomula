// Computes the pixel offset of the caret inside a <textarea> by mirroring
// its text into an off-screen div with identical text-layout styles, then
// measuring a marker span inserted at the caret position.
const MIRROR_STYLE_PROPS = [
  "boxSizing",
  "width",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
];

export function getCaretCoordinates(textarea, position) {
  const computed = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");

  MIRROR_STYLE_PROPS.forEach((prop) => {
    mirror.style[prop] = computed[prop];
  });
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";
  mirror.style.height = "auto";

  mirror.textContent = textarea.value.slice(0, position);

  const marker = document.createElement("span");
  marker.textContent = textarea.value.slice(position) || ".";
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop;
  const left = marker.offsetLeft;
  document.body.removeChild(mirror);

  const lineHeight = parseInt(computed.lineHeight, 10) || 20;

  return {
    top: top - textarea.scrollTop,
    left: left - textarea.scrollLeft,
    height: lineHeight,
  };
}
