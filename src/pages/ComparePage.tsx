import { Check, ChevronsLeftRight, PanelTop, Square, SquareDashed } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProposalGnb } from "@/components/Gnb";
import { PROPOSAL, SCREENS } from "@/data/logout";
import type { ScreenId } from "@/data/types";
import ScaledScreen, { SCREEN_W } from "@/knot-app/ScaledScreen";
import { toast } from "@/lib/toast";
import { useKnotted } from "@/store/useKnotted";
import "./pages.css";

interface Change { kind: "new" | "changed"; element: string; desc: string }

const CHANGES: Record<string, Change[]> = {
  "profile-menu-open": [
    { kind: "new", element: "ProfileMenu", desc: "프로필 사진을 누르면 열리는 메뉴" },
    { kind: "changed", element: "MemberProfileAvatar", desc: "누를 수 있게 됨" },
  ],
  "logging-out": [{ kind: "new", element: "ProfileMenu", desc: "처리 중이면 스피너가 돌고 다시 누를 수 없음" }],
  "logout-failed": [
    { kind: "new", element: "Toast", desc: "로그아웃 실패 토스트" },
    { kind: "new", element: "ProfileMenu", desc: "실패해도 메뉴는 열린 채로 둠" },
  ],
  "recording-confirm": [{ kind: "new", element: "ConfirmDialog", desc: "녹음을 끝내고 로그아웃할지 묻는 창" }],
  "finish-logging-out": [{ kind: "new", element: "ProfileMenu", desc: "녹음을 끝내는 동안 처리 중" }],
  "recording-elsewhere": [{ kind: "new", element: "ConfirmDialog", desc: "다른 곳에서 녹음 중이라는 안내" }],
};

type Mode = "overlay" | "side" | "draft";

/** 2-4: 제안서의 화면 하나를 지금 화면과 겹쳐 놓고 경계선을 끌어 비교한다 */
export default function ComparePage() {
  const { screen: param } = useParams();
  const navigate = useNavigate();
  const role = useKnotted((s) => s.role);
  const status = useKnotted((s) => s.status);
  const setStatus = useKnotted((s) => s.setStatus);
  const [viewed, setViewed] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<Mode>("overlay");
  const idx = Math.max(0, SCREENS.findIndex((s) => s.id === param));
  const sc = SCREENS[idx];
  const devScreen: ScreenId = sc.page === "recording" ? "home-recording" : "home";
  const changes = CHANGES[sc.id] ?? [];

  const goto = useCallback((i: number) => navigate(`/p/${PROPOSAL.id}/compare/${SCREENS[(i + SCREENS.length) % SCREENS.length].id}`), [navigate]);
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight") goto(idx + 1);
      if (e.key === "ArrowLeft") goto(idx - 1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [idx, goto]);

  const decide = (next: "확정" | "보류" | "반려") => {
    setStatus(next);
    toast(next === "확정" ? "확정했어요. 노션 제안에 상태, 컨펌한 사람, 날짜를 적었어요" : `${next}로 바꿨어요`);
    navigate(`/p/${PROPOSAL.id}`);
  };

  return (
    <div className="page">
      <ProposalGnb title={`${PROPOSAL.title}, 화면 비교`} />
      <main className="page-body">
        <section className="k-panel lpanel">
          <div className="k-panel__head" style={{ height: 44, borderBottom: 0 }}><span className="k-label">화면 {SCREENS.length}개</span></div>
          <div className="k-panel__body" style={{ padding: 8 }}>
            {SCREENS.map((s, i) => (
              <button key={s.id} className="lp-item" style={{ paddingLeft: 10 }} data-active={i === idx} onClick={() => goto(i)}>
                {viewed.has(s.id) ? <Check size={14} color="var(--success)" /> : <Square size={13} />}
                {s.name}
              </button>
            ))}
            <div className="k-label" style={{ padding: "16px 10px 6px" }}>흐름 1개</div>
            <button className="lp-item" style={{ paddingLeft: 10 }} onClick={() => navigate(`/p/${PROPOSAL.id}/flow`)}><PanelTop size={13} />홈에서 로그아웃까지</button>
          </div>
        </section>

        <div className="stage" style={{ padding: "8px 8px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{sc.page === "home" ? "홈" : "녹음 중"} / {sc.name}</div>
              <div className="k-faint" style={{ fontSize: 13 }}>화면 {SCREENS.length}개 가운데 {idx + 1}번째. 방향키로 넘겨요.</div>
            </div>
            <div className="k-segment">
              <button data-active={mode === "overlay"} onClick={() => setMode("overlay")}>겹쳐 보기</button>
              <button data-active={mode === "side"} onClick={() => setMode("side")}>나란히</button>
              <button data-active={mode === "draft"} onClick={() => setMode("draft")}>시안만</button>
            </div>
          </div>
          {mode === "overlay" && <Overlay draft={sc.id} dev={devScreen} changes={changes} />}
          {mode === "side" && (
            <div style={{ display: "flex", gap: 12 }}>
              {[["지금 develop", devScreen, "develop"], ["시안 proposal/logout", sc.id, "draft"]].map(([label, id, v]) => (
                <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="k-faint" style={{ fontSize: 12 }}>{label}</span>
                  <FitScreen screen={id as ScreenId} variant={v as "draft" | "develop"} />
                </div>
              ))}
            </div>
          )}
          {mode === "draft" && <FitScreen screen={sc.id} variant="draft" />}
          <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 12, fontSize: 13 }}>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><SquareDashed size={14} color="var(--selection)" />새로 생김 {changes.filter((c) => c.kind === "new").length}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}><SquareDashed size={14} color="var(--text-secondary)" />바뀜 {changes.filter((c) => c.kind === "changed").length}</span>
            <span style={{ display: "flex", gap: 6, alignItems: "center" }} className="k-muted"><SquareDashed size={14} />없어짐 0</span>
            <span className="k-faint">경계선을 끌어서 지금 화면과 시안을 겹쳐 봐요.</span>
          </div>
        </div>

        <section className="k-panel" style={{ width: 340, flexShrink: 0 }}>
          <div className="k-panel__body" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700 }}>로그아웃 기능</div>
              <div className="k-faint" style={{ fontSize: 12 }}>{PROPOSAL.proposer}가 {PROPOSAL.createdLabel}에 검토를 요청했어요</div>
            </div>
            <div style={{ color: "#cfcfd2" }}>프로필 메뉴에 로그아웃을 넣었어요. 녹음 중이면 먼저 물어봐요.</div>
            <div className="k-label">이 화면에서 바뀐 것</div>
            {changes.map((c) => (
              <div key={c.element + c.desc} className="change-card" data-kind={c.kind}>
                <div><b>{c.kind === "new" ? "새로 생김" : "바뀜"}</b> {c.element}</div>
                <div className="k-muted" style={{ fontSize: 13 }}>{c.desc}</div>
              </div>
            ))}
            <div className="k-faint" style={{ fontSize: 12 }}>두 빌드의 컴포넌트 구조를 비교해서 찾았어요.</div>
            <button className="k-btn" style={{ alignSelf: "flex-start" }} onClick={() => { setViewed((v) => new Set(v).add(sc.id)); if (idx < SCREENS.length - 1) goto(idx + 1); }}>
              <Check size={14} color={viewed.has(sc.id) ? "var(--success)" : undefined} />이 화면 확인
            </button>
            <div className="stat-box">
              <div className="kv"><span>본 화면</span><b>{viewed.size} / {SCREENS.length}</b></div>
              <div className="kv"><span>수정 요청</span><b>모두 고침</b></div>
              <div className="kv"><span>새 컴포넌트</span><b>ProfileMenu</b></div>
              <div className="kv"><span>노션 제안</span><b>로그아웃 기능 (Knot)</b></div>
            </div>
            <textarea className="k-input" rows={3} placeholder="의견 (선택)" />
            <span style={{ flex: 1 }} />
            <div className="k-faint" style={{ fontSize: 12 }}>확정하면 제안한 팀원이 이어서 노션과 이슈에 반영하고, {PROPOSAL.branch} 브랜치에서 구현을 시작해요.</div>
            {role === "confirmer" && status === "검토 요청" ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="k-btn" onClick={() => decide("반려")}>반려</button>
                <button className="k-btn" onClick={() => decide("보류")}>보류</button>
                <button className="k-btn k-btn--primary" style={{ flex: 1 }} onClick={() => decide("확정")}>확정</button>
              </div>
            ) : (
              <div className="k-muted" style={{ fontSize: 13 }}>지금 상태: {status}</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function useFitWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(760);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setW(Math.min(el.clientWidth, ((window.innerHeight - 230) * SCREEN_W) / 1024));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function FitScreen({ screen, variant }: { screen: ScreenId; variant: "draft" | "develop" }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useFitWidth(ref);
  return <div ref={ref} style={{ width: "100%" }}><ScaledScreen screen={screen} width={w} variant={variant} inert /></div>;
}

function Overlay({ draft, dev, changes }: { draft: ScreenId; dev: ScreenId; changes: Change[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useFitWidth(ref);
  const h = (w * 1024) / SCREEN_W;
  const [split, setSplit] = useState(0.45);
  const [boxes, setBoxes] = useState<{ c: Change; r: { x: number; y: number; w: number; h: number } }[]>([]);
  const dragging = useRef(false);

  useLayoutEffect(() => {
    const root = ref.current?.querySelector<HTMLElement>(".overlay-draft");
    if (!root) return;
    const base = root.getBoundingClientRect();
    setBoxes(changes.flatMap((c) => {
      const el = root.querySelector<HTMLElement>(`[data-knotted="${c.element}"]`);
      if (!el) return [];
      const r = el.getBoundingClientRect();
      return [{ c, r: { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height } }];
    }));
  }, [changes, w, draft]);

  return (
    <div ref={ref} style={{ width: "100%" }}>
      <div
        style={{ position: "relative", width: w, height: h, borderRadius: 6, overflow: "hidden", userSelect: "none" }}
        onMouseMove={(e) => {
          if (!dragging.current) return;
          const r = e.currentTarget.getBoundingClientRect();
          setSplit(Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / r.width)));
        }}
        onMouseUp={() => (dragging.current = false)}
        onMouseLeave={() => (dragging.current = false)}
      >
        <div className="overlay-draft" style={{ position: "absolute", inset: 0 }}><ScaledScreen screen={draft} width={w} inert /></div>
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - split) * 100}% 0 0)` }}><ScaledScreen screen={dev} width={w} variant="develop" inert /></div>
        {boxes.map(({ c, r }) => (
          <div key={c.element + c.desc} style={{ position: "absolute", left: r.x - 3, top: r.y - 3, width: r.w + 6, height: r.h + 6, border: `1.5px dashed ${c.kind === "new" ? "var(--selection)" : "#8c8c90"}`, borderRadius: 6, background: c.kind === "new" ? "rgba(255,107,44,.08)" : undefined, pointerEvents: "none" }}>
            {c.kind === "new" && <span style={{ position: "absolute", right: -2, bottom: -24, background: "var(--selection)", color: "var(--on-accent)", fontSize: 11, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap" }}>새로 생김 {c.element}</span>}
          </div>
        ))}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${split * 100}%`, width: 2, marginLeft: -1, background: "#fff", boxShadow: "0 0 0 1px rgba(0,0,0,.15)" }} />
        <button
          onMouseDown={() => (dragging.current = true)}
          style={{ position: "absolute", top: "50%", left: `${split * 100}%`, transform: "translate(-50%,-50%)", width: 36, height: 36, borderRadius: "50%", background: "#fff", color: "#111", display: "grid", placeItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,.25)", cursor: "ew-resize" }}
          aria-label="경계선 끌기"
        >
          <ChevronsLeftRight size={16} />
        </button>
        <span className="cmp-label" style={{ left: 10 }}>지금 develop</span>
        <span className="cmp-label" style={{ right: 10 }}>시안 proposal/logout</span>
      </div>
    </div>
  );
}
