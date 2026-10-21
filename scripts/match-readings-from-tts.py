#!/usr/bin/env python3
"""Pick a character's spoken reading by matching Google TTS audio.

Gold = characters only, no <phoneme>.
Probe = same sentence with one character forced to each dictionary reading.
The closest probe is the reading Google actually spoke.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import urllib.request
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DICT_PATH = ROOT / "public" / "slang-dict.json"
CACHE_DIR = Path("/tmp/slang-tts-readings-cache")
TONE = re.compile(r"^[a-z]+[1-6]$")
TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize?key={key}"

# 文で読みが分かれる字。先頭入れ替え対象にしない。
CONTEXT_CHARS = set("近行")
SCAN_CHARS = "識清聽講得長樂中好教還正重為看說會處量少要覺調過差便倒散數朝空種著乾傳"
VERIFY_CHARS = "食身過打可紅石屎戲神教還的區內來去足幾錯果北票費"
WORDLIST_PATH = Path(
    "/Users/sakonhiroki/Library/CloudStorage/GoogleDrive-bestinksalesman@gmail.com"
    "/マイドライブ/スラング先生広東語データー/wordslist (2).csv"
)

CASES: list[tuple[str, int, str]] = [
    ("識", 0, "sik1"),
    ("我唔識講日文", 2, "sik1"),
    ("你識唔識講廣東話", 1, "sik1"),
    ("知識", 1, "sik1"),
    ("我", 0, "ngo5"),
    ("我聽得清楚", 0, "ngo5"),
    ("最近嘅地鐵站係邊度？", 1, "kan5"),
    ("我最近好忙", 2, "gan6"),
    ("好近", 1, "kan5"),
    ("附近", 1, "gan6"),
    ("我聽得清楚", 1, "teng1"),
    ("我聽得清楚", 3, "cing1"),
    ("近", 0, "gan6"),
    ("清", 0, "cing1"),
    ("行", 0, "hang4"),
    ("我哋一齊同行", 5, "hang4"),
    ("同行去旅行", 1, "hang4"),
    ("佢係我同行", 4, "hong4"),
    ("同行嘅人", 1, "hong4"),
]


def load_env_files() -> None:
    for path in (
        ROOT / ".env.local",
        ROOT / ".env.tts.local",
        Path("/tmp/slang-tts.env"),
    ):
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'\"")
            if key and value and key not in os.environ:
                os.environ[key] = value


def escape_ssml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def synthesize(key: str, ssml_body: str) -> bytes:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = CACHE_DIR / f"{abs(hash(ssml_body))}.pcm"
    if cache.exists() and cache.stat().st_size > 0:
        return cache.read_bytes()
    payload = json.dumps(
        {
            "input": {"ssml": f"<speak>{ssml_body}</speak>"},
            "voice": {"languageCode": "yue-Hant-HK", "ssmlGender": "NEUTRAL"},
            "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 24000},
        }
    ).encode()
    request = urllib.request.Request(
        TTS_URL.format(key=key),
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        body = json.loads(response.read().decode())
    audio = __import__("base64").b64decode(body["audioContent"])
    cache.write_bytes(audio)
    return audio


def pcm_to_wave(data: bytes) -> np.ndarray:
    wave = np.frombuffer(data, dtype="<i2").astype(np.float32)
    if wave.size == 0:
        return wave
    wave /= 32768.0
    energy = np.convolve(wave * wave, np.ones(240) / 240, mode="same")
    voiced = energy > (energy.max() * 0.02)
    if not voiced.any():
        return wave
    start, end = int(np.argmax(voiced)), int(len(voiced) - np.argmax(voiced[::-1]))
    return wave[start:end]


def logspec(wave: np.ndarray, nfft: int = 512, hop: int = 256) -> np.ndarray:
    if wave.size < nfft:
        wave = np.pad(wave, (0, nfft - wave.size))
    window = np.hanning(nfft)
    frames = []
    for index in range(0, wave.size - nfft + 1, hop):
        spectrum = np.abs(np.fft.rfft(wave[index : index + nfft] * window))
        frames.append(np.log(spectrum + 1e-6))
    return np.asarray(frames, dtype=np.float32)


def cosine(left: np.ndarray, right: np.ndarray) -> float:
    length = min(len(left), len(right))
    if length == 0:
        return -1.0
    a = left[:length].ravel()
    b = right[:length].ravel()
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return -1.0
    return float(np.dot(a, b) / denom)


def gold_ssml(text: str) -> str:
    return "".join(escape_ssml(ch) for ch in text)


def probe_ssml(text: str, index: int, jyutping: str) -> str:
    parts = []
    for pos, ch in enumerate(text):
        escaped = escape_ssml(ch)
        if pos == index:
            parts.append(
                f'<phoneme alphabet="jyutping" ph="{escape_ssml(jyutping)}">{escaped}</phoneme>'
            )
        else:
            parts.append(escaped)
    return "".join(parts)


def match_case(
    key: str,
    dictionary: dict,
    text: str,
    index: int,
) -> dict:
    char = text[index]
    candidates = [
        item["jyutping"]
        for item in dictionary.get(char, [])
        if TONE.match(item["jyutping"])
    ]
    candidates = list(dict.fromkeys(candidates))
    gold = logspec(pcm_to_wave(synthesize(key, gold_ssml(text))))
    scores = []
    for jyutping in candidates:
        probe = logspec(pcm_to_wave(synthesize(key, probe_ssml(text, index, jyutping))))
        scores.append((jyutping, cosine(gold, probe)))
    scores.sort(key=lambda item: item[1], reverse=True)
    winner = scores[0][0] if scores else ""
    margin = (scores[0][1] - scores[1][1]) if len(scores) > 1 else 1.0
    return {
        "text": text,
        "char": char,
        "index": index,
        "winner": winner,
        "margin": round(margin, 4),
        "scores": [(jyutping, round(score, 4)) for jyutping, score in scores],
    }


def is_ng_drop(first: str, top: str) -> bool:
    if first.startswith("ng") and (top == first[2:] or top == f"n{first[2:]}"):
        return True
    return False


def majority_firsts(dictionary: dict) -> dict[str, str]:
    from collections import Counter, defaultdict

    votes: dict[str, Counter] = defaultdict(Counter)
    for line in WORDLIST_PATH.read_text(encoding="utf-8").splitlines()[1:]:
        parts = line.split(",")
        if len(parts) < 2:
            continue
        chars = list(parts[0])
        for raw in parts[1:]:
            syllables = raw.strip().split()
            if len(syllables) != len(chars) or not all(TONE.match(item) for item in syllables):
                continue
            for char, syllable in zip(chars, syllables):
                votes[char][syllable] += 1
            break
    winners = {}
    for char, counter in votes.items():
        items = dictionary.get(char) or []
        known = {item["jyutping"] for item in items}
        if len(known) < 2 or char in CONTEXT_CHARS:
            continue
        first = items[0]["jyutping"]
        top, count = counter.most_common(1)[0]
        total = sum(counter.values())
        if top == first or top not in known or total < 8 or count / total < 0.9:
            continue
        if is_ng_drop(first, top):
            continue
        winners[char] = top
    return winners


def apply_first_readings(dictionary: dict, winners: dict[str, str]) -> int:
    changed = 0
    for char, jyutping in winners.items():
        if char in CONTEXT_CHARS:
            continue
        items = dictionary.get(char) or []
        if not items or items[0]["jyutping"] == jyutping:
            continue
        hit = next((item for item in items if item["jyutping"] == jyutping), None)
        if not hit:
            continue
        dictionary[char] = [hit] + [item for item in items if item["jyutping"] != jyutping]
        changed += 1
    if changed:
        DICT_PATH.write_text(
            json.dumps(dictionary, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    return changed


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply-first", action="store_true")
    parser.add_argument("--scan-isolated", action="store_true")
    parser.add_argument("--apply-majority", action="store_true")
    parser.add_argument("--verify-everyday", action="store_true")
    parser.add_argument("--skip-cases", action="store_true")
    args = parser.parse_args()
    load_env_files()
    key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not key:
        raise SystemExit("GOOGLE_API_KEY is missing")

    dictionary = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    votes: dict[str, list[str]] = {}
    failed = 0
    if args.apply_majority:
        majority = majority_firsts(dictionary)
        for char, jyutping in majority.items():
            print("MAJ", char, dictionary[char][0]["jyutping"], "->", jyutping)
        if args.apply_first:
            print(f"applied {apply_first_readings(dictionary, majority)}")
            dictionary = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    if args.verify_everyday:
        for char in VERIFY_CHARS:
            items = dictionary.get(char) or []
            if not items:
                continue
            result = match_case(key, dictionary, char, 0)
            print(
                "VER",
                char,
                "first",
                items[0]["jyutping"],
                "tts",
                result["winner"],
                "margin",
                result["margin"],
                result["scores"],
            )
    if args.skip_cases:
        raise SystemExit(0)
    for text, index, expect in CASES:
        result = match_case(key, dictionary, text, index)
        uncertain = result["margin"] < 0.05
        if not uncertain:
            votes.setdefault(result["char"], []).append(result["winner"])
        ok = result["winner"] == expect
        failed += 0 if ok or uncertain else 1
        print(
            ("UN" if uncertain else "OK" if ok else "NG"),
            result["text"],
            result["char"],
            "=>",
            result["winner"],
            "expected",
            expect,
            "margin",
            result["margin"],
            result["scores"],
        )

    firsts = {}
    for char, picked in votes.items():
        if char in CONTEXT_CHARS:
            continue
        winner = max(set(picked), key=picked.count)
        if picked.count(winner) == len(picked) and winner:
            firsts[char] = winner
            print("FIRST", char, dictionary[char][0]["jyutping"], "->", winner)

    if args.scan_isolated:
        for char in SCAN_CHARS:
            items = dictionary.get(char) or []
            readings = list(dict.fromkeys(item["jyutping"] for item in items if TONE.match(item["jyutping"])))
            if len(readings) < 2 or char in CONTEXT_CHARS:
                continue
            result = match_case(key, dictionary, char, 0)
            current = items[0]["jyutping"]
            flag = "SWAP" if result["winner"] != current and result["margin"] >= 0.08 else "keep"
            print(
                flag,
                char,
                current,
                "=>",
                result["winner"],
                "margin",
                result["margin"],
                result["scores"],
            )
            if flag == "SWAP":
                firsts[char] = result["winner"]

    if args.apply_first:
        changed = apply_first_readings(dictionary, firsts)
        print(f"applied {changed}")

    raise SystemExit(1 if failed else 0)


if __name__ == "__main__":
    main()
