import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopGnb } from "@/components/Gnb";
import { PROPOSAL, REQUIREMENTS, SCREENS } from "@/data/logout";
import type { ProposalStatus } from "@/data/types";
import ScaledScreen from "@/knot-app/ScaledScreen";
import { toast } from "@/lib/toast";
import { useKnotted } from "@/store/useKnotted";
import "./pages.css";

interface OtherProposal {
  title: string;
  summary: string;
  kind: string;
  area: string;
  meta: string;
  status: ProposalStatus;
}

const OTHERS: OtherProposal[] = [
  { title: "첫 문서 뒤 탐색 튜토리얼", summary: "첫 문서가 정리되면 탐색에 질문하는 법을 화면을 가리키며 알려 줘요.", kind: "수정", area: "탐색", meta: "팀원 B, 어제, 요구사항 4, 화면 4, 바뀌는 노션 문서 2, 바뀌는 디자인 2", status: "검토 요청" },
  { title: "녹음 이름 바로 바꾸기", summary: "녹음 기록에서 이름을 눌러 그 자리에서 바꿔요.", kind: "추가", area: "녹음", meta: "팀원 C, 2시간 전, 요구사항 2", status: "작성 중" },
  { title: "문서 공유 링크", summary: "문서를 팀 밖 사람에게 읽기 전용 링크로 보여 줘요.", kind: "추가", area: "문서", meta: "팀원 B, 어제, 요구사항 5", status: "작성 중" },
  { title: "알림 모아 보기", summary: "흩어진 알림을 상단바 한곳에 모아요.", kind: "추가", area: "공통", meta: "팀원 D, 3일 전, 요구사항 3", status: "작성 중" },
  { title: "다크 모드", summary: "시스템 설정을 따라 어두운 화면으로 바꿔요.", kind: "추가", area: "공통", meta: "팀원 C, 1주 전, 요구사항 4", status: "보류" },
  { title: "탐색 답변 출처 펼치기", summary: "답변의 출처를 눌러 원문 문단을 펼쳐 봐요.", kind: "수정", area: "탐색", meta: "팀원 B, 2일 전, 요구사항 2", status: "확정" },
  { title: "녹음 자동 일시정지", summary: "말이 없으면 녹음을 잠시 멈춰요.", kind: "추가", area: "녹음", meta: "팀원 D, 1주 전", status: "반려" },
  { title: "회의 템플릿", summary: "자주 쓰는 회의 형식을 골라 문서를 시작해요.", kind: "추가", area: "문서", meta: "팀원 A, 2주 전", status: "반려" },
];

const TABS: ProposalStatus[] = ["검토 요청", "작성 중", "보류", "확정", "반영 완료", "반려"];
const DONE_COUNT = 12;

export default function InboxPage() {
  const status = useKnotted((s) => s.status);
  const role = useKnotted((s) => s.role);
  const [tab, setTab] = useState<ProposalStatus>(role === "proposer" ? status : "검토 요청");
  const navigate = useNavigate();

  const count = (t: ProposalStatus) =>
    OTHERS.filter((o) => o.status === t).length + (status === t ? 1 : 0) + (t === "반영 완료" ? DONE_COUNT : 0);

  const others = OTHERS.filter((o) => o.status === tab);
  const showLogout = status === tab;

  return (
    <div className="page">
      <TopGnb />
      <main className="page-body">
        <section className="k-panel" style={{ flex: 1 }}>
          <div className="k-panel__body" style={{ padding: "28px 28px" }}>
            <h1 className="page-title">제안함</h1>
            <div className="inbox-tabs">
              {TABS.map((t) => (
                <button key={t} className="k-chip inbox-tab" data-active={tab === t} onClick={() => setTab(t)}>
                  {t} {count(t)}
                </button>
              ))}
            </div>
            <div className="inbox-list">
              {showLogout && (
                <button className="inbox-card" onClick={() => navigate(`/p/${PROPOSAL.id}`)}>
                  <div className="inbox-card__main">
                    <div className="inbox-card__tags"><span className="k-chip">{PROPOSAL.kind}</span><span className="k-chip">{PROPOSAL.area}</span></div>
                    <div className="inbox-card__title">{PROPOSAL.title}</div>
                    <div className="inbox-card__summary">{PROPOSAL.summary}</div>
                    <div className="inbox-card__meta">
                      {PROPOSAL.proposer}, {PROPOSAL.createdLabel}, 요구사항 {REQUIREMENTS.length}, 화면 {SCREENS.length}, 바뀌는 노션 문서 3, 바뀌는 디자인 3
                    </div>
                  </div>
                  <div className="inbox-card__thumbs">
                    {SCREENS.slice(0, 3).map((sc) => <ScaledScreen key={sc.id} screen={sc.id} width={150} inert />)}
                  </div>
                </button>
              )}
              {others.map((o) => (
                <button key={o.title} className="inbox-card" onClick={() => toast("이 제안은 데모에 들어 있지 않아요. 로그아웃 제안을 열어 보세요")}>
                  <div className="inbox-card__main">
                    <div className="inbox-card__tags"><span className="k-chip">{o.kind}</span><span className="k-chip">{o.area}</span></div>
                    <div className="inbox-card__title">{o.title}</div>
                    <div className="inbox-card__summary">{o.summary}</div>
                    <div className="inbox-card__meta">{o.meta}</div>
                  </div>
                  <div className="inbox-card__thumbs">
                    {[0, 1, 2].map((i) => <div key={i} className="inbox-thumb-empty" />)}
                  </div>
                </button>
              ))}
              {tab === "반영 완료" && (
                <div className="k-faint" style={{ padding: "8px 4px" }}>반영이 끝난 제안 {DONE_COUNT}개는 데모에서 목록을 줄였어요.</div>
              )}
              {!showLogout && others.length === 0 && tab !== "반영 완료" && (
                <div className="k-faint" style={{ padding: 24 }}>이 상태의 제안이 없어요.</div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
