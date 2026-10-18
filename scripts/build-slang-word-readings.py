#!/usr/bin/env python3
"""Build word readings that disagree with the first per-character reading.

words.hk lists a reading for the whole word. The slang dictionary lists
readings per character and the app otherwise uses the first of those.
This keeps a word only when its first words.hk reading, after the stable
spelling differences, matches a reading already stored on every character
and that sequence is not the first-reading sequence. Kana is not copied
here; the page looks it up from slang-dict.json.
"""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DICT_PATH = ROOT / "public" / "slang-dict.json"
OUT_PATH = ROOT / "public" / "slang-word-readings.json"
CSV_PATH = Path(
    "/Users/sakonhiroki/Library/CloudStorage/GoogleDrive-bestinksalesman@gmail.com"
    "/マイドライブ/スラング先生広東語データー/wordslist (2).csv"
)
TONE = re.compile(r"^([a-z]+)([1-6])$")


def similarity(left: str, right: str) -> float:
    shared = set(left) & set(right)
    union = set(left) | set(right)
    return len(shared) / len(union) if union else 0


def spelling_rules(dictionary: dict, rows: list[list[str]]) -> dict[str, str]:
    counts: dict[str, Counter] = defaultdict(Counter)
    for parts in rows:
        if len(parts) < 2 or len(parts[0]) != 1:
            continue
        character = parts[0]
        if not ("\u4e00" <= character <= "\u9fff"):
            continue
        syllables = parts[1].split()
        readings = dictionary.get(character) or []
        if len(syllables) != 1 or not readings:
            continue
        source = TONE.match(syllables[0])
        target = TONE.match(readings[0]["jyutping"])
        if not source or not target or source.group(1) == target.group(1):
            continue
        counts[source.group(1)][target.group(1)] += 1

    rules: dict[str, str] = {}
    for source, counter in counts.items():
        target, hits = counter.most_common(1)[0]
        total = sum(counter.values())
        if hits >= 4 and hits / total >= 0.8 and similarity(source, target) >= 0.45:
            rules[source] = target
    return rules


def convert(syllable: str, rules: dict[str, str]) -> str | None:
    match = TONE.match(syllable)
    if not match:
        return None
    base, tone = match.group(1), match.group(2)
    return rules.get(base, base) + tone


def main() -> None:
    dictionary = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    rows = [
        line.rstrip("\n").split(",")
        for line in CSV_PATH.read_text(encoding="utf-8").splitlines()[1:]
    ]
    rules = spelling_rules(dictionary, rows)
    known = {
        character: {item["jyutping"] for item in readings}
        for character, readings in dictionary.items()
    }
    overrides: dict[str, list[str]] = {}
    for parts in rows:
        if len(parts) < 2:
            continue
        word = parts[0]
        characters = list(word)
        if len(characters) < 2 or not all("\u4e00" <= item <= "\u9fff" for item in characters):
            continue
        if any(item not in known or not known[item] for item in characters):
            continue
        syllables = parts[1].split()
        if len(syllables) != len(characters):
            continue
        converted = [convert(item, rules) for item in syllables]
        if any(item is None for item in converted):
            continue
        if any(converted[index] not in known[characters[index]] for index in range(len(characters))):
            continue
        firsts = [dictionary[item][0]["jyutping"] for item in characters]
        if converted != firsts:
            overrides[word] = converted

    ordered = dict(sorted(overrides.items(), key=lambda item: (-len(item[0]), item[0])))
    OUT_PATH.write_text(
        json.dumps(ordered, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"rules {len(rules)} overrides {len(ordered)} bytes {OUT_PATH.stat().st_size}")
    for sample in ("廁所", "係度", "喺度", "一事無成"):
        print(sample, ordered.get(sample, "(same as first reading or unmatched)"))


if __name__ == "__main__":
    main()
