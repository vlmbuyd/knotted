import { Hand, MessageCircle, Minus, MousePointer2, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScreenId } from "@/data/types";
import ScaledScreen from "@/knot-app/ScaledScreen";
import type { Tool } from "@/store/useUi";
import ElementLayer from "./ElementLayer";
import "./canvas.css";

export interface StageGroup {
  name: string;
  path: string;
  screens: { id: ScreenId; name: string; ready: boolean }[];
}

interface Props {
  groups: StageGroup[];
  /** 한 화면만 크게 볼 때 */
  focus: ScreenId | null;
  onFocus: (id: ScreenId | null) => void;
  variant?: "draft" | "develop";
  initial?: { screen: string; el: string } | null;
  /** 바꾸기 전, 바꾼 뒤 같은 위쪽 조절 */
  topBar?: React.ReactNode;
}

function isTyping() {
  const a = document.activeElement as HTMLElement | null;
  return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
}

/** 시안 화면들을 늘어놓는 캔버스. 선택, 손, 댓글 도구를 쓴다 */
export default function Stage({ groups, focus, onFocus, variant = "draft", initial, topBar }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [overviewWidth, setOverviewWidth] = useState(236);
  const [focusWidth, setFocusWidth] = useState(720);
  const width = focus ? focusWidth : overviewWidth;
  const setWidth = focus ? setFocusWidth : setOverviewWidth;
  const pan = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping() || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "v") setTool("select");
      if (k === "h") setTool("hand");
      if (k === "c") setTool("comment");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      setWidth((w) => Math.max(140, Math.min(1200, Math.round(w * (e.deltaY < 0 ? 1.08 : 0.92)))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setWidth]);

  const focused = useMemo(() => {
    if (!focus) return null;
    for (const g of groups) {
      const sc = g.screens.find((x) => x.id === focus);
      if (sc) return { group: g, screen: sc };
    }
    return null;
  }, [focus, groups]);

  return (
    <div className="stage" data-tool={tool}>
      {topBar}
      <div
        className="stage-scroll"
        ref={scrollRef}
        onMouseDown={(e) => {
          if (tool !== "hand" || !scrollRef.current) return;
          pan.current = { x: e.clientX, y: e.clientY, sl: scrollRef.current.scrollLeft, st: scrollRef.current.scrollTop };
          e.preventDefault();
        }}
        onMouseMove={(e) => {
          if (!pan.current || !scrollRef.current) return;
          scrollRef.current.scrollLeft = pan.current.sl - (e.clientX - pan.current.x);
          scrollRef.current.scrollTop = pan.current.st - (e.clientY - pan.current.y);
        }}
        onMouseUp={() => (pan.current = null)}
        onMouseLeave={() => (pan.current = null)}
        style={tool === "hand" ? { pointerEvents: "auto" } : undefined}
      >
        <div style={tool === "hand" ? { pointerEvents: "none" } : undefined}>
          {focused ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="screen-cell__name">
                  <button onClick={() => onFocus(null)}>{focused.group.name}</button> / {focused.screen.name}
                </div>
                <ScaledScreen screen={focused.screen.id} width={width} variant={variant} />
              </div>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.name} className="page-group">
                <div className="page-head">{g.name} <span className="k-faint" style={{ fontWeight: 400, fontSize: 13 }}>{g.path}</span></div>
                <div className="screen-row">
                  {g.screens.map((sc) => (
                    <div key={sc.id} className="screen-cell">
                      <div className="screen-cell__name"><button onClick={() => sc.ready && onFocus(sc.id)}>{sc.name}</button></div>
                      {sc.ready ? (
                        <ScaledScreen screen={sc.id} width={width} variant={variant} />
                      ) : (
                        <div className="screen-placeholder" style={{ width, height: width * (1024 / 1440) }}>정해지면 만들어요</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <ElementLayer containerRef={scrollRef} tool={tool} initial={initial} />
      {tool === "comment" && (
        <div className="tool-hint"><b>댓글</b><span className="kbd">C</span><span className="k-faint">누르거나 끌어서 영역 지정</span></div>
      )}
      <div className="tool-rail">
        <button data-active={tool === "select"} onClick={() => setTool("select")} title="선택 (V)"><MousePointer2 size={16} /></button>
        <button data-active={tool === "hand"} onClick={() => setTool("hand")} title="손 (H)"><Hand size={16} /></button>
        <button data-active={tool === "comment"} onClick={() => setTool("comment")} title="댓글 (C)"><MessageCircle size={16} /></button>
      </div>
      <div className="zoom-ctl">
        <button onClick={() => setWidth((w) => Math.max(140, Math.round(w * 0.85)))} title="작게 (⌘ + 휠)"><Minus size={14} /></button>
        <span style={{ minWidth: 40, textAlign: "center" }} className="k-muted">{Math.round((width / 1440) * 100)}%</span>
        <button onClick={() => setWidth((w) => Math.min(1200, Math.round(w * 1.15)))} title="크게 (⌘ + 휠)"><Plus size={14} /></button>
      </div>
    </div>
  );
}
