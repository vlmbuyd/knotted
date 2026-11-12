import { Check, ChevronDown, Circle, FileText, PanelLeftClose, PanelTop } from "lucide-react";
import { useEffect, useRef } from "react";
import { PROPOSAL, REQUIREMENTS, SCREEN_NAME } from "@/data/logout";
import type { ScreenId } from "@/data/types";
import ScaledScreen from "@/knot-app/ScaledScreen";
import { decidedRequirements, useKnotted } from "@/store/useKnotted";
import { useUi } from "@/store/useUi";
import type { StageGroup } from "./Stage";

export function PagesPanel({ groups, focus, onFocus, title = "페이지" }: { groups: StageGroup[]; focus: ScreenId | null; onFocus: (id: ScreenId | null) => void; title?: string }) {
  const setLeftOpen = useUi((s) => s.setLeftOpen);
  return (
    <section className="k-panel lpanel">
      <div className="k-panel__head lp-head">
        <span className="lp-title">{title}</span>
        <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={() => setLeftOpen(false)} title="패널 접기"><PanelLeftClose size={16} /></button>
      </div>
      <div className="k-panel__body">
        {groups.map((g) => (
          <div key={g.name} className="lp-group">
            <button className="lp-page" style={{ width: "100%" }} onClick={() => onFocus(null)}><span>{g.name}</span><span className="k-faint" style={{ fontWeight: 400 }}>{g.path}</span></button>
            {g.screens.map((sc) => (
              <button key={sc.id} className="lp-item" data-active={focus === sc.id} onClick={() => onFocus(sc.id)} disabled={!sc.ready}>
                <PanelTop size={13} />{sc.name}
                {!sc.ready && <span className="k-faint" style={{ marginLeft: "auto", fontSize: 11 }}>정하는 중</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="lp-foot">지금 화면<br /><span style={{ color: "var(--text-primary)" }}>develop 빌드, 2시간 전</span></div>
    </section>
  );
}

/** 1-1: 채팅으로 정한 요구사항이 바로 기록되고, 그 요구사항의 시안이 함께 붙는 초안 */
export function DraftPanel({ onFocus }: { onFocus: (id: ScreenId) => void }) {
  const planStep = useKnotted((s) => s.planStep);
  const decisions = useKnotted((s) => s.decisions);
  const setLeftOpen = useUi((s) => s.setLeftOpen);
  const reqs = decidedRequirements(planStep);
  const seen = useRef(new Set<string>(reqs.map((r) => r.id)));
  const fresh = reqs.filter((r) => !seen.current.has(r.id)).map((r) => r.id);
  useEffect(() => {
    reqs.forEach((r) => seen.current.add(r.id));
  });

  const pending = planStep === 0 ? [] : planStep === 1 ? ["로그아웃 뒤 갈 곳", "녹음 중이면 어떻게 할지"] : planStep === 2 ? ["녹음 중이면 어떻게 할지"] : [];

  return (
    <section className="k-panel lpanel" style={{ width: 280 }}>
      <div className="k-panel__head lp-head">
        <span className="lp-title">제안서 초안</span>
        <span className="k-faint" style={{ marginLeft: "auto", fontSize: 11 }}>요구사항마다 시안이 함께 붙어요</span>
        <button className="icon-btn" onClick={() => setLeftOpen(false)} title="패널 접기"><PanelLeftClose size={16} /></button>
      </div>
      <div className="k-panel__body" style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 17, fontWeight: 700, margin: "4px 0 14px" }}>{planStep === 0 ? "아직 정한 것이 없어요" : PROPOSAL.title}</div>
        <div className="k-label" style={{ paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
          요구사항 <span style={{ marginLeft: 6 }}>{reqs.length}개 정함{pending.length ? `, ${pending.length}개 정하는 중` : ""}</span>
        </div>
        {reqs.map((r) => (
          <div key={r.id} className={`draft-req ${fresh.includes(r.id) ? "draft-new" : ""}`}>
            <div className="draft-req__head"><Check size={14} color="var(--success)" /><span className="k-faint" style={{ fontSize: 12 }}>{r.short}</span>{r.draftName}</div>
            {r.screens.length > 0 ? (
              <div className="draft-thumbs">
                {r.screens.map((id) => (
                  <button key={id} onClick={() => onFocus(id)} title={SCREEN_NAME[id]}><ScaledScreen screen={id} width={70} inert /></button>
                ))}
              </div>
            ) : (
              <div className="draft-req__note">{r.noScreenNote}</div>
            )}
          </div>
        ))}
        {pending.map((p) => (
          <div key={p} className="req--pending" style={{ display: "flex", justifyContent: "space-between", border: "1px dashed var(--border)", borderRadius: 8, padding: "9px 10px", marginTop: 10, fontSize: 13 }}>
            <span className="k-muted" style={{ display: "flex", gap: 8, alignItems: "center" }}><Circle size={12} />{p}</span><span className="k-faint" style={{ fontSize: 12 }}>정하는 중</span>
          </div>
        ))}
        {(decisions.length > 0 || pending.length > 0) && (
          <div style={{ marginTop: 16 }}>
            <div className="k-label" style={{ marginBottom: 6 }}>정한 것</div>
            {decisions.map((d) => <div key={d} className="decided" style={{ fontSize: 13 }}><Check size={13} color="var(--success)" />{d}</div>)}
            {planStep > 0 && planStep < 3 && <div className="decided k-faint" style={{ fontSize: 13 }}><Circle size={12} />{pending[pending.length - 1]}는 대화에서 정하는 중</div>}
          </div>
        )}
      </div>
      <div className="lp-foot" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span>요구사항이 정해지면 바로 여기에 기록되고 관련 시안이 함께 붙어요. 검토를 요청하면 이 초안이 제안서가 돼요.</span>
        <div className="k-chip" style={{ height: 34, borderRadius: 8, justifyContent: "flex-start", gap: 8 }}><FileText size={13} />참고: 바뀌는 문서와 디자인 {planStep >= 3 ? 6 : Math.min(6, reqs.length)}<ChevronDown size={13} style={{ marginLeft: "auto" }} /></div>
      </div>
    </section>
  );
}

export const ALL_REQUIREMENTS = REQUIREMENTS;
