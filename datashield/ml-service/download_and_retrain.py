"""
Downloads Suspicious payloads directly from SecLists raw URLs,
merges with existing datasets, retrains the model.
Run: python download_and_retrain.py
"""
from __future__ import annotations
import csv, pathlib, joblib, time
import urllib.request
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from utils.preprocess import preprocess_payload

BASE_DIR        = pathlib.Path(__file__).resolve().parent
DATASET_DIR     = pathlib.Path(r"C:\Users\mukes\Desktop\Datashield AI platform\Datasets")
OUT_CSV         = BASE_DIR / "data" / "sample_dataset.csv"
SUS_CACHE       = BASE_DIR / "data" / "suspicious_downloaded.txt"
MODEL_DIR       = BASE_DIR / "model"
MODEL_PATH      = MODEL_DIR / "threat_model.pkl"
VECTORIZER_PATH = MODEL_DIR / "vectorizer.pkl"
MAX_PER_CLASS   = 15000

# Raw SecLists URLs for Suspicious payloads
RAW_URLS = [
    ("LFI-Jhaddix",      "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/LFI/LFI-Jhaddix.txt"),
    ("LFI-graceful",     "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/LFI/LFI-graceful-security-linux.txt"),
    ("LFI-win",          "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/LFI/LFI-graceful-security-windows.txt"),
    ("SSTI",             "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/template-engines-expression.txt"),
    ("SSI-Injection",    "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/SSI-Injection-Jhaddix.txt"),
    ("Unix-Attacks",     "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/UnixAttacks.fuzz.txt"),
    ("Polyglots",        "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/Polyglots/command-injection-plus-xss.fuzz.txt"),
    ("SSRF-localhost",   "https://raw.githubusercontent.com/danielmiessler/SecLists/master/SSRF/SSRF-localhost-bypass.txt"),
    ("SSRF-headers",     "https://raw.githubusercontent.com/danielmiessler/SecLists/master/SSRF/SSRF-protocols.txt"),
    ("CMD-unix",         "https://raw.githubusercontent.com/danielmiessler/SecLists/master/Fuzzing/command_injection.txt"),
]

def fetch_url(name, url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            text = r.read().decode("utf-8", errors="ignore")
            lines = [l.strip() for l in text.splitlines() if l.strip() and not l.startswith("#")]
            print(f"  {name:<20} {len(lines):>5} payloads")
            return lines
    except Exception as e:
        print(f"  {name:<20} FAILED: {e}")
        return []

def download_suspicious():
    if SUS_CACHE.exists():
        lines = [l for l in SUS_CACHE.read_text(encoding="utf-8").splitlines() if l.strip()]
        print(f"Loaded {len(lines)} Suspicious payloads from cache")
        return lines

    print("Downloading Suspicious payloads from SecLists...")
    all_lines = []
    for name, url in RAW_URLS:
        lines = fetch_url(name, url)
        all_lines.extend(lines)
        time.sleep(0.3)

    # Deduplicate
    unique = list(dict.fromkeys(all_lines))
    print(f"Total unique Suspicious payloads: {len(unique)}")

    SUS_CACHE.parent.mkdir(parents=True, exist_ok=True)
    SUS_CACHE.write_text("\n".join(unique), encoding="utf-8")
    print(f"Cached -> {SUS_CACHE}")
    return unique

def load_sqli(path, encoding):
    df = pd.read_csv(path, encoding=encoding, on_bad_lines="skip")
    df = df[["Sentence","Label"]].copy()
    df.columns = ["payload","label_raw"]
    df["label_raw"] = pd.to_numeric(df["label_raw"], errors="coerce")
    df = df.dropna(subset=["label_raw","payload"])
    df["label"] = df["label_raw"].apply(lambda x: "SQLi" if int(x)==1 else "Normal")
    return df[["payload","label"]]

def load_sqli_v3(path):
    df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip", usecols=["Sentence","Label"])
    df.columns = ["payload","label_raw"]
    df = df[df["label_raw"].astype(str).str.strip().isin(["0","1"])].copy()
    df["label"] = df["label_raw"].astype(str).str.strip().apply(lambda x: "SQLi" if x=="1" else "Normal")
    return df[["payload","label"]]

def load_xss(path):
    df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
    df = df[["Sentence","Label"]].copy()
    df.columns = ["payload","label_raw"]
    df["label_raw"] = pd.to_numeric(df["label_raw"], errors="coerce")
    df = df.dropna(subset=["label_raw","payload"])
    df["label"] = df["label_raw"].apply(lambda x: "XSS" if int(x)==1 else "Normal")
    return df[["payload","label"]]

def build(sus_lines):
    print("\nLoading existing datasets...")
    d1 = load_sqli(DATASET_DIR/"sqli.csv","utf-16")
    print(f"  sqli.csv        {len(d1):>6}  {dict(d1['label'].value_counts())}")
    d2 = load_sqli(DATASET_DIR/"sqliv2.csv","utf-16")
    print(f"  sqliv2.csv      {len(d2):>6}  {dict(d2['label'].value_counts())}")
    d3 = load_sqli_v3(DATASET_DIR/"SQLiV3.csv")
    print(f"  SQLiV3.csv      {len(d3):>6}  {dict(d3['label'].value_counts())}")
    d4 = load_xss(DATASET_DIR/"XSS_dataset.csv")
    print(f"  XSS_dataset.csv {len(d4):>6}  {dict(d4['label'].value_counts())}")

    sus_df = pd.DataFrame({"payload": sus_lines, "label": "Suspicious"})
    print(f"  Suspicious      {len(sus_df):>6}  (SecLists downloaded)")

    combined = pd.concat([d1,d2,d3,d4,sus_df], ignore_index=True)
    combined["payload"] = combined["payload"].fillna("").astype(str).str.strip()
    combined = combined[combined["payload"].str.len()>0].drop_duplicates(subset=["payload"])

    print(f"\nTotal unique rows: {len(combined):,}")
    print(combined["label"].value_counts())

    parts = []
    for label, group in combined.groupby("label"):
        n = min(len(group), MAX_PER_CLASS)
        parts.append(group.sample(n, random_state=42))
    balanced = pd.concat(parts, ignore_index=True).sample(frac=1, random_state=42)
    print(f"\nBalanced (cap={MAX_PER_CLASS}):")
    print(balanced["label"].value_counts())
    return balanced

def save(df):
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df[["payload","label"]].to_csv(OUT_CSV, index=False, quoting=csv.QUOTE_ALL)
    print(f"\nSaved dataset -> {OUT_CSV}  ({len(df):,} rows)")

def train(df):
    df = df.copy()
    df["payload_clean"] = df["payload"].map(preprocess_payload)
    X, y = df["payload_clean"], df["label"].astype(str)

    vectorizer = TfidfVectorizer(
        analyzer="char_wb", ngram_range=(2,5),
        min_df=2, max_features=50000, sublinear_tf=True)
    model = RandomForestClassifier(
        n_estimators=300, class_weight="balanced",
        n_jobs=-1, random_state=42)
    pipe = Pipeline([("tfidf",vectorizer),("clf",model)])

    print("\n5-fold CV...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(pipe, X, y, cv=cv, scoring="accuracy", n_jobs=-1)
    print(f"CV Accuracy : {scores.mean():.4f}  (+/- {scores.std():.4f})")
    print(f"Per-fold    : {[round(s,4) for s in scores]}")

    X_train,X_test,y_train,y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)
    print("\nFitting final model...")
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nHold-out Accuracy : {acc:.4f}  ({acc*100:.2f}%)")
    print(classification_report(y_test, y_pred, zero_division=0))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe.named_steps["clf"],   MODEL_PATH)
    joblib.dump(pipe.named_steps["tfidf"], VECTORIZER_PATH)
    print(f"Saved model      -> {MODEL_PATH}")
    print(f"Saved vectorizer -> {VECTORIZER_PATH}")

if __name__ == "__main__":
    sus = download_suspicious()
    df  = build(sus)
    save(df)
    train(df)