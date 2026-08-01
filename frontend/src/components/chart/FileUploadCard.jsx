import { useRef, useState } from "react";

export default function FileUploadCard({ onLoad }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");

  const handleLoad = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setFileName(file.name);
    onLoad(file);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col items-center gap-3 md:flex-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <button
          type="button"
          onClick={handleLoad}
          className="w-full shrink-0 rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white transition hover:bg-indigo-700 md:w-40"
        >
          엑셀 로드
        </button>
      </div>
      {fileName && <p className="mt-2 text-xs text-slate-400">불러온 파일: {fileName}</p>}
    </div>
  );
}
