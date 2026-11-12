import { PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { TopGnb } from "@/components/Gnb";
import { PagesPanel } from "@/features/canvas/LeftPanels";
import Stage, { type StageGroup } from "@/features/canvas/Stage";
import RightPanel from "@/features/panels/RightPanel";
import type { ScreenId } from "@/data/types";
import { useUi } from "@/store/useUi";
import "./pages.css";

const GROUPS: StageGroup[] = [
  { name: "홈", path: "/", screens: [{ id: "home", name: "기본", ready: true }, { id: "home-recording", name: "녹음 중", ready: true }] },
  { name: "로그인", path: "/login", screens: [{ id: "login", name: "기본", ready: true }] },
];

/** 화면 탭: 지금 develop에 배포된 화면. 새 시안은 이 화면들을 참고해 만든다 */
export default function ScreensPage() {
  const [params, setParams] = useSearchParams();
  const focus = (params.get("screen") as ScreenId | null) ?? null;
  const leftOpen = useUi((s) => s.leftOpen);
  const rightOpen = useUi((s) => s.rightOpen);
  const setLeftOpen = useUi((s) => s.setLeftOpen);
  const setRightOpen = useUi((s) => s.setRightOpen);
  return (
    <div className="page">
      <TopGnb />
      <main className="page-body" style={{ position: "relative" }}>
        {leftOpen ? <PagesPanel title="지금 화면" groups={GROUPS} focus={focus} onFocus={(id) => setParams(id ? { screen: id } : {})} /> : (
          <button className="k-btn edge-btn" style={{ left: 16, width: 36, padding: 0 }} onClick={() => setLeftOpen(true)}><PanelLeftOpen size={16} /></button>
        )}
        <Stage groups={GROUPS} focus={focus} onFocus={(id) => setParams(id ? { screen: id } : {})} variant="develop" />
        {rightOpen ? <RightPanel chatPlaceholder="지금 화면에 대해 물어보기" /> : (
          <button className="k-btn edge-btn" style={{ right: 16, width: 36, padding: 0 }} onClick={() => setRightOpen(true)}><PanelRightOpen size={16} /></button>
        )}
      </main>
    </div>
  );
}
