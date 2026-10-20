import { buildContextPhonemeSsml, pickContextReadings } from '../lib/slang-context-readings';

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

const hangCases: Array<[string, string, string?]> = [
  ['我哋一齊同行', 'hang4'],
  ['同行去旅行', 'hang4'],
  ['佢係我同行', 'hong4'],
  ['同行嘅人', 'hong4'],
  ['做同行', 'hong4'],
  ['同行', 'hang4', '一緒に行って'],
  ['同行', 'hong4', '同業者'],
];

for (const [text, expect, hint] of hangCases) {
  const chars = Array.from(text);
  const index = chars.findIndex((ch, i) => ch === '行' && chars[i - 1] === '同');
  const got = pickContextReadings(text, hint || '').get(index)?.jyutping;
  const ok = got === expect;
  if (!ok) failed += 1;
  console.log(ok ? 'OK' : 'NG', text, '=>', got, 'expected', expect);
}

const ssml = buildContextPhonemeSsml('最近嘅地鐵站係邊度？');
if (!ssml.includes('alphabet="jyutping" ph="kan5"')) {
  failed += 1;
  console.log('NG ssml missing kan5', ssml);
} else {
  console.log('OK ssml', ssml);
}

process.exit(failed === 0 ? 0 : 1);
