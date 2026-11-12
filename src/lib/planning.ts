import { PROPOSAL } from "@/data/logout";
import type { ChatMessage } from "@/data/types";
import { useKnotted } from "@/store/useKnotted";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let seq = 0;
const nextId = () => `p${Date.now()}${seq++}`;

/**
 * 프로토타입의 기획 대화. 실제로는 팀원의 에이전트(Claude Code)가 knot-feature 하네스로 묻고 답한다.
 * 여기서는 로그아웃 기능 하나를 정해진 순서로 묻는다.
 */
export async function sendPlanningMessage(text: string) {
  const st = useKnotted.getState();
  st.pushPlanMessage({ id: nextId(), from: "user", text });

  if (st.planStep === 0) {
    await wait(700);
    useKnotted.getState().pushPlanMessage({
      id: nextId(),
      from: "agent",
      text: "지금 기능 요구사항에는 로그아웃이 없어요. 상단바 프로필 메뉴에 로그아웃을 두는 것으로 시작할게요. 두 가지만 정해 주세요.",
      question: { id: "q1", title: "로그아웃하고 나면 어디로 갈까요?", options: [{ label: "로그인 화면", recommended: true }, { label: "랜딩 페이지" }] },
    });
    useKnotted.getState().setPlanStep(1);
    return;
  }
  if (st.planStep === 1) return answerQuestion("q1", text);
  if (st.planStep === 2) return answerQuestion("q2", text);

  await wait(600);
  useKnotted.getState().pushPlanMessage({
    id: nextId(),
    from: "agent",
    text: "프로토타입이라 아직 실제 에이전트와 연결돼 있지 않아요. 연결되면 이 요청대로 기획과 시안을 고치고, 바뀐 곳을 제안서에 바로 기록해요.",
  });
}

export async function answerQuestion(qid: string, label: string) {
  const st = useKnotted.getState();
  const msg = st.planMessages.find((m) => m.question?.id === qid);
  if (!msg?.question || msg.question.answered) return;
  st.updatePlanMessage(msg.id, { question: { ...msg.question, answered: label } });

  if (qid === "q1") {
    st.addDecision(label === "로그인 화면" ? "로그아웃 뒤에는 로그인 화면으로 가요" : `로그아웃 뒤에는 ${label}로 가요`);
    await wait(900);
    useKnotted.getState().setPlanStep(2);
    useKnotted.getState().pushPlanMessage({
      id: nextId(),
      from: "agent",
      text: "로그아웃 뒤 갈 곳을 반영해서 요구사항 5개와 화면 3개를 만들었어요. 녹음 중일 때를 정하면 나머지 화면을 이어서 만들게요.",
      question: { id: "q2", title: "녹음 중에 로그아웃을 누르면요?", options: [{ label: "녹음을 끝낼지 먼저 묻기", recommended: true }, { label: "바로 로그아웃" }] },
    });
    return;
  }
  if (qid === "q2") {
    st.addDecision(label === "녹음을 끝낼지 먼저 묻기" ? "녹음 중이면 끝낼지 먼저 물어요" : `녹음 중이면: ${label}`);
    await wait(1100);
    useKnotted.getState().setPlanStep(3);
    const done: ChatMessage = {
      id: nextId(),
      from: "agent",
      text: "정한 내용으로 요구사항 6개와 화면 6개를 만들고 제안서로 묶었어요. 바뀌는 노션 문서는 3개이고, 백엔드 작업은 없어요. 고칠 게 없으면 검토를 요청해 주세요.",
      action: { label: "제안서 보기", to: `/p/${PROPOSAL.id}` },
    };
    useKnotted.getState().pushPlanMessage(done);
  }
}
