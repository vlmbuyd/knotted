import { Check, Code2, Copy, ExternalLink, Link2, MessageCircle, Pencil, Sparkles } from "lucide-react";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { SCREEN_NAME } from "@/data/logout";
import { editorHref, REGISTRY, snippetOf } from "@/data/registry";
import type { ScreenId, Thread } from "@/data/types";
import { SCREEN_W } from "@/knot-app/ScaledScreen";
import { runRequest } from "@/lib/agent";
import { elementLink } from "@/lib/links";
import { toast } from "@/lib/toast";
import { currentUser, useKnotted } from "@/store/useKnotted";
import { type Tool, useUi } from "@/store/useUi";
import Composer from "./Composer";
import "./canvas.css";

interface Target {
  el: HTMLElement;
  name: string;
  screen: ScreenId;
  screenEl: HTMLElement;
  textKey?: string;
}

interface Area {
  screen: ScreenId;
  screenEl: HTMLElement;
  /** 화면 좌표(1440 기준) */
  anchor: { x: number; y: number; w?: number; h?: number };
  elements: string[];
  /** 화면에 그릴 위치 */
  rect: DOMRect;
}

type Popover = "comment" | "ai" | "code" | "copied" | null;

interface Props {
  containerRef: RefObject<HTMLDivElement | null>;
  tool: Tool;
  /** 흐름 보기처럼 앱을 눌러야 하는 곳에서는 선택 도구가 요소를 고르지 않는다 */
  selectEnabled?: boolean;
  /** 요소 링크로 들어왔을 때 처음부터 고를 요소 */
  initial?: { screen: string; el: string } | null;
}

function findTarget(node: EventTarget | null): Target | null {
  if (!(node instanceof Element)) return null;
  const el = node.closest<HTMLElement>("[data-knotted]");
  const screenEl = node.closest<HTMLElement>("[data-screen]");
  if (!el || !screenEl || !screenEl.contains(el)) return null;
  const textEl = node.closest<HTMLElement>("[data-knotted-text]");
  return {
    el,
    name: el.dataset.knotted!,
    screen: screenEl.dataset.screen as ScreenId,
    screenEl,
    textKey: textEl && el.contains(textEl) ? textEl.dataset.knottedText : undefined,
  };
}

function scaleOf(screenEl: HTMLElement) {
  return screenEl.getBoundingClientRect().width / SCREEN_W;
}

function toAnchor(rect: DOMRect, screenEl: HTMLElement) {
  const sr = screenEl.getBoundingClientRect();
  const k = scaleOf(screenEl);
  return { x: Math.round((rect.left - sr.left) / k), y: Math.round((rect.top - sr.top) / k), w: Math.round(rect.width / k), h: Math.round(rect.height / k) };
}

export default function ElementLayer({ containerRef, tool, selectEnabled = true, initial }: Props) {
  const [hover, setHover] = useState<Target | null>(null);
  const [selected, setSelected] = useState<Target | null>(null);
  const [popover, setPopover] = useState<Popover>(null);
  const [area, setArea] = useState<Area | null>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number; screenEl: HTMLElement } | null>(null);
  const [editing, setEditing] = useState<{ key: string; before: string; rect: DOMRect; font: string; color: string } | null>(null);
  const [, setTick] = useState(0);
  const threads = useKnotted((s) => s.threads);
  const role = useKnotted((s) => s.role);
  const addThread = useKnotted((s) => s.addThread);
  const setRightTab = useUi((s) => s.setRightTab);
  const setActiveThread = useUi((s) => s.setActiveThread);
  const setSelectedElement = useUi((s) => s.setSelectedElement);
  const dragStart = useRef<{ x: number; y: number; screenEl: HTMLElement } | null>(null);
  const editDone = useRef(false);

  const clear = useCallback(() => {
    setSelected(null);
    setPopover(null);
    setArea(null);
  }, []);

  // 스크롤하거나 창 크기가 바뀌면 겹쳐 그린 상자 위치를 다시 잰다
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const re = () => setTick((t) => t + 1);
    c.addEventListener("scroll", re, { passive: true });
    window.addEventListener("resize", re);
    const id = window.setInterval(re, 500);
    return () => {
      c.removeEventListener("scroll", re);
      window.removeEventListener("resize", re);
      window.clearInterval(id);
    };
  }, [containerRef]);

  useEffect(() => {
    clear();
    setHover(null);
  }, [tool, clear]);

  useEffect(() => {
    if (!initial) return;
    const t = window.setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(`[data-screen="${initial.screen}"] [data-knotted="${initial.el}"]`);
      if (!el) return;
      const target = findTarget(el);
      if (target) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setSelected(target);
        setSelectedElement({ screen: target.screen, name: target.name });
      }
    }, 150);
    return () => window.clearTimeout(t);
  }, [initial, containerRef, setSelectedElement]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editing) clear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clear, editing]);

  // 캔버스에서는 시안 화면의 버튼이 눌리지 않게 하고, 요소를 고르는 데만 쓴다
  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const active = tool === "comment" || (tool === "select" && selectEnabled);
    const onMove = (e: MouseEvent) => {
      if (tool === "comment" && dragStart.current) {
        const d = dragStart.current;
        if (Math.abs(e.clientX - d.x) > 4 || Math.abs(e.clientY - d.y) > 4) {
          setDrag({ x0: d.x, y0: d.y, x1: e.clientX, y1: e.clientY, screenEl: d.screenEl });
        }
        return;
      }
      if (!active || editing) return;
      const t = findTarget(e.target);
      setHover((h) => (h?.el === t?.el ? h : t));
    };
    const onLeave = () => setHover(null);
    const onDown = (e: MouseEvent) => {
      if (!active || editing) return;
      const screenEl = (e.target as Element).closest?.<HTMLElement>("[data-screen]");
      if (!screenEl) {
        if (!(e.target as Element).closest?.(".k-pop")) clear();
        return;
      }
      e.preventDefault();
      if (tool === "comment") dragStart.current = { x: e.clientX, y: e.clientY, screenEl };
    };
    const onUp = (e: MouseEvent) => {
      if (tool !== "comment" || !dragStart.current) return;
      const d = dragStart.current;
      dragStart.current = null;
      const moved = Math.abs(e.clientX - d.x) > 4 || Math.abs(e.clientY - d.y) > 4;
      setDrag(null);
      const screen = d.screenEl.dataset.screen as ScreenId;
      if (moved) {
        const rect = new DOMRect(Math.min(d.x, e.clientX), Math.min(d.y, e.clientY), Math.abs(e.clientX - d.x), Math.abs(e.clientY - d.y));
        const inside = Array.from(d.screenEl.querySelectorAll<HTMLElement>("[data-knotted]")).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.left < rect.right && r.right > rect.left && r.top < rect.bottom && r.bottom > rect.top && r.width * r.height < rect.width * rect.height * 6;
        });
        const names = Array.from(new Set(inside.map((el) => el.dataset.knotted!))).slice(0, 3);
        setArea({ screen, screenEl: d.screenEl, anchor: toAnchor(rect, d.screenEl), elements: names, rect });
      } else {
        const t = findTarget(e.target);
        const rect = t ? t.el.getBoundingClientRect() : new DOMRect(e.clientX, e.clientY, 0, 0);
        setArea({ screen, screenEl: d.screenEl, anchor: toAnchor(rect, d.screenEl), elements: t ? [t.name] : [], rect });
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!active || editing) return;
      const inScreen = (e.target as Element).closest?.("[data-screen]");
      if (!inScreen) return;
      e.preventDefault();
      e.stopPropagation();
      if (tool === "select") {
        const t = findTarget(e.target);
        setSelected(t);
        setPopover(null);
        if (t) setSelectedElement({ screen: t.screen, name: t.name });
      }
    };
    c.addEventListener("mousemove", onMove);
    c.addEventListener("mouseleave", onLeave);
    c.addEventListener("mousedown", onDown, true);
    window.addEventListener("mouseup", onUp);
    c.addEventListener("click", onClick, true);
    return () => {
      c.removeEventListener("mousemove", onMove);
      c.removeEventListener("mouseleave", onLeave);
      c.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("mouseup", onUp);
      c.removeEventListener("click", onClick, true);
    };
  }, [containerRef, tool, selectEnabled, editing, clear, setSelectedElement]);

  const author = currentUser(role);

  const createThread = (kind: "comment" | "request", text: string, screen: ScreenId, anchor: Thread["anchor"], elements: string[], mentions: string[] = []) => {
    const id = `t${Date.now()}`;
    addThread({ id, kind, screen, anchor, elements, text, author, createdAt: Date.now(), status: kind === "request" ? "에이전트 기다리는 중" : undefined, replies: 0 });
    if (kind === "request") {
      runRequest(id);
      toast("수정 요청을 보냈어요. 제안한 팀원의 Claude Code가 고쳐요");
    } else {
      toast(mentions.length ? `${mentions.join(", ")}에게 알렸어요` : "댓글을 남겼어요");
    }
    clear();
  };

  const startEdit = () => {
    if (!selected) return;
    const key = selected.textKey ?? selected.el.querySelector<HTMLElement>("[data-knotted-text]")?.dataset.knottedText;
    const node = key ? selected.el.querySelector<HTMLElement>(`[data-knotted-text="${key}"]`) : null;
    if (!key || !node) {
      toast("이 요소에는 고칠 글자가 없어요");
      return;
    }
    const k = scaleOf(selected.screenEl);
    const cs = getComputedStyle(node);
    setPopover(null);
    editDone.current = false;
    setEditing({
      key,
      before: node.textContent ?? "",
      rect: node.getBoundingClientRect(),
      font: `${cs.fontWeight} ${parseFloat(cs.fontSize) * k}px ${cs.fontFamily}`,
      color: cs.color,
    });
  };

  const finishEdit = (save: boolean, value: string) => {
    if (!editing || !selected || editDone.current) return;
    editDone.current = true;
    const after = value.trim();
    setEditing(null);
    if (!save || !after || after === editing.before) return;
    useKnotted.getState().setTextOverride(editing.key, after);
    addThread({
      id: `t${Date.now()}`, kind: "request", screen: selected.screen, anchor: toAnchor(editing.rect, selected.screenEl), elements: [selected.name],
      text: `문구 바꾸기: ${editing.before} → ${after}`, author, createdAt: Date.now(), status: "고침", replies: 0,
      change: { file: REGISTRY[selected.name]?.file.split("/").pop() ?? "", before: `"${editing.before}"`, after: `"${after}"`, summary: "시안의 문구를 바로 바꿨어요. 확인하면 제안한 팀원의 에이전트가 코드에도 같은 문구로 반영해요.", textKey: editing.key },
    });
    toast("문구를 바꿨어요. 수정 요청으로 남았어요");
  };

  const copyLink = async () => {
    if (!selected) return;
    const link = elementLink(selected.screen, selected.name);
    try { await navigator.clipboard.writeText(link); } catch { /* 클립보드 권한이 없으면 링크만 보여 준다 */ }
    setPopover("copied");
  };

  // 그리기
  const sel = selected && document.contains(selected.el) ? selected.el.getBoundingClientRect() : null;
  const hov = hover && hover.el !== selected?.el && document.contains(hover.el) ? hover.el.getBoundingClientRect() : null;
  const meta = selected ? REGISTRY[selected.name] : null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampX = (x: number, w: number) => Math.max(8, Math.min(x, vw - w - 8));
  const below = sel ? (sel.bottom + 260 < vh ? sel.bottom + 10 : Math.max(60, sel.top - 52)) : 0;

  return (
    <div className="el-layer">
      {hov && hover && (
        <>
          <div className="el-box el-box--hover" style={{ left: hov.left - 2, top: hov.top - 2, width: hov.width + 4, height: hov.height + 4 }} />
          <div className="el-tag" style={{ left: hov.left - 2, top: Math.max(4, hov.top - 24) }}>{REGISTRY[hover.name]?.ds ?? hover.name}</div>
        </>
      )}
      {sel && selected && (
        <>
          <div className="el-box el-box--sel" style={{ left: sel.left - 3, top: sel.top - 3, width: sel.width + 6, height: sel.height + 6 }}>
            {["tl", "tr", "bl", "br"].map((h) => <i key={h} className={`el-handle el-handle--${h}`} />)}
          </div>
          {!editing && (
            <div className="k-pop el-toolbar" style={{ left: clampX(sel.right - 560, 560), top: below }} onMouseDown={(e) => e.stopPropagation()}>
              <span className="el-chip">{meta?.ds ?? selected.name}</span>
              <button data-active={popover === "comment"} onClick={() => setPopover(popover === "comment" ? null : "comment")}><MessageCircle size={14} />댓글</button>
              <button data-active={popover === "ai"} onClick={() => setPopover(popover === "ai" ? null : "ai")}><Sparkles size={14} />AI에게 요청</button>
              <button data-active={popover === "code"} onClick={() => setPopover(popover === "code" ? null : "code")}><Code2 size={14} />코드</button>
              <button data-active={popover === "copied"} onClick={copyLink}><Link2 size={14} />링크 복사</button>
              <button onClick={startEdit}><Pencil size={14} />글자 고치기</button>
            </div>
          )}
          {editing && (
            <>
              <input
                className="el-edit"
                autoFocus
                defaultValue={editing.before}
                onFocus={(e) => e.currentTarget.select()}
                style={{ left: editing.rect.left - 4, top: editing.rect.top - 3, width: Math.max(editing.rect.width + 60, 120), height: editing.rect.height + 6, font: editing.font, color: editing.color }}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") finishEdit(true, e.currentTarget.value);
                  if (e.key === "Escape") finishEdit(false, "");
                  e.stopPropagation();
                }}
                onBlur={(e) => finishEdit(true, e.currentTarget.value)}
              />
              <div className="k-pop el-hint" style={{ left: clampX(sel.left, 330), top: sel.bottom + 10 }}>
                <span>글자를 고치는 중</span><span className="k-faint">Enter 저장, Esc 취소</span>
              </div>
            </>
          )}
          {popover && !editing && (
            <div style={{ position: "fixed", left: clampX(sel.right - 400, 400), top: below + 52, zIndex: 31 }}>
              {popover === "comment" && <Composer kind="comment" elements={[selected.name]} onSubmit={(k, t, m) => createThread(k, t, selected.screen, toAnchor(sel, selected.screenEl), [selected.name], m)} />}
              {popover === "ai" && <Composer kind="request" elements={[selected.name]} onSubmit={(k, t) => createThread(k, t, selected.screen, toAnchor(sel, selected.screenEl), [selected.name])} />}
              {popover === "code" && meta && (
                <div className="k-pop code-pop" onMouseDown={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b style={{ fontSize: 15 }}>{meta.component}</b>
                    {meta.inDesignSystem && <span style={{ color: "var(--success)", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} />디자인 시스템과 같음</span>}
                    {meta.isNew && <span className="k-chip" style={{ height: 20, color: "var(--selection)", borderColor: "var(--selection)" }}>이 제안에서 새로 생김</span>}
                  </div>
                  <div className="mono k-faint">{meta.file}:{meta.line}</div>
                  <pre className="code-block">{snippetOf(selected.name)}</pre>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="k-btn k-btn--sm" onClick={() => { void navigator.clipboard?.writeText(snippetOf(selected.name)); toast("코드를 복사했어요"); }}><Copy size={13} />복사</button>
                    <button className="k-btn k-btn--sm" onClick={() => { const href = editorHref(selected.name); if (href) window.location.href = href; else toast(".env.local에 VITE_KNOT_REPO를 적으면 VS Code로 열려요"); }}><ExternalLink size={13} />에디터에서 열기</button>
                    <button className="k-btn k-btn--sm" onClick={() => { setRightTab("inspect"); setPopover(null); }}>자세히 보기</button>
                  </div>
                </div>
              )}
              {popover === "copied" && (
                <div className="k-pop copied-pop">
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}><Check size={14} color="var(--success)" />링크를 복사했어요</div>
                  <div className="k-muted" style={{ fontSize: 12 }}>오른쪽 AI 채팅에 붙여 넣으면 에이전트가 {SCREEN_NAME[selected.screen]}의 {meta?.ds}를 가리키는 줄 알아요.</div>
                  <button className="k-btn k-btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => { setRightTab("ai"); setPopover(null); }}>AI 채팅 열기</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {drag && (
        <div className="el-box el-box--area" style={{ left: Math.min(drag.x0, drag.x1), top: Math.min(drag.y0, drag.y1), width: Math.abs(drag.x1 - drag.x0), height: Math.abs(drag.y1 - drag.y0) }} />
      )}
      {area && (
        <>
          <div className="el-box el-box--area" style={{ left: area.rect.left - 2, top: area.rect.top - 2, width: area.rect.width + 4, height: area.rect.height + 4 }} />
          <div style={{ position: "fixed", left: clampX(area.rect.right - 340, 340), top: Math.min(area.rect.bottom + 12, vh - 260), zIndex: 31 }}>
            <Composer kind="comment" allowToggle elements={area.elements} width={340} onSubmit={(k, t, m) => createThread(k, t, area.screen, area.anchor, area.elements, m)} />
          </div>
        </>
      )}

      <Pins containerRef={containerRef} threads={threads} onOpen={(id) => { setActiveThread(id); setRightTab("comments"); }} />
    </div>
  );
}

function Pins({ containerRef, threads, onOpen }: { containerRef: RefObject<HTMLDivElement | null>; threads: Thread[]; onOpen: (id: string) => void }) {
  const c = containerRef.current;
  if (!c) return null;
  const cr = c.getBoundingClientRect();
  const used = new Map<string, number>();
  return (
    <>
      {threads.map((t, i) => {
        if (t.status === "확인함" || t.status === "되돌림") return null;
        const screenEl = c.querySelector<HTMLElement>(`[data-screen="${t.screen}"]`);
        if (!screenEl || (t.anchor.x === 0 && t.anchor.y === 0)) return null;
        const sr = screenEl.getBoundingClientRect();
        const k = sr.width / SCREEN_W;
        const slot = `${t.screen}:${Math.round((t.anchor.x + (t.anchor.w ?? 0)) / 40)}:${Math.round(t.anchor.y / 40)}`;
        const n = used.get(slot) ?? 0;
        used.set(slot, n + 1);
        const x = sr.left + (t.anchor.x + (t.anchor.w ?? 0)) * k + 10 + n * 30;
        const y = sr.top + t.anchor.y * k - 6;
        if (x < cr.left || x > cr.right || y < cr.top || y > cr.bottom) return null;
        return (
          <button key={t.id} className={`pin pin--${t.kind}`} style={{ left: x - 13, top: y - 13 }} onClick={() => onOpen(t.id)} title={t.text}>
            {t.kind === "request" ? <Sparkles size={13} /> : threads.length - i}
          </button>
        );
      })}
    </>
  );
}
