import { useState } from "react";
import { Toaster } from "react-hot-toast";
import EquationTab from "./tabs/EquationTab.jsx";
import ChartTab from "./tabs/ChartTab.jsx";

const TABS = [
  { id: "equation", label: "수식 애니메이션" },
  { id: "chart", label: "그래프" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("equation");

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" />
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <h1 className="text-xl font-semibold text-slate-900">수식 · 그래프 애니메이션 생성기</h1>
          <p className="text-sm text-slate-500">
            LaTeX 수식이나 엑셀 데이터를 입력하면 Manim이 GIF·MP4·PNG로 만들어줍니다.
          </p>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "border-b-2 border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "equation" ? <EquationTab /> : <ChartTab />}
    </div>
  );
}
