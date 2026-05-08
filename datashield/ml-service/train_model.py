from __future__ import annotations

from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

from utils.preprocess import preprocess_payload


BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "data" / "sample_dataset.csv"
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "threat_model.pkl"
VECTORIZER_PATH = MODEL_DIR / "vectorizer.pkl"


def main() -> None:
    """Train a simple payload classification model and save artifacts."""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)

    required_columns = {"payload", "label"}
    if not required_columns.issubset(df.columns):
        raise ValueError("Dataset must contain 'payload' and 'label' columns")

    # Basic text preprocessing for consistent feature extraction.
    df["payload_clean"] = df["payload"].fillna("").astype(str).map(preprocess_payload)

    X = df["payload_clean"]
    y = df["label"].astype(str)

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    X_vectorized = vectorizer.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_vectorized,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"Model accuracy: {accuracy:.4f}")
    print("Classification report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(vectorizer, VECTORIZER_PATH)

    print(f"Saved model to: {MODEL_PATH}")
    print(f"Saved vectorizer to: {VECTORIZER_PATH}")


if __name__ == "__main__":
    main()
