import { SquareDashed } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopGnb } from "@/components/Gnb";
import { PROPOSAL, SCREEN_NAME } from "@/data/logout";
import type { ScreenId } from "@/data/types";
import ScaledScreen from "@/knot-app/ScaledScreen";
import { useKnotted } from "@/store/useKnotted";
import "./pages.css";

const FLOWS: [string, number][] = [["로그인과 로그아웃", 6], ["녹음 시작과 끝", 9], ["문서 정리", 7], ["탐색 질문", 5]];
const W = 150;
const H = Math.round((W * 1024) / 1440);

const NODES: { id: ScreenId; x: number; y: number; proposed?: boolean }[] = [
  { id: "home", x: 0, y: 0 },
  { id: "profile-menu-open", x: 230, y: 0, proposed: true },
  { id: "logging-out", x: 460, y: 0, proposed: true },
  { id: "login", x: 690, y: 0 },
  { id: "logout-failed", x: 460, y: 240, proposed: true },
  { id: "recording-confirm", x: 230, y: 460, proposed: true },
  { id: "finish-logging-out", x: 460, y: 460, proposed: true },
];

const pos = (id: ScreenId) => NODES.find((n) => n.id === id)!;

/** 5-3: 흐름 보기에서 저장한 순서로 만든 유저 플로우. 제안이 추가하는 화면은 점선, 확정되면 실선 */
export default function UserFlowPage() {
  const [flow, setFlow] = useState("로그인과 로그아웃");
  const status = useKnotted((s) => s.status);
  const navigate = useNavigate();
  const pending = status !== "반영 완료";
  const visible = NODES.filter((n) => !n.proposed || status !== "반려");

  const right = (id: ScreenId) => ({ x: pos(id).x + W, y: pos(id).y + H / 2 });
  const left = (id: ScreenId) => ({ x: pos(id).x, y: pos(id).y + H / 2 });
  const bottom = (id: ScreenId) => ({ x: pos(id).x + W / 2, y: pos(id).y + H + 30 });
  const top = (id: ScreenId) => ({ x: pos(id).x + W / 2, y: pos(id).y });

  const edges: { d: string; label: string; lx: number; ly: number; proposed: boolean }[] = [
    { d: `M${right("home").x + 8},${right("home").y} L${left("profile-menu-open").x - 10},${left("profile-menu-open").y}`, label: "프로필 사진", lx: right("home").x + 14, ly: right("home").y - 10, proposed: true },
    { d: `M${right("profile-menu-open").x + 8},${right("profile-menu-open").y} L${left("logging-out").x - 10},${left("logging-out").y}`, label: "로그아웃", lx: right("profile-menu-open").x + 14, ly: right("profile-menu-open").y - 10, proposed: true },
    { d: `M${right("logging-out").x + 8},${right("logging-out").y} L${left("login").x - 10},${left("login").y}`, label: "성공", lx: right("logging-out").x + 20, ly: right("logging-out").y - 10, proposed: true },
    { d: `M${bottom("logging-out").x},${bottom("logging-out").y} L${top("logout-failed").x},${top("logout-failed").y - 10}`, label: "실패하면", lx: bottom("logging-out").x + 8, ly: bottom("logging-out").y + 30, proposed: true },
    { d: `M${bottom("profile-menu-open").x},${bottom("profile-menu-open").y} L${top("recording-confirm").x},${top("recording-confirm").y - 10}`, label: "녹음 중이면", lx: bottom("profile-menu-open").x + 8, ly: bottom("profile-menu-open").y + 80, proposed: true },
    { d: `M${right("recording-confirm").x + 8},${right("recording-confirm").y} L${left("finish-logging-out").x - 10},${left("finish-logging-out").y}`, label: "끝내고 로그아웃", lx: right("recording-confirm").x + 6, ly: right("recording-confirm").y - 10, proposed: true },
    { d: `M${right("finish-logging-out").x + 8},${right("finish-logging-out").y} L${pos("login").x + W / 2 + 40},${right("finish-logging-out").y} L${pos("login").x + W / 2 + 40},${pos("login").y + H + 36}`, label: "", lx: 0, ly: 0, proposed: true },
  ];

  return (
    <div className="page">
      <TopGnb />
      <main className="page-body">
        <section className="k-panel lpanel">
          <div className="k-panel__head" style={{ height: 44, borderBottom: 0 }}><span className="k-label">플로우</span></div>
          <div className="k-panel__body" style={{ padding: 8 }}>
            {FLOWS.map(([f, n]) => (
              <button key={f} className="lp-item" style={{ paddingLeft: 10 }} data-active={flow === f} onClick={() => setFlow(f)}>
                {f}{f === "로그인과 로그아웃" && pending && <span className="lp-dot" style={{ marginRight: 8 }} />}<span className="k-faint" style={{ marginLeft: f === "로그인과 로그아웃" && pending ? 0 : "auto" }}>{n}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="k-panel" style={{ flex: 1 }}>
          <div className="k-panel__body" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span className="ds-title">{flow}</span>
              {pending && <span style={{ marginLeft: "auto", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} className="k-muted"><SquareDashed size={14} color="var(--selection)" />로그아웃 제안이 추가하는 화면</span>}
            </div>
            <div className="k-faint" style={{ fontSize: 13, margin: "8px 0 36px" }}>흐름 보기에서 저장한 순서로 만들어져요. 화면을 누르면 그 화면부터 흐름 보기가 열려요.</div>
            {flow !== "로그인과 로그아웃" ? (
              <div className="k-faint">이 플로우는 데모에 넣지 않았어요.</div>
            ) : (
              <div style={{ position: "relative", width: 900, height: 640, marginLeft: 60 }}>
                <svg width={900} height={640} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                  <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#8c8c90" strokeWidth="1.2" /></marker></defs>
                  {edges.map((e, i) => (
                    <g key={i}>
                      <path d={e.d} fill="none" stroke="#8c8c90" strokeWidth="1.2" strokeDasharray={e.proposed && pending ? "5 4" : undefined} markerEnd="url(#arr)" />
                      {e.label && <text x={e.lx} y={e.ly} fill="#99999e" fontSize="12">{e.label}</text>}
                    </g>
                  ))}
                </svg>
                {visible.map((n) => (
                  <button key={n.id} className="flow-node" data-proposed={!!n.proposed && pending} style={{ left: n.x, top: n.y }} onClick={() => navigate(`/p/${PROPOSAL.id}/flow?start=${n.id}`)}>
                    <div className="flow-node__img"><ScaledScreen screen={n.id} width={W} inert variant={n.id === "home" ? "develop" : "draft"} /></div>
                    <span style={{ fontWeight: n.proposed ? 600 : 400 }}>{SCREEN_NAME[n.id]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
