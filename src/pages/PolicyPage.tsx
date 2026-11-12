import { SquareDashed } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TopGnb } from "@/components/Gnb";
import Crop from "@/knot-app/Crop";
import type { ScreenId } from "@/data/types";
import { useKnotted } from "@/store/useKnotted";
import "./pages.css";

const AREAS: [string, number][] = [["시작하기", 14], ["홈", 22], ["녹음", 31], ["문서 정리", 12], ["문서", 26], ["탐색", 18], ["공통", 15]];

interface Card { title: string; id: string; rules: string[]; proposed?: boolean; shot?: { screen: ScreenId; region: { x: number; y: number; w: number } } }

const CARDS: Card[] = [
  { title: "프로필 메뉴", id: "AUTH-R17", proposed: true, rules: ["상단바 프로필 사진을 누르면 메뉴가 열린다.", "메뉴에는 로그아웃만 둔다. 내 정보 보기는 두지 않는다."], shot: { screen: "profile-menu-open", region: { x: 760, y: 20, w: 680 } } },
  { title: "로그아웃 실패", id: "AUTH-R19", proposed: true, rules: ["실패하면 로그인과 화면을 그대로 두고 토스트로 알린다.", "문구: 로그아웃하지 못했어요. 다시 시도해 주세요."], shot: { screen: "logout-failed", region: { x: 380, y: 720, w: 680 } } },
  { title: "녹음 중 로그아웃", id: "AUTH-R22", proposed: true, rules: ["녹음 중이면 녹음을 끝내고 로그아웃할지 먼저 묻는다.", "다른 곳에서 녹음 중이면 이 브라우저의 녹음만 멈춘다고 알린다."], shot: { screen: "recording-confirm", region: { x: 380, y: 360, w: 680 } } },
  { title: "로그인 만료", id: "ERR-07", rules: ["로그인이 만료되면 로그인 화면으로 보내고 토스트를 띄운다.", "문구: 로그인이 만료됐어요. 다시 로그인해 주세요."] },
  { title: "로그인 실패", id: "ERR-15", rules: ["로그인에 실패해 돌아오면 공통 에러 페이지의 로그인 실패 화면을 보여 준다."] },
];

/** 5-2: 디자인 정책을 영역별 카드로 모은다. 검토 중인 제안이 추가하는 카드는 점선으로 보인다 */
export default function PolicyPage() {
  const [area, setArea] = useState("시작하기");
  const status = useKnotted((s) => s.status);
  const merged = status === "반영 완료";
  const pending = status !== "반영 완료" && status !== "반려";
  const cards = area === "시작하기" ? CARDS.filter((c) => !c.proposed || merged || pending) : [];
  const ref = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(500);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setCw(Math.floor((el.clientWidth - 56 - 16) / 2) - 36);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="page">
      <TopGnb />
      <main className="page-body">
        <section className="k-panel lpanel">
          <div className="k-panel__head lp-head"><span className="lp-title">영역</span></div>
          <div className="k-panel__body" style={{ padding: 8 }}>
            {AREAS.map(([a, n]) => (
              <button key={a} className="lp-item" style={{ paddingLeft: 10 }} data-active={area === a} onClick={() => setArea(a)}>
                {a}{a === "시작하기" && pending && <span className="lp-dot" style={{ marginLeft: "auto", marginRight: 8 }} />}<span className="k-faint" style={{ marginLeft: a === "시작하기" && pending ? 0 : "auto" }}>{n}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="k-panel" style={{ flex: 1 }}>
          <div className="k-panel__body" style={{ padding: 28 }} ref={ref}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
              <span className="ds-title">{area}</span><span className="k-faint">정책 {AREAS.find(([a]) => a === area)?.[1]}</span>
              {pending && <span style={{ marginLeft: "auto", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }} className="k-muted"><SquareDashed size={14} color="var(--selection)" />검토 중인 제안이 추가하는 정책</span>}
            </div>
            {cards.length === 0 ? (
              <div className="k-faint">이 영역의 카드는 데모에 넣지 않았어요. 시작하기 영역을 보세요.</div>
            ) : (
              <div className="policy-grid">
                {cards.map((c) => (
                  <div key={c.id} className="policy-card" data-proposed={!!c.proposed && pending}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <b style={{ fontSize: 16 }}>{c.title}</b><span className="k-chip">{c.id}</span>
                      {c.proposed && pending && <span className="badge-new" style={{ marginLeft: "auto" }}>로그아웃 제안</span>}
                    </div>
                    {c.shot && <Crop screen={c.shot.screen} region={c.shot.region} width={cw} height={Math.round(cw * 0.34)} />}
                    <ul>{c.rules.map((r) => <li key={r}>{r}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
