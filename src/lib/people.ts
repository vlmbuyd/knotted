/** 아바타 안에 넣을 한 글자. "팀원 A"는 A, "유월"은 유 */
export function initialOf(name: string): string {
  const m = name.match(/팀원 ([A-Z])$/);
  return m ? m[1] : name[0];
}
