import { Hand, MessageCircle, MousePointer2, PanelLeftOpen, PanelRightOpen, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ProposalGnb } from "@/components/Gnb";
import ElementLayer from "@/features/canvas/ElementLayer";
import { PagesPanel } from "@/features/canvas/LeftPanels";
import type { StageGroup } from "@/features/canvas/Stage";
import RightPanel from "@/features/panels/RightPanel";
import { PAGES, SCREENS, SCREEN_NAME } from "@/data/logout";
import type { ScreenId } from "@/data/types";
import type { KnotAction } from "@/knot-app/KnotScreen";
import ScaledScreen from "@/knot-app/ScaledScreen";
import { toast } from "@/lib/toast";
import { useKnotted } from "@/store/useKnotted";
import { type Tool, useUi } from "@/store/useUi";
import "@/features/canvas/canvas.css";
import "./pages.css";

const DRAFT_ONLY = new Set<ScreenId>(["profile-menu-open", "logging-out", "logout-failed", "recording-confirm", "finish-logging-out", "recording-elsewhere", "menu-recording"]);

/** 흐름 보기: 시안을 실제 앱처럼 눌러 보고, 지금 배포된 화면으로 바꿔 같은 흐름을 따라간다 */
export default function FlowPage() {
  const [params] = useSearchParams();
  const start = (params.get("start") as ScreenId | null) ?? "home";
  const startsRecording = SCREENS.find((s) => s.id === start)?.page === "recording";
  const [variant, setVariant] = useState<"draft" | "develop">("draft");
  const [recording, setRecording] = useState<"none" | "here" | "elsewhere">(startsRecording ? (start === "recording-elsewhere" ? "elsewhere" : "here") : "none");
  const [fail, setFail] = useState(false);
  const [screen, setScreen] = useState<ScreenId>(start);
  const [trail, setTrail] = useState<ScreenId[]>([start]);
  const [tool, setTool] = useState<Tool>("select");
  const [width, setWidth] = useState(860);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveFlow = useKnotted((s) => s.saveFlow);
  const setRightTab = useUi((s) => s.setRightTab);
  const leftOpen = useUi((s) => s.leftOpen);
  const rightOpen = useUi((s) => s.rightOpen);
  const setLeftOpen = useUi((s) => s.setLeftOpen);
  const setRightOpen = useUi((s) => s.setRightOpen);

  useEffect(() => setRightTab("inspect"), [setRightTab]);

  // 양옆 패널을 접으면 화면을 넓게 본다(3-3)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fit = () => setWidth(Math.max(480, Math.min(1200, el.clientWidth - 80, ((el.clientHeight - 230) * 1440) / 1024)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (next: ScreenId) => {
    setScreen(next);
    setTrail((t) => (t[t.length - 1] === next ? t : [...t, next]));
  };

  const restart = (rec = recording) => {
    const first: ScreenId = rec === "none" ? "home" : "home-recording";
    setScreen(first);
    setTrail([first]);
  };

  // 처리 중 화면은 잠시 뒤 다음 화면으로 넘어간다
  useEffect(() => {
    if (screen !== "logging-out" && screen !== "finish-logging-out") return;
    const t = setTimeout(() => {
      const next: ScreenId = fail && screen === "logging-out" ? "logout-failed" : "login";
      setScreen(next);
      setTrail((tr) => [...tr, next]);
    }, 1300);
    return () => clearTimeout(t);
  }, [screen, fail]);

  const onAction = (a: KnotAction) => {
    if (tool !== "select") return;
    if (variant === "develop") {
      if (a === "avatar") toast("지금 화면에는 프로필 메뉴가 없어요");
      return;
    }
    switch (screen) {
      case "home":
      case "home-recording":
        if (a === "avatar") go(recording === "none" ? "profile-menu-open" : "menu-recording");
        break;
      case "profile-menu-open":
      case "logout-failed":
        if (a === "logout") go("logging-out");
        else if (a === "avatar" || a === "outside") go("home");
        break;
      case "menu-recording":
        if (a === "logout") go(recording === "elsewhere" ? "recording-elsewhere" : "recording-confirm");
        else if (a === "avatar" || a === "outside") go("home-recording");
        break;
      case "recording-confirm":
        if (a === "confirm") go("finish-logging-out");
        if (a === "cancel") go("menu-recording");
        break;
      case "recording-elsewhere":
        if (a === "confirm") go("logging-out");
        if (a === "cancel") go("menu-recording");
        break;
      default:
        break;
    }
  };

  const groups: StageGroup[] = useMemo(() => PAGES.map((p) => ({
    name: p.name,
    path: p.path,
    screens: SCREENS.filter((s) => s.page === p.id).map((s) => ({ id: s.id, name: s.name, ready: true })),
  })), []);

  const record = (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 4, overflow: "auto" }}>
      <b style={{ fontSize: 17 }}>흐름 기록</b>
      <span className="k-faint" style={{ fontSize: 12, marginBottom: 10 }}>지금까지 누른 순서예요.</span>
      {trail.map((id, i) => (
        <div key={`${id}${i}`} className="lp-item" data-active={i === trail.length - 1} style={{ paddingLeft: 10, height: 40 }}>
          {SCREEN_NAME[id]}
          <span className="k-chip" style={{ marginLeft: "auto", height: 20, fontSize: 11 }}>{DRAFT_ONLY.has(id) && variant === "draft" ? "시안" : "지금"}</span>
        </div>
      ))}
      <span className="k-faint" style={{ fontSize: 12, margin: "10px 0" }}>저장한 흐름은 유저 플로우와 검토 화면에서 같은 순서로 볼 수 있어요.</span>
      <button className="k-btn" style={{ alignSelf: "flex-start" }} onClick={() => { saveFlow(trail.map((t) => SCREEN_NAME[t])); toast("흐름을 저장했어요"); }}>이 흐름 저장</button>
    </div>
  );

  return (
    <div className="page">
      <ProposalGnb />
      <main className="page-body" style={{ position: "relative" }}>
        {leftOpen ? (
          <PagesPanel
            groups={groups}
            focus={DRAFT_ONLY.has(screen) ? screen : null}
            onFocus={(id) => {
              if (!id) return restart();
              const rec = SCREENS.find((s) => s.id === id)?.page === "recording" ? (id === "recording-elsewhere" ? "elsewhere" : "here") : "none";
              setRecording(rec);
              go(id);
            }}
          />
        ) : (
          <button className="k-btn edge-btn" style={{ left: 16, width: 36, padding: 0 }} onClick={() => setLeftOpen(true)} title="패널 열기"><PanelLeftOpen size={16} /></button>
        )}
        <div className="stage" data-tool={tool}>
          <div className="stage-scroll" ref={scrollRef} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="k-segment">
                  <button data-active={variant === "draft"} onClick={() => { setVariant("draft"); restart(); }}>시안 <span className="k-faint">proposal/logout</span></button>
                  <button data-active={variant === "develop"} onClick={() => { setVariant("develop"); restart(); }}>지금 <span className="k-faint">develop</span></button>
                </div>
                <span style={{ flex: 1 }} />
                <button className="k-btn k-btn--sm" onClick={() => restart()}><RotateCcw size={13} />처음부터</button>
              </div>
              <ScaledScreen screen={screen} width={width} variant={variant} onAction={onAction} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {trail.map((id, i) => (
                  <span key={`${id}${i}`} style={{ display: "contents" }}>
                    {i > 0 && <span className="k-faint">→</span>}
                    <span className="k-chip" style={{ height: 30, padding: "0 12px", fontSize: 13, ...(i === trail.length - 1 ? { background: "var(--accent)", color: "var(--on-accent)", borderColor: "var(--accent)" } : { color: "var(--text-primary)" }) }}>{SCREEN_NAME[id]}</span>
                  </span>
                ))}
              </div>
              <div className="k-faint" style={{ fontSize: 13 }}>실제 앱처럼 눌러 보세요. 프로필 사진을 누르면 시작돼요. 시안에 없는 화면은 지금 화면으로 이어집니다.</div>
              <div className="flow-opts">
                <span className="k-label">상황 바꾸기</span>
                <label><input type="radio" checked={recording === "none"} onChange={() => { setRecording("none"); restart("none"); }} />녹음 안 하는 중</label>
                <label><input type="radio" checked={recording === "here"} onChange={() => { setRecording("here"); restart("here"); }} />이 탭에서 녹음 중</label>
                <label><input type="radio" checked={recording === "elsewhere"} onChange={() => { setRecording("elsewhere"); restart("elsewhere"); }} />다른 곳에서 녹음 중</label>
                <label><input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />로그아웃이 실패하게</label>
              </div>
            </div>
          </div>
          <ElementLayer containerRef={scrollRef} tool={tool} selectEnabled={false} />
          {tool === "comment" && <div className="tool-hint"><b>댓글</b><span className="kbd">C</span><span className="k-faint">누르거나 끌어서 영역 지정</span></div>}
          <div className="tool-rail">
            <button data-active={tool === "select"} onClick={() => setTool("select")} title="누르기"><MousePointer2 size={16} /></button>
            <button data-active={tool === "hand"} onClick={() => setTool("hand")} title="손"><Hand size={16} /></button>
            <button data-active={tool === "comment"} onClick={() => setTool("comment")} title="댓글"><MessageCircle size={16} /></button>
          </div>
        </div>
        {rightOpen ? <RightPanel inspectContent={record} /> : (
          <button className="k-btn edge-btn" style={{ right: 16, width: 36, padding: 0 }} onClick={() => setRightOpen(true)} title="패널 열기"><PanelRightOpen size={16} /></button>
        )}
      </main>
    </div>
  );
}
