import { X } from "lucide-react";
import { useState } from "react";
import { SCREEN_NAME } from "@/data/logout";
import type { Rule, ScreenId } from "@/data/types";
import ScaledScreen from "@/knot-app/ScaledScreen";
import { ago, fullDate } from "@/lib/time";
import { toast } from "@/lib/toast";
import { useKnotted } from "@/store/useKnotted";
import { useUi } from "@/store/useUi";

/** 규칙 탭: 참고 화면을 고정하고 디자인 규칙을 추가하거나 고친다. 규칙은 저장소의 md 파일이다 */
export default function RulesPanel() {
  const rules = useKnotted((s) => s.rules);
  const refScreens = useKnotted((s) => s.refScreens);
  const toggleRef = useKnotted((s) => s.toggleRefScreen);
  const selected = useUi((s) => s.selectedElement);
  const [open, setOpen] = useState<Rule | "new" | null>(null);

  const pinCandidate = (selected?.screen ?? "profile-menu-open") as ScreenId;

  return (
    <div style={{ overflow: "auto", flex: 1 }}>
      <div className="rgroup">
        <div className="k-label">참고 화면</div>
        <div className="k-muted" style={{ fontSize: 12 }}>고정한 화면은 에이전트가 새 시안을 만들 때 색, 글자, 배치를 따라 합니다.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {refScreens.map((id) => (
            <div key={id} className="ref-thumb">
              <ScaledScreen screen={id} width={148} inert variant={id === "home" ? "develop" : "draft"} />
              <span>{SCREEN_NAME[id]}</span>
              <button className="icon-btn" style={{ position: "absolute", right: 2, top: 2, width: 22, height: 22, background: "rgba(0,0,0,.6)" }} onClick={() => toggleRef(id)} title="고정 풀기"><X size={12} /></button>
            </div>
          ))}
          {!refScreens.includes(pinCandidate) && (
            <button className="ref-add" onClick={() => { toggleRef(pinCandidate); toast(`${SCREEN_NAME[pinCandidate]}을 참고 화면으로 고정했어요`); }}>
              + 화면 고정<br /><span className="k-faint" style={{ fontSize: 11 }}>{SCREEN_NAME[pinCandidate]}</span>
            </button>
          )}
        </div>
      </div>
      <div className="rgroup">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="k-label">디자인 규칙</span>
          <button className="k-btn k-btn--sm k-btn--primary" onClick={() => setOpen("new")}>+ 새 규칙</button>
        </div>
        <div className="k-muted" style={{ fontSize: 12 }}>에이전트가 시안을 만들기 전에 읽는 규칙입니다.</div>
        {rules.map((r) => (
          <button key={r.id} className="rule-item" onClick={() => setOpen(r)}>
            <b style={{ fontSize: 14 }}>{r.title}</b>
            <span className="k-muted" style={{ fontSize: 12 }}>{r.summary}</span>
            <span className="k-faint" style={{ fontSize: 12 }}>{r.author}, {ago(r.updatedAt)}</span>
          </button>
        ))}
      </div>
      <div style={{ padding: "14px 16px" }} className="k-faint">
        <span style={{ fontSize: 12 }}>규칙은 저장소의 .knotted/rules에 md 파일로 저장되고, 고친 기록은 커밋으로 남습니다.</span>
      </div>
      {open && <RuleModal rule={open === "new" ? null : open} onClose={() => setOpen(null)} />}
    </div>
  );
}

const NEW_RULE_BODY = "# 새 규칙\n\n- 에이전트가 시안을 만들 때 지킬 것을 한 줄에 하나씩 적어요.\n";

export function RuleModal({ rule, onClose }: { rule: Rule | null; onClose: () => void }) {
  const saveRule = useKnotted((s) => s.saveRule);
  const deleteRule = useKnotted((s) => s.deleteRule);
  const live = useKnotted((s) => (rule ? s.rules.find((r) => r.id === rule.id) : null)) ?? null;
  const [editing, setEditing] = useState(rule === null);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [title, setTitle] = useState(live?.title ?? "새 규칙");
  const [body, setBody] = useState(live?.body ?? NEW_RULE_BODY);

  const slug = live?.id ?? `rule-${Date.now().toString(36)}`;
  const file = live?.file ?? `.knotted/rules/${slug}.md`;

  const save = () => {
    const firstList = body.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3)).slice(0, 4).join(", ");
    saveRule(
      { id: slug, title, summary: live?.summary ?? (firstList || "새로 만든 규칙"), file, body, author: "", updatedAt: Date.now(), history: live?.history ?? [] },
      live ? `${title} 고침` : `${title} 추가`,
    );
    toast(`${file}에 저장하고 커밋했어요`);
    setEditing(false);
    if (!live) onClose();
  };

  return (
    <div className="modal-dim" onMouseDown={onClose}>
      <div className="k-pop modal" onMouseDown={(e) => e.stopPropagation()}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {editing ? (
              <input className="k-input" style={{ width: 280, fontSize: 18, fontWeight: 700, padding: "6px 10px" }} value={title} onChange={(e) => setTitle(e.target.value)} />
            ) : (
              <b style={{ fontSize: 22 }}>{live?.title}</b>
            )}
            <span className="k-chip mono" style={{ height: 26 }}>{file}</span>
            <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onClose}><X size={16} /></button>
          </div>
          {live && <div className="k-faint" style={{ marginTop: 6, fontSize: 13 }}>{live.author}이 고침, {fullDate(live.updatedAt)}</div>}
        </div>
        {showHistory && live ? (
          <div className="md-box" style={{ fontFamily: "var(--font-sans)", whiteSpace: "normal" }}>
            <div className="k-label" style={{ marginBottom: 8 }}>고친 기록 (커밋)</div>
            {live.history.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <span className="mono k-faint">{(h.at % 0xfffffff).toString(16).slice(0, 7)}</span>
                <span style={{ flex: 1 }}>{h.message}</span>
                <span className="k-muted">{h.author}, {fullDate(h.at)}</span>
              </div>
            ))}
          </div>
        ) : editing ? (
          <textarea className="md-box" value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
        ) : (
          <div className="md-box">{live?.body}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {live && !editing && (confirmDelete ? (
            <>
              <span className="k-muted" style={{ fontSize: 13 }}>이 규칙을 지울까요?</span>
              <button className="k-btn k-btn--danger" onClick={() => { deleteRule(live.id); toast("규칙을 지우고 커밋했어요"); onClose(); }}>지우기</button>
              <button className="k-btn" onClick={() => setConfirmDelete(false)}>취소</button>
            </>
          ) : (
            <button className="k-btn k-btn--danger" onClick={() => setConfirmDelete(true)}>삭제</button>
          ))}
          <span style={{ flex: 1 }} />
          {editing ? (
            <>
              <button className="k-btn" onClick={() => (live ? setEditing(false) : onClose())}>취소</button>
              <button className="k-btn k-btn--primary" onClick={save}>저장</button>
            </>
          ) : (
            <>
              <button className="k-btn" onClick={onClose}>닫기</button>
              <button className="k-btn" onClick={() => setShowHistory((v) => !v)}>{showHistory ? "규칙 보기" : "고친 기록"}</button>
              <button className="k-btn k-btn--primary" onClick={() => { setShowHistory(false); setEditing(true); }}>고치기</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
