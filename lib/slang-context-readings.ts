export type ContextReading = { jyutping: string; kana: string };

const KAN5: ContextReading = { jyutping: 'kan5', kana: 'カン(ヌ)' };
const GAN6: ContextReading = { jyutping: 'gan6', kana: 'ガン(ヌ)' };

// 近は同じ字で読みが変わる。単語「最近」だけでは決めず、後ろの語と日本語で分ける。
// 上から当たったルールを採用する。
//
// kan5（距離・一番近い）
//   最近嘅地鐵站係邊度？ / 好近 / 近便
// gan6（時間・このごろ）
//   我最近好忙 / 最近嘅新聞 / 附近 / 単語の「最近」

const ALWAYS_GAN6 = ['附近', '接近', '近來', '近排', '近日', '近年', '近期', '近況', '近親', '近代'];

const PLACE_AFTER_最近 = [
  '地鐵站', '車站', '巴士站', '小巴站', '便利店', '超市', '商場', '餐廳', '酒樓',
  '酒店', '旅館', '廁所', '醫院', '診所', '學校', '公園', '銀行', '機場', '碼頭',
  '出口', '入口', '路口', '停車場', '電梯', '大門', '門口', '舖頭', '店鋪', '士多',
  '郵局', '警署', '圖書館', '博物館', '戲院', '球場', '泳池', '站', '店', '舖', '鋪',
];

const EVENT_AFTER_最近 = [
  '新聞', '事', '事情', '情況', '天氣', '日子', '消息', '傳聞', '變化', '發展',
  '問題', '工作', '忙',
];

const TIME_AFTER_最近 = /^(我|你|佢|哋|大家|都|有|無|冇|唔|成日|幾日|幾個月|幾年|先|先至|好忙|好閒|好闲)/;
const NEAR_AFTER = /^(便|處|处|到|啲|過|住)/;
const JA_NEAR = /一番近|最寄|いちばん近|いちばんちか|もっと近/;
const JA_RECENT = /最近|このごろ|近頃|この頃|近ごろ/;

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function pick近(chars: string[], index: number, text: string, meaningHint = ''): ContextReading | null {
  const prev = chars[index - 1] || '';
  const after = chars.slice(index + 1, index + 12).join('');

  if (includesAny(text, ALWAYS_GAN6) && ALWAYS_GAN6.some((word) => {
    const offset = word.indexOf('近');
    const start = index - offset;
    return offset >= 0 && start >= 0 && chars.slice(start, start + word.length).join('') === word;
  })) {
    return GAN6;
  }

  if (meaningHint) {
    if (JA_NEAR.test(meaningHint)) return KAN5;
    if (JA_RECENT.test(meaningHint) && !JA_NEAR.test(meaningHint)) return GAN6;
  }

  if (prev === '好') return KAN5;
  if (NEAR_AFTER.test(after) && prev !== '最') return KAN5;

  if (prev === '最') {
    if (/最近去邊度|最近去邊/.test(text)) return GAN6;
    if (/最近[^去]{0,16}(係邊度|喺邊)|邊度最近/.test(text)) return KAN5;
    if (/^[嘅嗰]/.test(after) && includesAny(after, PLACE_AFTER_最近)) return KAN5;
    if (/^[嘅嗰]/.test(after) && includesAny(after, EVENT_AFTER_最近)) return GAN6;
    if (TIME_AFTER_最近.test(after)) return GAN6;
    return GAN6;
  }

  return null;
}

export function pickContextReadings(
  text: string | string[],
  meaningHint = ''
): Map<number, ContextReading> {
  const chars = Array.isArray(text) ? text : Array.from(text.normalize('NFKC'));
  const joined = chars.join('');
  const picked = new Map<number, ContextReading>();

  for (let i = 0; i < chars.length; i += 1) {
    if (chars[i] !== '近') continue;
    const reading = pick近(chars, i, joined, meaningHint);
    if (reading) picked.set(i, reading);
  }

  return picked;
}

function escapeSsml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildContextPhonemeSsml(text: string, meaningHint = '') {
  const chars = Array.from(text.normalize('NFKC'));
  const readings = pickContextReadings(chars, meaningHint);
  return chars
    .map((ch, index) => {
      const escaped = escapeSsml(ch);
      const reading = readings.get(index);
      if (!reading) return escaped;
      return `<phoneme alphabet="jyutping" ph="${escapeSsml(reading.jyutping)}">${escaped}</phoneme>`;
    })
    .join('');
}
