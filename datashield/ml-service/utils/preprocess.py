from __future__ import annotations

import re


def preprocess_payload(text: str) -> str:
    """Clean payload text before vectorization.

    Steps:
    1. convert to lowercase
    2. trim outer spaces
    3. collapse repeated whitespace
    4. remove null bytes and control chars
    """
    if text is None:
        return ""

    normalized = str(text).lower().strip()

    # Remove null bytes and non-printable control characters.
    normalized = normalized.replace("\x00", "")
    normalized = re.sub(r"[\x01-\x1f\x7f]", " ", normalized)

    # Replace repeated whitespace with a single space.
    normalized = re.sub(r"\s+", " ", normalized)

    return normalized
