from __future__ import annotations
from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.utils.class_weight import compute_class_weight
import numpy as np
from utils.preprocess import preprocess_payload

BASE_DIR       = Path(__file__).resolve().parent
DATASET_PATH   = BASE_DIR / "data" / "sample_dataset.csv"
MODEL_DIR      = BASE_DIR / "model"
MODEL_PATH     = MODEL_DIR / "threat_model.pkl"
VECTORIZER_PATH= MODEL_DIR / "vectorizer.pkl"

def main():
    df = pd.read_csv(DATASET_PATH)
    df["payload_clean"] = df["payload"].fillna("").astype(str).map(preprocess_payload)
    X = df["payload_clean"]
    y = df["label"].astype(str)

    print(f"Dataset: {len(df)} rows")
    print("Class distribution:")
    print(y.value_counts())

    # char n-gram TF-IDF captures patterns like OR, SELECT, alert regardless of spacing
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 5),
        min_df=1,
        max_features=20000,
        sublinear_tf=True,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=None,
        min_samples_leaf=1,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
    )

    # 5-fold stratified cross-validation
    pipeline = Pipeline([("tfidf", vectorizer), ("clf", model)])
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=cv, scoring="accuracy", n_jobs=-1)
    print(f"\n5-Fold CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    print(f"Per-fold: {[round(s,4) for s in cv_scores]}")

    # Final train/test split for classification report
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nHold-out Test Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # Save artifacts
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    final_vectorizer = pipeline.named_steps["tfidf"]
    final_model      = pipeline.named_steps["clf"]
    joblib.dump(final_model,      MODEL_PATH)
    joblib.dump(final_vectorizer, VECTORIZER_PATH)
    print(f"Saved model      -> {MODEL_PATH}")
    print(f"Saved vectorizer -> {VECTORIZER_PATH}")

if __name__ == "__main__":
    main()