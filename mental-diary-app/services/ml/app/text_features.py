from __future__ import annotations

import math
import re
from typing import Iterable


def _avg(values: Iterable[float]) -> float:
    values = list(values)
    if not values:
        return 0.0
    return sum(values) / len(values)


def _slope(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0

    mean_x = _avg(range(len(values)))
    mean_y = _avg(values)
    numerator = sum((index - mean_x) * (value - mean_y) for index, value in enumerate(values))
    denominator = sum((index - mean_x) ** 2 for index in range(len(values)))
    if denominator == 0:
        return 0.0
    return numerator / denominator


def _volatility(values: list[float]) -> float:
    if len(values) < 2:
        return 0.0
    mean = _avg(values)
    variance = _avg((value - mean) ** 2 for value in values)
    return math.sqrt(variance)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _count_hits(text: str, patterns: list[str]) -> int:
    normalized = _normalize(text)
    return sum(1 for pattern in patterns if pattern in normalized)


DEPRESSION_PATTERNS = [
    "пусто", "безнад", "ничего не радует", "нет смысла", "не хочу жить", "не могу дальше", "депресс",
    "empty", "hopeless", "nothing matters", "no point", "numb", "worthless", "depressed"
]
HOPELESSNESS_PATTERNS = [
    "безнад", "не вижу выхода", "нет будущего", "не станет лучше", "всё бессмысленно",
    "no way out", "never gets better", "no future", "meaningless"
]
WITHDRAWAL_PATTERNS = [
    "не хочу ни с кем", "изолир", "закрылся", "один", "избегаю людей",
    "do not want to talk", "isolated", "withdrawn", "avoid people", "shut everyone out"
]
SELF_WORTH_PATTERNS = [
    "обуза", "ненавижу себя", "я никчем", "я лишний", "всё испортил",
    "burden", "hate myself", "worthless", "failure", "ruin everything"
]
SOMATIC_PATTERNS = [
    "нет сил", "тело тяжёлое", "не спал", "не могу встать", "туман в голове", "истощ",
    "exhausted", "drained", "heavy body", "brain fog", "can't get up", "no energy"
]
POSITIVE_PATTERNS = [
    "спокой", "легче", "поддерж", "восстанов", "получилось", "стабиль",
    "calm", "better", "support", "recover", "stable", "managed"
]
INTENSIFIERS = [
    "очень", "слишком", "полностью", "совсем", "крайне", "ужасно",
    "very", "extremely", "totally", "completely", "terribly"
]
RISK_PATTERNS = [
    "тревог", "давит", "стресс", "паник", "перегруз", "дедлайн",
    "anxiety", "stress", "panic", "overwhelmed", "deadline", "pressure"
]


def build_feature_snapshot(entries: list[dict]) -> dict:
    ordered = sorted(entries, key=lambda item: item.get("createdAt") or "")[-14:]
    notes = " ".join((entry.get("notes") or "") for entry in ordered)
    tags = [tag.lower() for entry in ordered for tag in entry.get("tags", [])]
    tag_text = " ".join(tags)
    mood_values = [float(entry.get("moodScore", 0)) for entry in ordered]
    stress_values = [float(entry.get("stress", 0)) for entry in ordered]
    sleep_values = [float(entry.get("sleepHours", 0)) for entry in ordered]
    energy_values = [float(entry.get("energy", 0)) for entry in ordered]

    denominator = max(len(ordered), 1)
    return {
        "averageMood": round(_avg(mood_values), 2),
        "averageEnergy": round(_avg(energy_values), 2),
        "averageSleepHours": round(_avg(sleep_values), 2),
        "averageStress": round(_avg(stress_values), 2),
        "moodTrend": round(_slope(mood_values), 2),
        "stressTrend": round(_slope(stress_values), 2),
        "sleepTrend": round(_slope(sleep_values), 2),
        "noteRiskScore": round(_count_hits(notes, RISK_PATTERNS) / denominator, 2),
        "noteRecoveryScore": round(_count_hits(notes, POSITIVE_PATTERNS) / denominator, 2),
        "tagRiskScore": round(_count_hits(tag_text, RISK_PATTERNS) / max(len(tags), 1), 2),
        "tagRecoveryScore": round(_count_hits(tag_text, POSITIVE_PATTERNS) / max(len(tags), 1), 2),
        "depressiveToneScore": round(_count_hits(notes, DEPRESSION_PATTERNS) / denominator, 2),
        "hopelessnessScore": round(_count_hits(notes, HOPELESSNESS_PATTERNS) / denominator, 2),
        "socialWithdrawalScore": round(_count_hits(notes, WITHDRAWAL_PATTERNS) / denominator, 2),
        "selfWorthRiskScore": round(_count_hits(notes, SELF_WORTH_PATTERNS) / denominator, 2),
        "somaticBurdenScore": round(_count_hits(notes, SOMATIC_PATTERNS) / denominator, 2),
        "emotionalIntensityScore": round(_count_hits(notes, INTENSIFIERS) / denominator, 2),
        "positiveAffectScore": round(_count_hits(notes, POSITIVE_PATTERNS) / denominator, 2),
        "volatilityScore": round((_volatility(mood_values) + _volatility(stress_values) + _volatility(energy_values)) / 3, 2),
    }


def build_text_blob(entries: list[dict]) -> str:
    parts: list[str] = []
    for entry in entries[-14:]:
        parts.append(
            " ".join(
                [
                    str(entry.get("notes") or ""),
                    " ".join(entry.get("tags", [])),
                    f"mood {entry.get('moodScore', 0)} energy {entry.get('energy', 0)} sleep {entry.get('sleepHours', 0)} stress {entry.get('stress', 0)}",
                ]
            )
        )
    return " \n ".join(parts).strip()
