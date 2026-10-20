const KANTO_GO_LIKE =
  /関東語|関東ご|かんとう語|カントウ語|カントー語|カントウゴ|カントーゴ|かんとうご/gi;

export function forbidKantoGo(text: string): string {
  if (!text) return text;
  return text.replace(KANTO_GO_LIKE, '広東語');
}
