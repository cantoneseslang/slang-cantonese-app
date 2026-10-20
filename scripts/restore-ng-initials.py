#!/usr/bin/env python3
"""Restore ng- initials that slang-dict rewrote as n- / nng-.

google_drive_data.csv keeps 我 as ngo5. The display dictionary dropped the g
(ngo5 → no5) and then looked up kana for "no" (ノー). This puts the ng back
only when the CSV still has that ng reading for the same character.
"""

from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DICT_PATH = ROOT / "public" / "slang-dict.json"
WORD_PATH = ROOT / "public" / "slang-word-readings.json"
CSV_PATH = ROOT / "public" / "google_drive_data.csv"
KANA_PATH = ROOT / "public" / "katakana_conversion_data.csv"
TONE = re.compile(r"^([a-z]+)([1-6])$")


def ng_form(jyutping: str) -> str | None:
    match = TONE.match(jyutping)
    if not match:
        return None
    base, tone = match.group(1), match.group(2)
    if base.startswith("nng"):
        return f"ng{base[3:]}{tone}"
    if base.startswith("n") and not base.startswith("ng"):
        return f"ng{base[1:]}{tone}"
    return None


def load_csv_readings() -> dict[str, set[str]]:
    readings: dict[str, set[str]] = defaultdict(set)
    with CSV_PATH.open(encoding="utf-8") as handle:
        for row in csv.DictReader(handle, delimiter="\t"):
            char, jyutping = row.get("CH"), row.get("JP")
            if char and jyutping:
                readings[char].add(jyutping)
    return readings


def main() -> None:
    dictionary = json.loads(DICT_PATH.read_text(encoding="utf-8"))
    words = json.loads(WORD_PATH.read_text(encoding="utf-8"))
    kana = json.loads(KANA_PATH.read_text(encoding="utf-8"))
    csv_readings = load_csv_readings()
    restored: dict[str, list[tuple[str, str]]] = {}

    for char, items in dictionary.items():
        source = csv_readings.get(char)
        if not items or not source:
            continue
        changed: list[tuple[str, str]] = []
        next_items = []
        for item in items:
            old = item["jyutping"]
            guessed = ng_form(old)
            if not guessed or guessed not in source:
                next_items.append(item)
                continue
            base = TONE.match(guessed).group(1)
            next_items.append({"jyutping": guessed, "kana": kana[base]})
            changed.append((old, guessed))
        if changed:
            dictionary[char] = next_items
            restored[char] = changed

    word_hits = 0
    for word, syllables in words.items():
        chars = list(word)
        if len(chars) != len(syllables):
            continue
        updated = list(syllables)
        for index, char in enumerate(chars):
            for old, new in restored.get(char, []):
                if updated[index] == old:
                    updated[index] = new
                    word_hits += 1
        words[word] = updated

    DICT_PATH.write_text(
        json.dumps(dictionary, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    WORD_PATH.write_text(
        json.dumps(words, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    sample = "我牙眼牛五吾鵝餓臥危外誤伍"
    print(f"chars {len(restored)} readings {sum(len(v) for v in restored.values())} word-syllables {word_hits}")
    for char in sample:
        print(char, dictionary.get(char))
    assert dictionary["我"][0]["jyutping"] == "ngo5"
    assert dictionary["我"][0]["kana"] == "ンォー"
    assert not any(
        item["jyutping"].startswith(("no", "nng", "naa", "nau", "nai"))
        and item["jyutping"] == "no5"
        for item in dictionary["我"]
    )
    print("ok")


if __name__ == "__main__":
    main()
