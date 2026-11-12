import { ArrowUp, Check, ChevronDown, Circle, Link2, LoaderCircle, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PROPOSAL, REFLECT_STEPS, SCREEN_NAME } from "@/data/logout";
import { REGISTRY } from "@/data/registry";
import type { ChatMessage } from "@/data/types";
import { runRequest } from "@/lib/agent";
import { parseElementLink } from "@/lib/links";
import { answerQuestion, sendPlanningMessage } from "@/lib/planning";
import { currentUser, useKnotted } from "@/store/useKnotted";
import "./panels.css";

type Mode = "chat" | "review" | "reflect";

interface Attachment { screen: string; element: string; href: string }

/** 오른쪽 패널의 대화. 제안서 화면에서는 패널 전체, 캔버스에서는 AI 탭으로 쓴다 */
export default function ChatPanel({ mode = "chat", embedded, headerExtra }: { mode?: Mode; embedded?: boolean; headerExtra?: React.ReactNode }) {
  const reviewComments = useKnotted((s) => s.reviewComments);
  return (
    <section className={embedded ? "chat chat--embedded" : "k-panel chat"} style={{ flex: 1 }}>
      {!embedded && (
        <div className="k-panel__head">
          <Sparkles size={15} />
          <span style={{ fontWeight: 600 }}>{mode === "review" ? `댓글 ${reviewComments.length}` : "대화"}</span>
          <span style={{ marginLeft: "auto" }} />
          {headerExtra}
          <AgentSelect />
        </div>
      )}
      {mode === "review" ? <ReviewBody /> : mode === "reflect" ? <ReflectBody /> : <ChatBody />}
    </section>
  );
}

export function AgentSelect() {
  return (
    <span className="agent-select" title="각자 쓰는 에이전트를 연결합니다">Claude Code <ChevronDown size={13} /></span>
  );
}

function ChatBody() {
  const messages = useKnotted((s) => s.planMessages);
  const planStep = useKnotted((s) => s.planStep);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, messages]);

  const placeholder = planStep === 0 ? "만들고 싶은 기능을 말해 주세요" : planStep < 3 ? "더 정하거나 고칠 것을 말해 주세요" : "제안서에서 고칠 것을 말해 주세요";
  return (
    <>
      <div className="chat-body" ref={scroller}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>어떤 기능을 만들까요?</div>
            <div>에이전트가 지금 기능 요구사항과 화면을 읽고, 정할 것을 하나씩 물어요. 정해진 요구사항은 왼쪽 초안에 바로 기록되고 시안이 함께 붙어요.</div>
            <button className="k-chip" style={{ height: 28, marginTop: 4, color: "var(--text-primary)" }} onClick={() => sendPlanningMessage("로그아웃 기능 구현해 줘")}>로그아웃 기능 구현해 줘</button>
          </div>
        )}
        {messages.map((m) => <Message key={m.id} m={m} />)}
      </div>
      <ChatInput placeholder={placeholder} />
    </>
  );
}

function Message({ m }: { m: ChatMessage }) {
  const navigate = useNavigate();
  if (m.from === "user") {
    return (
      <div className="msg-user">
        {m.attachments?.map((a) => <span key={a.href} className="attach-chip"><Link2 size={12} />{a.label}</span>)}
        <div>{m.text}</div>
      </div>
    );
  }
  const q = m.question;
  return (
    <div className="msg-agent">
      <p>{m.text}</p>
      {q && (
        <div className="question" data-waiting={!q.answered}>
          <div className="question-title">{q.title}</div>
          {q.options.map((o) => {
            const chosen = q.answered === o.label;
            return (
              <button key={o.label} className="question-opt" data-chosen={chosen} disabled={!!q.answered} onClick={() => answerQuestion(q.id, o.label)}>
                <span className="radio" data-on={chosen} />
                {o.label}
                {o.recommended && <span className="k-faint" style={{ marginLeft: "auto", fontSize: 12 }}>추천</span>}
              </button>
            );
          })}
          {!q.answered && <div className="question-wait"><span className="k-dot" />답을 기다려요</div>}
        </div>
      )}
      {m.action && <button className="k-btn k-btn--sm" style={{ marginTop: 10 }} onClick={() => navigate(m.action!.to)}>{m.action.label}</button>}
    </div>
  );
}

/** 입력창. 요소 링크를 붙여 넣으면 칩으로 바뀌고, 칩이 붙은 메시지는 수정 요청이 된다 */
export function ChatInput({ placeholder }: { placeholder: string }) {
  const [text, setText] = useState("");
  const [attach, setAttach] = useState<Attachment[]>([]);
  const planStep = useKnotted((s) => s.planStep);
  const role = useKnotted((s) => s.role);

  const submit = () => {
    const body = text.trim();
    if (!body && attach.length === 0) return;
    setText("");
    if (attach.length > 0 && planStep >= 3) {
      const st = useKnotted.getState();
      const id = `t${Date.now()}`;
      st.pushPlanMessage({ id: `u${id}`, from: "user", text: body || "이 요소를 봐 주세요", attachments: attach.map((a) => ({ label: `${REGISTRY[a.element]?.ds ?? a.element}  ${SCREEN_NAME[a.screen] ?? ""}`, href: a.href })) });
      for (const a of attach) {
        st.addThread({ id: `${id}${a.element}`, kind: "request", screen: a.screen as never, anchor: { x: 0, y: 0 }, elements: [a.element], text: body, author: currentUser(role), createdAt: Date.now(), status: "에이전트 기다리는 중", replies: 0 });
        runRequest(`${id}${a.element}`);
      }
      setTimeout(() => useKnotted.getState().pushPlanMessage({ id: `a${id}`, from: "agent", text: "수정 요청으로 받았어요. 고치는 동안 댓글 탭에서 진행을 볼 수 있어요." }), 500);
      setAttach([]);
      return;
    }
    setAttach([]);
    void sendPlanningMessage(body);
  };

  return (
    <div className="chat-input-wrap">
      <div className="chat-input">
        {attach.length > 0 && (
          <div className="attach-row">
            {attach.map((a) => (
              <span key={a.href} className="attach-chip attach-chip--sel">
                <Link2 size={12} />{REGISTRY[a.element]?.ds ?? a.element}<span className="k-faint">{SCREEN_NAME[a.screen]}</span>
                <button onClick={() => setAttach((xs) => xs.filter((x) => x.href !== a.href))}><X size={12} /></button>
              </span>
            ))}
          </div>
        )}
        <textarea
          rows={1}
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            const link = parseElementLink(pasted);
            if (link) {
              e.preventDefault();
              setAttach((xs) => (xs.some((x) => x.href === link.href) ? xs : [...xs, link]));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button className="send-btn" onClick={submit} aria-label="보내기"><ArrowUp size={16} /></button>
      </div>
    </div>
  );
}

function ReviewBody() {
  const comments = useKnotted((s) => s.reviewComments);
  const add = useKnotted((s) => s.addReviewComment);
  const [text, setText] = useState("");
  return (
    <>
      <div className="chat-body">
        {comments.map((c) => (
          <div key={c.id} className="review-c">
            <div className="review-c__head"><b>{c.author}</b><span className="k-faint">{c.target ? `${c.target}, ` : ""}{c.when}</span></div>
            <div className="k-muted" style={{ color: "#cfcfd2" }}>{c.text}</div>
          </div>
        ))}
        <div className="k-faint" style={{ fontSize: 12, marginTop: 8 }}>요소에 다는 댓글은 캔버스에서 C를 눌러 남겨요.</div>
      </div>
      <div className="chat-input-wrap">
        <div className="chat-input">
          <textarea rows={1} value={text} placeholder="제안에 댓글 달기" onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (text.trim()) { add(text.trim()); setText(""); } } }} />
          <button className="send-btn" onClick={() => { if (text.trim()) { add(text.trim()); setText(""); } }} aria-label="보내기"><ArrowUp size={16} /></button>
        </div>
      </div>
    </>
  );
}

function ReflectBody() {
  const done = useKnotted((s) => s.reflectDone);
  const status = useKnotted((s) => s.status);
  return (
    <>
      <div className="chat-body">
        <p className="k-muted" style={{ marginTop: 0 }}>{status === "반영 완료" ? "확정된 내용을 모두 반영했어요." : "확정된 내용을 반영하고 있어요."}</p>
        <div className="reflect-list">
          {REFLECT_STEPS.map((step, i) => (
            <div key={step} className="reflect-step" data-state={i < done ? "done" : i === done ? "doing" : "todo"}>
              {i < done ? <Check size={15} color="var(--success)" /> : i === done ? <LoaderCircle size={15} className="spin" /> : <Circle size={15} />}
              {step}
            </div>
          ))}
        </div>
        <div className="next-box">
          <div className="k-label">다음 단계</div>
          <div className="k-muted" style={{ color: "#cfcfd2" }}>이슈가 만들어지면 {PROPOSAL.branch} 브랜치에서 구현을 이어 가요. 시안 코드가 구현의 시작점이에요.</div>
        </div>
      </div>
      <ChatInput placeholder="구현에 대해 물어보거나 요청하기" />
    </>
  );
}
