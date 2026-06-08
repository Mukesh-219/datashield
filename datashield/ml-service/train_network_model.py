"""
Train a network-flow based threat classifier using the CICIDS2017 dataset.
Saves: model/network_model.pkl, model/network_scaler.pkl, model/network_features.pkl
"""
from __future__ import annotations

import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

warnings.filterwarnings("ignore")

BASE_DIR   = Path(__file__).resolve().parent
MODEL_DIR  = BASE_DIR / "model"
MODEL_PATH    = MODEL_DIR / "network_model.pkl"
SCALER_PATH   = MODEL_DIR / "network_scaler.pkl"
FEATURES_PATH = MODEL_DIR / "network_features.pkl"
ENCODER_PATH  = MODEL_DIR / "network_label_encoder.pkl"

DATA_FILES = [
    r"C:\Users\mukes\Downloads\archive (1)\Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    r"C:\Users\mukes\Downloads\archive (1)\Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
    r"C:\Users\mukes\Downloads\archive (1)\Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
    r"C:\Users\mukes\Downloads\archive (1)\Friday-WorkingHours-Morning.pcap_ISCX.csv",
    r"C:\Users\mukes\Downloads\archive (1)\Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    r"C:\Users\mukes\Downloads\archive (1)\Tuesday-WorkingHours.pcap_ISCX.csv",
    r"C:\Users\mukes\Downloads\archive (1)\Wednesday-workingHours.pcap_ISCX.csv",
]

# Map raw labels to clean attack categories
LABEL_MAP = {
    "BENIGN":                       "BENIGN",
    "Web Attack \xef\xbf\xbd Brute Force": "BruteForce",
    "Web Attack \xef\xbf\xbd XSS":         "XSS",
    "Web Attack \xef\xbf\xbd Sql Injection":"SQLi",
    "DDoS":                         "DDoS",
    "PortScan":                     "PortScan",
    "Bot":                          "Bot",
    "DoS Hulk":                     "DoS",
    "DoS GoldenEye":                "DoS",
    "DoS slowloris":                "DoS",
    "DoS Slowhttptest":             "DoS",
    "FTP-Patator":                  "BruteForce",
    "SSH-Patator":                  "BruteForce",
    "Infiltration":                 "Infiltration",
    "Heartbleed":                   "Heartbleed",
}

# Max samples per class to keep training balanced and fast
SAMPLES_PER_CLASS = 5000


def load_and_clean(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    df.columns = df.columns.str.strip()
    return df


def map_labels(df: pd.DataFrame) -> pd.DataFrame:
    """Normalise label column, drop unknowns."""
    raw = df["Label"].str.strip()
    # handle mojibake variants of Web Attack labels
    mapped = raw.copy()
    for original, clean in LABEL_MAP.items():
        mapped = mapped.where(raw != original, clean)
    # also catch any remaining "Web Attack" prefix
    mapped = mapped.where(~raw.str.startswith("Web Attack"), mapped.where(
        raw.str.contains("XSS", case=False), "XSS"
    ).where(
        raw.str.contains("Sql", case=False), "SQLi"
    ).where(
        raw.str.contains("Brute", case=False), "BruteForce"
    ))
    df = df.copy()
    df["label"] = mapped
    return df


def select_features(df: pd.DataFrame) -> list[str]:
    """Return numeric feature columns (exclude label)."""
    exclude = {"Label", "label"}
    return [c for c in df.columns if c not in exclude and df[c].dtype in [np.float64, np.int64, float, int]]


def main() -> None:
    print("Loading data files...")
    dfs = []
    for path in DATA_FILES:
        print(f"  Reading {Path(path).name}")
        df = load_and_clean(path)
        df = map_labels(df)
        dfs.append(df)

    combined = pd.concat(dfs, ignore_index=True)
    print(f"\nTotal rows loaded: {len(combined):,}")
    print("\nRaw label distribution:")
    print(combined["label"].value_counts())

    # ---------- feature selection ----------
    feature_cols = select_features(combined)
    print(f"\nFeature columns selected: {len(feature_cols)}")

    combined = combined[feature_cols + ["label"]].copy()

    # Replace inf / -inf with NaN then drop
    combined.replace([np.inf, -np.inf], np.nan, inplace=True)
    before = len(combined)
    combined.dropna(inplace=True)
    print(f"Rows after dropping NaN/Inf: {len(combined):,} (dropped {before - len(combined):,})")

    # ---------- balanced sampling ----------
    print(f"\nBalancing classes (max {SAMPLES_PER_CLASS:,} per class)...")
    parts = []
    for label, group in combined.groupby("label"):
        n = min(len(group), SAMPLES_PER_CLASS)
        parts.append(group.sample(n, random_state=42))
    balanced = pd.concat(parts, ignore_index=True).sample(frac=1, random_state=42)

    print("\nBalanced label distribution:")
    print(balanced["label"].value_counts())

    X = balanced[feature_cols].values.astype(np.float32)
    y_raw = balanced["label"].values

    # ---------- encode labels ----------
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    print(f"\nClasses: {list(le.classes_)}")

    # ---------- train / test split ----------
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain: {len(X_train):,}  |  Test: {len(X_test):,}")

    # ---------- scale ----------
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    # ---------- train ----------
    print("\nTraining Random Forest (n_estimators=200)...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_leaf=2,
        n_jobs=-1,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    # ---------- evaluate ----------
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nTest Accuracy: {acc:.4f} ({acc*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0))

    # Top 10 important features
    importances = model.feature_importances_
    top10_idx = np.argsort(importances)[::-1][:10]
    print("Top 10 feature importances:")
    for i in top10_idx:
        print(f"  {feature_cols[i]:<40} {importances[i]:.4f}")

    # ---------- save ----------
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model,        MODEL_PATH)
    joblib.dump(scaler,       SCALER_PATH)
    joblib.dump(feature_cols, FEATURES_PATH)
    joblib.dump(le,           ENCODER_PATH)

    print(f"\nSaved model      -> {MODEL_PATH}")
    print(f"Saved scaler     -> {SCALER_PATH}")
    print(f"Saved features   -> {FEATURES_PATH}")
    print(f"Saved encoder    -> {ENCODER_PATH}")


if __name__ == "__main__":
    main()
