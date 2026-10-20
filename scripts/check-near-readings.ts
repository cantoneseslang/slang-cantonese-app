import { pickContextReadings } from '../lib/slang-context-readings';

const cases: Array<[string, string, string?]> = [
  ['最近嘅地鐵站係邊度？', 'kan5'],
  ['最近嘅便利店', 'kan5'],
  ['我最近好忙', 'gan6'],
  ['最近', 'gan6'],
  ['最近嘅新聞', 'gan6'],
  ['我最近去邊度好呢？', 'gan6'],
  ['好近', 'kan5'],
  ['附近', 'gan6'],
  ['近便', 'kan5'],
  ['最近幾日都好忙', 'gan6'],
  ['最近嘅地鐵站係邊度？', 'kan5', '一番近い地下鉄はどこ？'],
];

let failed = 0;
for (const [text, expect, hint] of cases) {
  const chars = Array.from(text);
  const index = chars.indexOf('近');
  const got = pickContextReadings(text, hint || '').get(index)?.jyutping;
  const ok = got === expect;
  if (!ok) failed += 1;
  console.log(ok ? 'OK' : 'NG', text, '=>', got, 'expected', expect);
}

process.exit(failed === 0 ? 0 : 1);
