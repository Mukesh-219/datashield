"""
Full evaluation of the trained payload classifier.
Prints confusion matrix, precision, recall, F1 per class + overall.
Run: python evaluate_model.py
"""
from __future__ import annotations

import pathlib
import joblib
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")          # no GUI needed
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split

from utils.preprocess import preprocess_payload

BASE_DIR        = pathlib.Path(__file__).resolve().parent
DATASET_PATH    = BASE_DIR / "data" / "sample_dataset.csv"
MODEL_PATH      = BASE_DIR / "model" / "threat_model.pkl"
VECTORIZER_PATH = BASE_DIR / "model" / "vectorizer.pkl"
PLOT_PATH       = BASE_DIR / "confusion_matrix.png"

LABELS = ["Normal", "SQLi", "XSS", "Suspicious"]


def load_model():
    model      = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    return model, vectorizer


def load_data():
    df = pd.read_csv(DATASET_PATH)
    df["payload_clean"] = df["payload"].fillna("").astype(str).map(preprocess_payload)
    X = df["payload_clean"]
    y = df["label"].astype(str)
    return X, y


def print_separator(title=""):
    width = 60
    if title:
        pad = (width - len(title) - 2) // 2
        print("=" * pad + f" {title} " + "=" * pad)
    else:
        print("=" * width)


def main():
    print_separator("Loading")
    model, vectorizer = load_model()
    X, y = load_data()
    print(f"Dataset size : {len(y):,}")
    print(f"Classes      : {sorted(y.unique())}")
    print(f"Distribution :\n{y.value_counts().to_string()}")

    # Same split as training for reproducibility
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    X_test_vec = vectorizer.transform(X_test)
    y_pred     = model.predict(X_test_vec)

    # ── Accuracy ────────────────────────────────────────────
    print_separator("Accuracy")
    acc = accuracy_score(y_test, y_pred)
    print(f"Overall Accuracy : {acc:.4f}  ({acc * 100:.2f}%)")

    # ── Per-class Precision / Recall / F1 ───────────────────
    print_separator("Per-Class Metrics")
    report = classification_report(
        y_test, y_pred,
        labels=LABELS,
        zero_division=0,
        digits=4,
    )
    print(report)

    # ── Macro / Weighted averages ───────────────────────────
    print_separator("Aggregate Scores")
    for avg in ["macro", "weighted"]:
        p = precision_score(y_test, y_pred, average=avg, zero_division=0)
        r = recall_score(y_test, y_pred, average=avg, zero_division=0)
        f = f1_score(y_test, y_pred, average=avg, zero_division=0)
        print(f"{avg.capitalize():<10}  Precision={p:.4f}  Recall={r:.4f}  F1={f:.4f}")

    # ── Confusion Matrix (text) ─────────────────────────────
    print_separator("Confusion Matrix")
    present_labels = sorted(y_test.unique())
    cm = confusion_matrix(y_test, y_pred, labels=present_labels)
    header = f"{'':>12}" + "".join(f"{l:>12}" for l in present_labels)
    print(f"{'':>12}" + "".join(f"{'Pred:'+l:>12}" for l in present_labels))
    print(f"{'':>12}" + "-" * (12 * len(present_labels)))
    for i, actual in enumerate(present_labels):
        row = f"{'Act:'+actual:>12}" + "".join(f"{cm[i][j]:>12}" for j in range(len(present_labels)))
        print(row)

    # ── Per-class breakdown ─────────────────────────────────
    print_separator("Per-Class Detail")
    for i, label in enumerate(present_labels):
        tp = cm[i][i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        tn = cm.sum() - tp - fp - fn
        p  = tp / (tp + fp) if (tp + fp) > 0 else 0
        r  = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0
        support = cm[i, :].sum()
        print(f"  {label:<12}  TP={tp:>5}  FP={fp:>5}  FN={fn:>5}  TN={tn:>6}"
              f"  Precision={p:.4f}  Recall={r:.4f}  F1={f1:.4f}  Support={support}")

    # ── Confusion Matrix (heatmap PNG) ──────────────────────
    print_separator("Saving Plot")
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=present_labels,
        yticklabels=present_labels,
        linewidths=0.5,
        ax=ax,
    )
    ax.set_xlabel("Predicted Label", fontsize=12)
    ax.set_ylabel("Actual Label", fontsize=12)
    ax.set_title("DataShield — Payload Classifier Confusion Matrix", fontsize=13, pad=14)
    plt.tight_layout()
    plt.savefig(PLOT_PATH, dpi=150)
    plt.close()
    print(f"Heatmap saved  -> {PLOT_PATH}")
    print_separator()


if __name__ == "__main__":
    main()
