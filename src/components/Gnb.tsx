import { ChevronDown, GitBranch, LayoutGrid, Route, Shield, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PROPOSAL } from "@/data/logout";
import { useKnotted } from "@/store/useKnotted";
import { toast } from "@/lib/toast";
import StatusChip from "./StatusChip";
import "./gnb.css";

function Logo() {
  return (
    <Link to="/" className="gnb-logo" title="제안함으로">
      <span className="gnb-logo__mark" />
      knotted
    </Link>
  );
}

const DESIGN_ITEMS = [
  { to: "/design/system", label: "디자인 시스템", desc: "코드 컴포넌트와 변형, props", Icon: LayoutGrid },
  { to: "/design/policy", label: "디자인 정책", desc: "영역별 정책 카드", Icon: Shield },
  { to: "/design/flow", label: "유저 플로우", desc: "화면과 화면을 잇는 경로", Icon: Route },
];

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const on = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", on);
    return () => document.removeEventListener("mousedown", on);
  }, [open, close]);
  return ref;
}

export function DemoSwitch() {
  const role = useKnotted((s) => s.role);
  const setRole = useKnotted((s) => s.setRole);
  const resetDemo = useKnotted((s) => s.resetDemo);
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const navigate = useNavigate();
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="k-btn k-btn--ghost" style={{ height: 36, color: "var(--text-secondary)" }} onClick={() => setOpen((v) => !v)} title="데모에서 누구로 볼지 고릅니다">
        <UserRound size={15} />
        {role === "confirmer" ? "유월로 보는 중" : "팀원 A로 보는 중"}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="k-pop gnb-pop" style={{ right: 0, left: "auto", width: 240 }}>
          <div className="k-label" style={{ padding: "6px 10px" }}>데모: 누구로 볼까요?</div>
          {(["proposer", "confirmer"] as const).map((r) => (
            <button key={r} className="gnb-pop__item" data-active={role === r} onClick={() => { setRole(r); setOpen(false); }}>
              <span>{r === "proposer" ? "팀원 A" : "유월"}</span>
              <span className="gnb-pop__desc">{r === "proposer" ? "기능을 제안한 팀원" : "기획 컨펌 담당"}</span>
            </button>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
          <button className="gnb-pop__item" onClick={() => { resetDemo(); setOpen(false); navigate("/"); toast("데모를 처음 상태로 되돌렸어요"); }}>
            <span>데모 처음부터</span>
            <span className="gnb-pop__desc">상태, 댓글, 고친 문구를 모두 되돌립니다</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function TopGnb() {
  const { pathname } = useLocation();
  const status = useKnotted((s) => s.status);
  const startNewProposal = useKnotted((s) => s.startNewProposal);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useOutside(open, () => setOpen(false));
  const current = DESIGN_ITEMS.find((d) => pathname.startsWith(d.to));
  const reviewCount = (status === "검토 요청" ? 1 : 0) + 1;

  return (
    <header className="gnb">
      <div className="gnb-box">
        <Logo />
        <span className="gnb-sep" />
        <span className="k-muted">knot</span>
      </div>
      <nav className="k-segment gnb-center" ref={ref}>
        <button data-active={pathname === "/"} onClick={() => navigate("/")}>제안함 <span className="gnb-count">{reviewCount}</span></button>
        <button data-active={pathname.startsWith("/screens")} onClick={() => navigate("/screens")}>화면</button>
        <div style={{ position: "relative" }}>
          <button data-active={!!current || open} onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {current ? current.label : "디자인"} <ChevronDown size={14} />
          </button>
          {open && (
            <div className="k-pop gnb-pop">
              {DESIGN_ITEMS.map(({ to, label, desc, Icon }) => (
                <button key={to} className="gnb-pop__item gnb-pop__item--icon" data-active={current?.to === to} onClick={() => { setOpen(false); navigate(to); }}>
                  <Icon size={16} className="k-muted" />
                  <span><span style={{ display: "block" }}>{label}</span><span className="gnb-pop__desc">{desc}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="gnb-right">
        <DemoSwitch />
        <button className="k-btn k-btn--primary" onClick={() => { startNewProposal(); navigate(`/p/${PROPOSAL.id}/canvas`); }}>새 제안</button>
      </div>
    </header>
  );
}

export function ProposalGnb({ title, children }: { title?: string; children?: React.ReactNode }) {
  const { pathname } = useLocation();
  const planStep = useKnotted((s) => s.planStep);
  const navigate = useNavigate();
  const base = `/p/${PROPOSAL.id}`;
  const tab = pathname.endsWith("/canvas") ? "canvas" : pathname.includes("/flow") ? "flow" : pathname.includes("/compare") ? "compare" : "doc";
  return (
    <header className="gnb">
      <div className="gnb-box">
        <Logo />
        <span className="gnb-sep" />
        <span>{title ?? (planStep < 3 ? "새 제안" : PROPOSAL.title)}</span>
        <GitBranch size={14} className="k-faint" style={{ marginLeft: 4 }} />
        <span className="k-faint">{PROPOSAL.branch}</span>
      </div>
      <nav className="k-segment gnb-center">
        <button data-active={tab === "doc"} onClick={() => navigate(base)}>제안서</button>
        <button data-active={tab === "canvas"} onClick={() => navigate(`${base}/canvas`)}>캔버스</button>
        <button data-active={tab === "flow"} onClick={() => navigate(`${base}/flow`)}>흐름 보기</button>
      </nav>
      <div className="gnb-right">
        <DemoSwitch />
        <ProposalActions />
        {children}
      </div>
    </header>
  );
}

export function ProposalActions() {
  const role = useKnotted((s) => s.role);
  const status = useKnotted((s) => s.status);
  const planStep = useKnotted((s) => s.planStep);
  const setStatus = useKnotted((s) => s.setStatus);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const base = `/p/${PROPOSAL.id}`;

  const decide = (next: "확정" | "보류" | "반려") => {
    setStatus(next);
    toast(next === "확정" ? "확정했어요. 노션 제안에 상태, 컨펌한 사람, 날짜를 적었어요" : `${next}로 바꿨어요`);
    if (pathname !== base) navigate(base);
  };

  return (
    <>
      <StatusChip status={status} />
      {role === "proposer" && status === "작성 중" && planStep < 3 && (
        <button className="k-btn" onClick={() => navigate(base)}>제안서 보기</button>
      )}
      {role === "proposer" && status === "작성 중" && planStep >= 3 && (
        <button className="k-btn k-btn--primary" onClick={() => { setStatus("검토 요청"); toast("유월에게 검토를 요청했어요"); }}>검토 요청 보내기</button>
      )}
      {role === "proposer" && (status === "보류" || status === "반려") && (
        <button className="k-btn" onClick={() => setStatus("작성 중")}>고쳐서 다시 쓰기</button>
      )}
      {role === "confirmer" && status === "검토 요청" && (
        <>
          <button className="k-btn" onClick={() => decide("반려")}>반려</button>
          <button className="k-btn" onClick={() => decide("보류")}>보류</button>
          <button className="k-btn k-btn--primary" onClick={() => decide("확정")}>확정</button>
        </>
      )}
      {role === "confirmer" && status === "보류" && (
        <button className="k-btn" onClick={() => setStatus("검토 요청")}>다시 검토하기</button>
      )}
    </>
  );
}
