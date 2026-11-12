import { Check, CircleAlert, ExternalLink, LayoutGrid, LoaderCircle, LogOut, Search, TriangleAlert } from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { TopGnb } from "@/components/Gnb";
import { toast } from "@/lib/toast";
import { useKnotted } from "@/store/useKnotted";
import "./pages.css";

type ToastVariant = "success" | "caution" | "error";
const TOAST_BG: Record<ToastVariant, string> = { success: "#2f6f82", caution: "#8a6a2c", error: "#a8483c" };
const TOAST_ICON: Record<ToastVariant, ReactNode> = { success: <Check size={18} />, caution: <TriangleAlert size={18} />, error: <CircleAlert size={18} /> };

function KToast({ variant, message, action }: { variant: ToastVariant; message: string; action?: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, height: 52, padding: "0 22px 0 18px", borderRadius: 16, background: TOAST_BG[variant], color: "#fff", fontWeight: 600, fontSize: 16, whiteSpace: "nowrap" }}>
      {TOAST_ICON[variant]}{message}{action && <u style={{ marginLeft: 6, fontWeight: 500 }}>{action}</u>}
    </div>
  );
}

const light: CSSProperties = { background: "#faf9f7", padding: 20, borderRadius: 10, color: "#1f1e1c" };

interface Comp {
  name: string;
  group: string;
  file: string;
  proposed?: boolean;
  variants: number;
  usedIn: string[];
}

const COMPONENTS: Comp[] = [
  { name: "ProfileMenu", group: "제안 중", file: "modules/features/member/MemberProfileAvatar/ui/ProfileMenu", proposed: true, variants: 2, usedIn: ["프로필 메뉴 열림", "로그아웃 처리 중", "로그아웃 실패"] },
  { name: "Button", group: "primitives/ui", file: "shared/components/primitives/ui/Button", variants: 9, usedIn: ["홈", "문서", "탐색"] },
  { name: "Chip", group: "primitives/ui", file: "shared/components/primitives/ui/Chip", variants: 4, usedIn: ["홈", "문서"] },
  { name: "ConfirmDialog", group: "primitives/ui", file: "shared/components/composites/ConfirmDialog", variants: 3, usedIn: ["녹음 중 확인", "다른 곳 녹음 알림", "워크스페이스 전환"] },
  { name: "Spinner", group: "primitives/ui", file: "shared/components/primitives/ui/Spinner", variants: 2, usedIn: ["로그아웃 처리 중", "불러오는 중"] },
  { name: "TextField", group: "primitives/ui", file: "shared/components/primitives/ui/TextField", variants: 5, usedIn: ["팀원 초대", "워크스페이스 만들기"] },
  { name: "Toast", group: "primitives/ui", file: "shared/components/primitives/ui/Toast", proposed: true, variants: 21, usedIn: ["로그아웃 실패", "녹음 종료 실패", "문서 저장", "워크스페이스 전환"] },
  { name: "Popover", group: "composites", file: "shared/components/composites/Popover", variants: 3, usedIn: ["프로필 메뉴 열림"] },
  { name: "Tabs", group: "composites", file: "shared/components/composites/Tabs", variants: 2, usedIn: ["홈", "탐색"] },
  { name: "ToastList", group: "composites", file: "shared/components/composites/ToastList", variants: 1, usedIn: ["앱 전체"] },
  { name: "MemberProfileAvatar", group: "features", file: "modules/features/member/MemberProfileAvatar", variants: 3, usedIn: ["상단바"] },
  { name: "RecordingHistory", group: "features", file: "modules/features/recording/RecordingHistory", variants: 6, usedIn: ["홈"] },
];

/** 5-1: 코드의 컴포넌트를 폴더 구조대로 보여 주고, props를 바꿔 본다 */
export default function DesignSystemPage() {
  const [current, setCurrent] = useState("Toast");
  const [q, setQ] = useState("");
  const status = useKnotted((s) => s.status);
  const confirmed = status === "반영 완료";
  const comp = COMPONENTS.find((c) => c.name === current)!;
  const groups = Array.from(new Set(COMPONENTS.map((c) => c.group)));

  return (
    <div className="page">
      <TopGnb />
      <main className="page-body">
        <section className="k-panel lpanel">
          <div className="k-panel__head" style={{ height: 44, borderBottom: 0 }}><span className="k-label">컴포넌트 75</span></div>
          <div className="lp-search"><Search size={14} className="k-faint" /><input placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="k-panel__body" style={{ padding: "0 8px 8px" }}>
            {groups.map((g) => {
              const items = COMPONENTS.filter((c) => c.group === g && c.name.toLowerCase().includes(q.toLowerCase()) && (g === "제안 중" ? !confirmed : true));
              if (!items.length) return null;
              return (
                <div key={g}>
                  <div className="lp-label">{g}</div>
                  {items.map((c) => (
                    <button key={c.name + g} className="lp-item" style={{ paddingLeft: 10 }} data-active={current === c.name} onClick={() => setCurrent(c.name)}>
                      <LayoutGrid size={13} />{c.name}{c.proposed && !confirmed && <span className="lp-dot" />}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
        <section className="k-panel ds-main" style={{ padding: 28 }}>
          <div className="ds-head">
            <span className="ds-title">{comp.name}</span>
            <span className="k-chip">변형 {comp.variants}</span>
            <button className="k-btn" style={{ marginLeft: "auto" }} onClick={() => { const repo = import.meta.env.VITE_KNOT_REPO; if (repo) window.location.href = `vscode://file/${repo}/frontend/src/${comp.file}/index.tsx`; else toast(".env.local에 VITE_KNOT_REPO를 적으면 VS Code로 열려요"); }}><ExternalLink size={14} />에디터에서 열기</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 13, display: "flex", gap: 10 }}>
            <span className="k-faint">{comp.file}</span>
            <span style={{ color: "var(--success)" }}>디자인 시스템 이름과 코드 이름이 같아요</span>
          </div>
          <Preview key={comp.name} name={comp.name} usedIn={comp.usedIn} confirmed={confirmed} />
        </section>
      </main>
    </div>
  );
}

function Preview({ name, usedIn, confirmed }: { name: string; usedIn: string[]; confirmed: boolean }) {
  const [variant, setVariant] = useState<ToastVariant>("error");
  const [message, setMessage] = useState("로그아웃하지 못했어요. 다시 시도해 주세요.");
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);
  const proposedLabel = confirmed ? null : <span className="badge-new">로그아웃 제안에서 추가</span>;

  let canvas: ReactNode;
  let props: ReactNode = null;
  if (name === "Toast") {
    canvas = (
      <>
        <div className="ds-variant"><span className="k-label">지금 props</span><KToast variant={variant} message={message} action={action || undefined} /></div>
        <div className="ds-variant"><span className="k-label">정상, 문서 저장</span><KToast variant="success" message="문서를 저장했어요" /></div>
        <div className="ds-variant"><span className="k-label">애매한 상황, 로그인 만료</span><KToast variant="caution" message="로그인이 만료됐어요. 다시 로그인해 주세요." /></div>
        <div className="ds-variant"><span className="k-label">오류, 전송 실패</span><KToast variant="error" message="질문을 보내지 못했어요. 잠시 후 다시 시도해 주세요." /></div>
        <div className={`ds-variant ds-variant--new ${confirmed ? "confirmed" : ""}`}><span className="k-label" style={{ display: "flex", gap: 8 }}>오류, 로그아웃 실패 {proposedLabel}</span><KToast variant="error" message="로그아웃하지 못했어요. 다시 시도해 주세요." /></div>
      </>
    );
    props = (
      <>
        <label className="k-label">variant<select value={variant} onChange={(e) => setVariant(e.target.value as ToastVariant)}><option value="success">success</option><option value="caution">caution</option><option value="error">error</option></select></label>
        <label className="k-label">message<input value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <label className="k-label">action<select value={action} onChange={(e) => setAction(e.target.value)}><option value="">없음</option><option value="다시 시도">다시 시도</option><option value="열기">열기</option></select></label>
      </>
    );
  } else if (name === "ProfileMenu") {
    const menu = (b: boolean) => (
      <div style={{ ...light, display: "inline-block" }}>
        <div style={{ width: 240, padding: 6, background: "#fff", border: "1px solid #e9e6e1", borderRadius: 14, boxShadow: "0 6px 16px -4px rgba(31,30,28,.08)" }}>
          <div style={{ height: 38, display: "flex", alignItems: "center", gap: 10, padding: "0 14px", fontSize: 14, color: b ? "#8c8880" : "#1f1e1c" }}>{b ? <LoaderCircle size={18} className="spin" /> : <LogOut size={18} />}로그아웃</div>
        </div>
      </div>
    );
    canvas = (
      <>
        <div className={`ds-variant ds-variant--new ${confirmed ? "confirmed" : ""}`}><span className="k-label" style={{ display: "flex", gap: 8 }}>지금 props {proposedLabel}</span>{menu(busy)}</div>
        <div className={`ds-variant ds-variant--new ${confirmed ? "confirmed" : ""}`}><span className="k-label">기본</span>{menu(false)}</div>
        <div className={`ds-variant ds-variant--new ${confirmed ? "confirmed" : ""}`}><span className="k-label">처리 중 (AUTH-R19)</span>{menu(true)}</div>
      </>
    );
    props = (
      <>
        <label className="k-label">isLoggingOut<select value={String(busy)} onChange={(e) => setBusy(e.target.value === "true")}><option value="false">false</option><option value="true">true</option></select></label>
        <label className="k-label">onLogoutSelect<input value="() => void" readOnly /></label>
      </>
    );
  } else if (name === "Button") {
    const b = (bg: string, color: string, border?: string, label = "확인하기") => <span style={{ height: 40, padding: "0 16px", borderRadius: 12, background: bg, color, border, display: "inline-grid", placeItems: "center", fontWeight: 500 }}>{label}</span>;
    canvas = (
      <div style={{ ...light, display: "flex", gap: 10 }}>{b("#3c3b39", "#fff", undefined, "녹음 화면으로")}{b("#fff", "#1f1e1c", "1px solid #e9e6e1")}{b("#f4f2ee", "#55524d", undefined, "다시 시도")}</div>
    );
  } else if (name === "ConfirmDialog") {
    canvas = (
      <div style={{ ...light, display: "flex", justifyContent: "center", padding: 32 }}>
        <div style={{ width: 420, padding: 28, borderRadius: 20, background: "#fff", textAlign: "center", boxShadow: "0 8px 24px rgba(31,30,28,.07)" }}>
          <div style={{ fontSize: 22, fontWeight: 600 }}>녹음을 끝내고 로그아웃할까요?</div>
          <div style={{ color: "#6b6862", marginTop: 6 }}>지금 녹음은 문서로 정리돼요.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}><span style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e9e6e1", display: "grid", placeItems: "center" }}>취소</span><span style={{ flex: 1, height: 44, borderRadius: 12, background: "#3c3b39", color: "#fff", display: "grid", placeItems: "center" }}>끝내고 로그아웃</span></div>
        </div>
      </div>
    );
  } else if (name === "Spinner") {
    canvas = <div style={{ ...light, display: "flex", gap: 20, color: "#55524d" }}><LoaderCircle size={18} className="spin" /><LoaderCircle size={28} className="spin" /></div>;
  } else if (name === "Chip") {
    canvas = <div style={{ ...light, display: "flex", gap: 8 }}>{["48분", "녹음 중", "문서 1개"].map((t) => <span key={t} style={{ background: "#f4f2ee", padding: "2px 8px", borderRadius: 6, fontSize: 13, color: "#6b6862" }}>{t}</span>)}</div>;
  } else {
    canvas = <div className="k-faint" style={{ fontSize: 13 }}>이 컴포넌트의 미리보기는 데모에 넣지 않았어요. 실제 Knotted는 코드의 컴포넌트를 그대로 그려요.</div>;
  }

  return (
    <div className="ds-body">
      <div className="ds-canvas">{canvas}</div>
      <div className="ds-props">
        {props && <span className="k-label">props</span>}
        {props}
        <div style={{ marginTop: 10 }}>
          <div className="k-label" style={{ marginBottom: 6 }}>이 컴포넌트를 쓰는 화면 {usedIn.length}</div>
          {usedIn.map((u) => <div key={u} style={{ fontSize: 13, padding: "2px 0" }}>{u}</div>)}
        </div>
        <div className="k-faint" style={{ fontSize: 12 }}>props를 바꾸면 가운데 컴포넌트가 바로 다시 그려져요. Storybook의 컨트롤과 같은 역할이에요.</div>
      </div>
    </div>
  );
}
