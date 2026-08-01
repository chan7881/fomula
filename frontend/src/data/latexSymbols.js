// Cursor lands here after a snippet is inserted. A multi-char ASCII
// sentinel (rather than a Unicode marker) so it survives copy/paste and
// source-text round-trips reliably; stripped out by applySnippetAtRange.
export const CURSOR_MARKER = "@@CURSOR@@";

// `trigger` is the command name (no backslash) matched by the "\xyz"
// autocomplete. Entries without a `trigger` (e.g. superscript, matrices)
// are palette-only since they aren't typed as a bare backslash word.
export const LATEX_SYMBOLS = [
  // 자주 사용
  { id: "frac", trigger: "frac", category: "자주 사용", preview: "\\frac{a}{b}", insert: `\\frac{${CURSOR_MARKER}}{}` },
  { id: "sqrt", trigger: "sqrt", category: "자주 사용", preview: "\\sqrt{x}", insert: `\\sqrt{${CURSOR_MARKER}}` },
  { id: "power", trigger: null, category: "자주 사용", preview: "x^{n}", insert: `^{${CURSOR_MARKER}}` },
  { id: "sub", trigger: null, category: "자주 사용", preview: "x_{n}", insert: `_{${CURSOR_MARKER}}` },
  { id: "sum", trigger: "sum", category: "자주 사용", preview: "\\sum_{i=1}^{n}", insert: `\\sum_{${CURSOR_MARKER}}^{}` },
  { id: "int", trigger: "int", category: "자주 사용", preview: "\\int_{a}^{b}", insert: `\\int_{${CURSOR_MARKER}}^{}` },
  { id: "lim", trigger: "lim", category: "자주 사용", preview: "\\lim_{x \\to a}", insert: `\\lim_{x \\to ${CURSOR_MARKER}}` },
  { id: "infty", trigger: "infty", category: "자주 사용", preview: "\\infty", insert: `\\infty${CURSOR_MARKER}` },

  // 첨자 / 근호
  { id: "nthroot", trigger: "sqrt", category: "첨자·근호", preview: "\\sqrt[n]{x}", insert: `\\sqrt[${CURSOR_MARKER}]{}` },
  { id: "prod", trigger: "prod", category: "첨자·근호", preview: "\\prod_{i=1}^{n}", insert: `\\prod_{${CURSOR_MARKER}}^{}` },
  { id: "vec", trigger: "vec", category: "첨자·근호", preview: "\\vec{v}", insert: `\\vec{${CURSOR_MARKER}}` },
  { id: "hat", trigger: "hat", category: "첨자·근호", preview: "\\hat{x}", insert: `\\hat{${CURSOR_MARKER}}` },
  { id: "bar", trigger: "bar", category: "첨자·근호", preview: "\\bar{x}", insert: `\\bar{${CURSOR_MARKER}}` },
  { id: "dot", trigger: "dot", category: "첨자·근호", preview: "\\dot{x}", insert: `\\dot{${CURSOR_MARKER}}` },

  // 그리스 문자
  { id: "alpha", trigger: "alpha", category: "그리스 문자", preview: "\\alpha", insert: `\\alpha${CURSOR_MARKER}` },
  { id: "beta", trigger: "beta", category: "그리스 문자", preview: "\\beta", insert: `\\beta${CURSOR_MARKER}` },
  { id: "gamma", trigger: "gamma", category: "그리스 문자", preview: "\\gamma", insert: `\\gamma${CURSOR_MARKER}` },
  { id: "delta", trigger: "delta", category: "그리스 문자", preview: "\\delta", insert: `\\delta${CURSOR_MARKER}` },
  { id: "epsilon", trigger: "epsilon", category: "그리스 문자", preview: "\\epsilon", insert: `\\epsilon${CURSOR_MARKER}` },
  { id: "theta", trigger: "theta", category: "그리스 문자", preview: "\\theta", insert: `\\theta${CURSOR_MARKER}` },
  { id: "lambda", trigger: "lambda", category: "그리스 문자", preview: "\\lambda", insert: `\\lambda${CURSOR_MARKER}` },
  { id: "mu", trigger: "mu", category: "그리스 문자", preview: "\\mu", insert: `\\mu${CURSOR_MARKER}` },
  { id: "pi", trigger: "pi", category: "그리스 문자", preview: "\\pi", insert: `\\pi${CURSOR_MARKER}` },
  { id: "sigma", trigger: "sigma", category: "그리스 문자", preview: "\\sigma", insert: `\\sigma${CURSOR_MARKER}` },
  { id: "phi", trigger: "phi", category: "그리스 문자", preview: "\\phi", insert: `\\phi${CURSOR_MARKER}` },
  { id: "omega", trigger: "omega", category: "그리스 문자", preview: "\\omega", insert: `\\omega${CURSOR_MARKER}` },

  // 연산자 / 기호
  { id: "pm", trigger: "pm", category: "연산자·기호", preview: "\\pm", insert: `\\pm${CURSOR_MARKER}` },
  { id: "times", trigger: "times", category: "연산자·기호", preview: "\\times", insert: `\\times${CURSOR_MARKER}` },
  { id: "cdot", trigger: "cdot", category: "연산자·기호", preview: "\\cdot", insert: `\\cdot${CURSOR_MARKER}` },
  { id: "div", trigger: "div", category: "연산자·기호", preview: "\\div", insert: `\\div${CURSOR_MARKER}` },
  { id: "neq", trigger: "neq", category: "연산자·기호", preview: "\\neq", insert: `\\neq${CURSOR_MARKER}` },
  { id: "leq", trigger: "leq", category: "연산자·기호", preview: "\\leq", insert: `\\leq${CURSOR_MARKER}` },
  { id: "geq", trigger: "geq", category: "연산자·기호", preview: "\\geq", insert: `\\geq${CURSOR_MARKER}` },
  { id: "approx", trigger: "approx", category: "연산자·기호", preview: "\\approx", insert: `\\approx${CURSOR_MARKER}` },
  { id: "partial", trigger: "partial", category: "연산자·기호", preview: "\\partial", insert: `\\partial${CURSOR_MARKER}` },
  { id: "nabla", trigger: "nabla", category: "연산자·기호", preview: "\\nabla", insert: `\\nabla${CURSOR_MARKER}` },
  { id: "rightarrow", trigger: "rightarrow", category: "연산자·기호", preview: "\\rightarrow", insert: `\\rightarrow${CURSOR_MARKER}` },
  { id: "leftrightarrow", trigger: "leftrightarrow", category: "연산자·기호", preview: "\\leftrightarrow", insert: `\\leftrightarrow${CURSOR_MARKER}` },

  // 함수
  { id: "sin", trigger: "sin", category: "함수", preview: "\\sin", insert: `\\sin${CURSOR_MARKER}` },
  { id: "cos", trigger: "cos", category: "함수", preview: "\\cos", insert: `\\cos${CURSOR_MARKER}` },
  { id: "tan", trigger: "tan", category: "함수", preview: "\\tan", insert: `\\tan${CURSOR_MARKER}` },
  { id: "log", trigger: "log", category: "함수", preview: "\\log", insert: `\\log${CURSOR_MARKER}` },
  { id: "ln", trigger: "ln", category: "함수", preview: "\\ln", insert: `\\ln${CURSOR_MARKER}` },
  { id: "exp", trigger: "exp", category: "함수", preview: "\\exp", insert: `\\exp${CURSOR_MARKER}` },

  // 괄호 / 행렬
  { id: "parens", trigger: null, category: "괄호·행렬", preview: "\\left(x\\right)", insert: `\\left(${CURSOR_MARKER}\\right)` },
  { id: "brackets", trigger: null, category: "괄호·행렬", preview: "\\left[x\\right]", insert: `\\left[${CURSOR_MARKER}\\right]` },
  { id: "braces", trigger: null, category: "괄호·행렬", preview: "\\left\\{x\\right\\}", insert: `\\left\\{${CURSOR_MARKER}\\right\\}` },
  { id: "abs", trigger: null, category: "괄호·행렬", preview: "\\left|x\\right|", insert: `\\left|${CURSOR_MARKER}\\right|` },
  {
    id: "pmatrix",
    trigger: null,
    category: "괄호·행렬",
    preview: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}",
    insert: `\\begin{pmatrix} ${CURSOR_MARKER} & \\\\ & \\end{pmatrix}`,
  },
];

export const LATEX_CATEGORIES = [...new Set(LATEX_SYMBOLS.map((s) => s.category))];
