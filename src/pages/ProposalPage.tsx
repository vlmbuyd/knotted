import { Check, ChevronDown, CircleDot, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProposalGnb } from "@/components/Gnb";
import ChatPanel from "@/features/panels/ChatPanel";
import { PROPOSAL, REFERENCES, REFLECT_STEPS, SCREENS } from "@/data/logout";
import ScaledScreen from "@/knot-app/ScaledScreen";
import { decidedRequirements, useKnotted } from "@/store/useKnotted";
import "./pages.css";

export default function ProposalPage() {
  const role = useKnotted((s) => s.role);
  const status = useKnotted((s) => s.status);
  const planStep = useKnotted((s) => s.planStep);
  const decisions = useKnotted((s) => s.decisions);
  const reflectDone = useKnotted((s) => s.reflectDone);
  const setReflectDone = useKnotted((s) => s.setReflectDone);
  const setStatus = useKnotted((s) => s.setStatus);
  const navigate = useNavigate();
  const [hoverReq, setHoverReq] = useState<string | null>(null);
  const [refOpen, setRefOpen] = useState(false);

  const reqs = decidedRequirements(planStep);
  const shownScreens = SCREENS.filter((sc) => reqs.some((r) => r.screens.includes(sc.id)));
  const highlight = hoverReq ? reqs.find((r) => r.id === hoverReq)?.screens ?? [] : [];

  // 확정되면 제안한 팀원의 에이전트가 반영을 이어 간다. 데모에서는 시간이 지나며 하나씩 끝난다.
  useEffect(() => {
    if (status !== "확정") return;
    if (reflectDone >= REFLECT_STEPS.length - 1) {
      const t = setTimeout(() => { setReflectDone(REFLECT_STEPS.length); setStatus("반영 완료"); }, 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setReflectDone(reflectDone + 1), 1400);
    return () => clearTimeout(t);
  }, [status, reflectDone, setReflectDone, setStatus]);

  const confirmed = status === "확정" || status === "반영 완료";

  return (
    <div className="page">
      <ProposalGnb />
      <main className="page-body">
        <section className="k-panel" style={{ flex: 1 }}>
          <div className="k-panel__body doc">
            {confirmed && (
              <div className="doc-banner doc-banner--ok"><Check size={16} />유월이 확정했어요. 노션 제안 페이지에도 확정, 컨펌한 사람, 컨펌 날짜가 기록됐어요.</div>
            )}
            {(status === "보류" || status === "반려") && (
              <div className="doc-banner"><CircleDot size={16} />유월이 {status}했어요. {status === "보류" ? "다시 검토할 때까지 제안함에 남아 있어요." : "필요하면 고쳐서 새로 제안해 주세요."}</div>
            )}
            <div className="doc-tags">
              <span className="k-chip">{PROPOSAL.kind}</span>
              <span className="k-chip">{PROPOSAL.area}</span>
              <span className="k-faint" style={{ fontSize: 12 }}>{PROPOSAL.proposer}가 제안, {PROPOSAL.createdLabel}</span>
            </div>
            <h1 className="doc-title">{PROPOSAL.title}</h1>
            <p className="doc-summary">{planStep >= 3 ? PROPOSAL.summary : "채팅에서 정하는 중이에요. 정해진 요구사항과 시안이 여기에 바로 기록돼요."}</p>

            <div className="doc-cols">
              <div className="doc-plan">
                <div className="doc-h">기획 <span className="k-chip">요구사항 추가 {reqs.length}</span></div>
                {reqs.map((r) => (
                  <div key={r.id} className="req" data-hover={hoverReq === r.id} onMouseEnter={() => setHoverReq(r.id)} onMouseLeave={() => setHoverReq(null)}>
                    <div className="req-head">
                      <span className="k-tag-add">{r.kind}</span>
                      <span className="k-faint" style={{ fontSize: 12 }}>{r.id}</span>
                      <span className="req-name">{r.name}</span>
                      <span className="req-count">{r.screens.length ? `화면 ${r.screens.length}` : "화면 없음"}</span>
                    </div>
                    <div className="req-sentence">{r.sentence}</div>
                  </div>
                ))}
                {planStep < 3 && (
                  <div className="req req--pending"><span className="k-faint">녹음 중이면 어떻게 할지</span><span className="req-count">정하는 중</span></div>
                )}
                <div className="doc-decided">
                  <div className="k-label" style={{ marginBottom: 6 }}>정한 것</div>
                  {decisions.map((d) => <div key={d} className="decided"><Check size={14} color="var(--success)" />{d}</div>)}
                </div>
              </div>

              <div className="doc-drafts">
                <div className="doc-h" style={{ justifyContent: "space-between" }}>
                  <span>시안 {shownScreens.length}</span>
                  {role === "confirmer" && status === "검토 요청" ? (
                    <button className="doc-link" onClick={() => navigate(`/p/${PROPOSAL.id}/compare/${SCREENS[0].id}`)}>지금 화면과 비교</button>
                  ) : (
                    <button className="doc-link" onClick={() => navigate(`/p/${PROPOSAL.id}/canvas`)}>캔버스에서 크게 보기</button>
                  )}
                </div>
                <div className="draft-grid">
                  {shownScreens.map((sc) => (
                    <button key={sc.id} className="draft" data-hl={highlight.includes(sc.id)} onClick={() => navigate(`/p/${PROPOSAL.id}/canvas?screen=${sc.id}`)}>
                      <ScaledScreen screen={sc.id} width={confirmed ? 166 : 187} inert />
                      <span>{sc.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ref" data-open={refOpen}>
              <button className="ref-row" onClick={() => setRefOpen((v) => !v)}>
                <FileText size={15} className="k-muted" />
                <b>참고: 바뀌는 문서와 디자인 6</b>
                {!refOpen && REFERENCES.flatMap((g) => g.items).map((i) => <span key={i.label} className="k-faint">{i.label}</span>)}
                <span style={{ marginLeft: "auto" }} className="k-faint">{refOpen ? "접기" : "펼치기"}</span>
                <ChevronDown size={15} className="k-faint" style={{ transform: refOpen ? "rotate(180deg)" : undefined }} />
              </button>
              {refOpen && (
                <div className="ref-body">
                  {REFERENCES.map((g) => (
                    <div key={g.group}>
                      <div className="k-label" style={{ margin: "4px 0 6px" }}>{g.group}</div>
                      {g.items.map((i) => (
                        <div key={i.label} className="ref-item"><span>{i.label}</span><span className="k-muted">{i.detail}</span></div>
                      ))}
                    </div>
                  ))}
                  <div className="k-faint" style={{ fontSize: 12, marginTop: 8 }}>확정되면 제안한 팀원의 에이전트가 이 목록대로 반영해요.</div>
                </div>
              )}
            </div>
          </div>
        </section>
        <aside style={{ width: 396, display: "flex" }}>
          <ChatPanel mode={confirmed ? "reflect" : role === "confirmer" && status === "검토 요청" ? "review" : "chat"} />
        </aside>
      </main>
    </div>
  );
}
