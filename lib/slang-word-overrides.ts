export type WordOverride = { jyutping: string; kana: string };

// 単語帳に無い語と、辞書のカタカナ表記を単語のときだけ変えたい語を書く。
// 読みの選択（どの粤ピンを使うか）は public/slang-word-readings.json が単語帳から作る。
// ここにある単語は、同じ長さなら単語帳より優先する。キーの文字数と配列の長さを同じにする。
// 同じ漢字でも文で読みが変わる語（最近 gan6 / kan5）は slang-context-readings.ts。
export const slangWordOverrides: Record<string, WordOverride[]> = {
  廁所: [
    { jyutping: 'ci3', kana: 'チー' },
    { jyutping: 'so2', kana: 'ソー' },
  ],
  係度: [
    { jyutping: 'hai6', kana: 'ハイ' },
    { jyutping: 'dou6', kana: 'ドウ' },
  ],
};
