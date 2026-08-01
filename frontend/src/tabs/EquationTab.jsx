import { useState } from "react";
import toast from "react-hot-toast";
import katex from "katex";
import LatexInput from "../components/LatexInput.jsx";
import PreviewPane from "../components/PreviewPane.jsx";
import ResultPane from "../components/ResultPane.jsx";
import GenerationOptions from "../components/GenerationOptions.jsx";
import { generateAnimation } from "../api.js";

const DEFAULT_LATEX = "E = mc^2";

export default function EquationTab() {
  const [latex, setLatex] = useState(DEFAULT_LATEX);
  const [isLoading, setIsLoading] = useState(false);
  const [gifUrl, setGifUrl] = useState(null);
  const [mp4Url, setMp4Url] = useState(null);
  const [pngUrl, setPngUrl] = useState(null);
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState(48);

  const handleGenerate = async () => {
    try {
      katex.renderToString(latex, { throwOnError: true, displayMode: true });
    } catch {
      toast.error("LaTeX 수식 문법을 확인해주세요.");
      return;
    }

    setGifUrl(null);
    setMp4Url(null);
    setPngUrl(null);
    setIsLoading(true);

    try {
      const { gifUrl: newGifUrl, mp4Url: newMp4Url, pngUrl: newPngUrl } = await generateAnimation(latex, {
        transparentBackground,
        backgroundColor,
        textColor,
        fontSize,
      });
      setGifUrl(newGifUrl);
      setMp4Url(newMp4Url);
      setPngUrl(newPngUrl);
      toast.success("애니메이션 생성 완료!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-2">
      <section className="space-y-6">
        <LatexInput value={latex} onChange={setLatex} disabled={isLoading} />
        <div>
          <h2 className="mb-2 text-sm font-medium text-slate-700">실시간 미리보기</h2>
          <PreviewPane latex={latex} />
        </div>
        <GenerationOptions
          transparentBackground={transparentBackground}
          onTransparentChange={setTransparentBackground}
          backgroundColor={backgroundColor}
          onBackgroundColorChange={setBackgroundColor}
          textColor={textColor}
          onTextColorChange={setTextColor}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
      </section>

      <section className="lg:sticky lg:top-6 lg:self-start">
        <h2 className="mb-2 text-sm font-medium text-slate-700">렌더링 결과</h2>
        <ResultPane
          gifUrl={gifUrl}
          mp4Url={mp4Url}
          pngUrl={pngUrl}
          isLoading={isLoading}
          altText="수식 애니메이션"
          downloadName="equation"
        />
      </section>
    </main>
  );
}
