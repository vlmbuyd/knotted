import { PanelLeftOpen, PanelRightOpen } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ProposalGnb } from "@/components/Gnb";
import { DraftPanel, PagesPanel } from "@/features/canvas/LeftPanels";
import Stage, { type StageGroup } from "@/features/canvas/Stage";
import RightPanel from "@/features/panels/RightPanel";
import { PAGES, SCREENS } from "@/data/logout";
import type { ScreenId } from "@/data/types";
import { decidedRequirements, useKnotted } from "@/store/useKnotted";
import { useUi } from "@/store/useUi";
import "./pages.css";

export default function CanvasPage() {
  const [params, setParams] = useSearchParams();
  const planStep = useKnotted((s) => s.planStep);
  const leftOpen = useUi((s) => s.leftOpen);
  const rightOpen = useUi((s) => s.rightOpen);
  const setLeftOpen = useUi((s) => s.setLeftOpen);
  const setRightOpen = useUi((s) => s.setRightOpen);
  const focus = (params.get("screen") as ScreenId | null) ?? null;
  const el = params.get("el");
  const initial = useMemo(() => (focus && el ? { screen: focus, el } : null), [focus, el]);

  const planning = planStep < 3;
  const ready = new Set(decidedRequirements(planStep).flatMap((r) => r.screens));
  const groups: StageGroup[] = PAGES.map((p) => ({
    name: p.name,
    path: p.path,
    screens: SCREENS.filter((s) => s.page === p.id).map((s) => ({ id: s.id, name: s.name, ready: ready.has(s.id) })),
  }));

  const onFocus = (id: ScreenId | null) => setParams(id ? { screen: id } : {});

  return (
    <div className="page">
      <ProposalGnb />
      <main className="page-body" style={{ position: "relative" }}>
        {leftOpen ? (
          planning ? <DraftPanel onFocus={(id) => onFocus(id)} /> : <PagesPanel groups={groups} focus={focus} onFocus={onFocus} />
        ) : (
          <button className="k-btn edge-btn" style={{ left: 16, width: 36, padding: 0 }} onClick={() => setLeftOpen(true)} title="패널 열기"><PanelLeftOpen size={16} /></button>
        )}
        {planStep === 0 ? (
          <div className="stage" style={{ display: "grid", placeItems: "center" }}>
            <div className="k-faint" style={{ textAlign: "center", lineHeight: 1.8 }}>오른쪽 대화에 만들고 싶은 기능을 말해 주세요.<br />정해지는 대로 시안이 여기에 나타나요.</div>
          </div>
        ) : (
          <Stage groups={groups} focus={focus} onFocus={onFocus} initial={initial} />
        )}
        {rightOpen ? (
          <RightPanel />
        ) : (
          <button className="k-btn edge-btn" style={{ right: 16, width: 36, padding: 0 }} onClick={() => setRightOpen(true)} title="패널 열기"><PanelRightOpen size={16} /></button>
        )}
      </main>
    </div>
  );
}
