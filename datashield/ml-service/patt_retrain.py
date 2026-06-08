"""
Downloads payloads from PayloadsAllTheThings (PATT) + existing SecLists cache,
merges everything, retrains and evaluates the model.
Run: python patt_retrain.py
"""
from __future__ import annotations
import csv, pathlib, joblib, time, re
import urllib.request
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (accuracy_score, classification_report,
                              confusion_matrix, f1_score, precision_score, recall_score)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from utils.preprocess import preprocess_payload

BASE_DIR        = pathlib.Path(__file__).resolve().parent
DATASET_DIR     = pathlib.Path(r"C:\Users\mukes\Desktop\Datashield AI platform\Datasets")
OUT_CSV         = BASE_DIR / "data" / "sample_dataset.csv"
SUS_CACHE       = BASE_DIR / "data" / "suspicious_downloaded.txt"
PATT_CACHE      = BASE_DIR / "data" / "patt_payloads.txt"
MODEL_DIR       = BASE_DIR / "model"
MODEL_PATH      = MODEL_DIR / "threat_model.pkl"
VECTORIZER_PATH = MODEL_DIR / "vectorizer.pkl"
MAX_PER_CLASS   = 15000

BASE_RAW = "https://raw.githubusercontent.com/swisskyrepo/PayloadsAllTheThings/master"

# (label, name, raw_url)
PATT_SOURCES = [
    # ── Suspicious: File Inclusion / LFI ──────────────────────────────────
    ("Suspicious", "LFI-JHADDIX",    f"{BASE_RAW}/File%20Inclusion/Intruders/JHADDIX_LFI.txt"),
    ("Suspicious", "LFI-Windows",    f"{BASE_RAW}/File%20Inclusion/Intruders/Windows-files.txt"),
    ("Suspicious", "LFI-FD-check",   f"{BASE_RAW}/File%20Inclusion/Intruders/LFI-FD-check.txt"),
    ("Suspicious", "LFI-linux",      f"{BASE_RAW}/File%20Inclusion/Intruders/Linux-files.txt"),
    # ── Suspicious: SSTI ──────────────────────────────────────────────────
    ("Suspicious", "SSTI-fuzz",      f"{BASE_RAW}/Server%20Side%20Template%20Injection/Intruder/ssti.fuzz"),
    # ── Suspicious: Directory Traversal ───────────────────────────────────
    ("Suspicious", "DirTraversal",   f"{BASE_RAW}/Directory%20Traversal/Intruder/directory_traversal.txt"),
    ("Suspicious", "DirTrav-dotdot", f"{BASE_RAW}/Directory%20Traversal/Intruder/dotdotpwn.txt"),
    # ── Suspicious: Command Injection ─────────────────────────────────────
    ("Suspicious", "CMD-Unix",       f"{BASE_RAW}/Command%20Injection/Intruder/command-execution-unix.txt"),
    ("Suspicious", "CMD-Windows",    f"{BASE_RAW}/Command%20Injection/Intruder/command-execution-windows.txt"),
    # ── Suspicious: SSRF ──────────────────────────────────────────────────
    ("Suspicious", "SSRF-bypasses",  f"{BASE_RAW}/SSRF%20Injection/Intruder/SSRF-bypasses.txt"),
    ("Suspicious", "SSRF-ips",       f"{BASE_RAW}/SSRF%20Injection/Intruder/SSRF-ips.txt"),
    # ── Suspicious: Open Redirect ─────────────────────────────────────────
    ("Suspicious", "OpenRedirect",   f"{BASE_RAW}/Open%20Redirect/Intruder/open_redirect.txt"),
    # ── Suspicious: XXE ───────────────────────────────────────────────────
    ("Suspicious", "XXE-fuzzing",    f"{BASE_RAW}/XXE%20Injection/Intruder/XXE-Fuzzing.txt"),
    # ── XSS: extra intruder lists ─────────────────────────────────────────
    ("XSS",        "XSS-Jhaddix",    f"{BASE_RAW}/XSS%20Injection/Intruder/XSS-Jhaddix.txt"),
    ("XSS",        "XSS-bypass",     f"{BASE_RAW}/XSS%20Injection/Intruder/XSS-Bypass-Filters-Raw.txt"),
    ("XSS",        "XSS-polyglot",   f"{BASE_RAW}/XSS%20Injection/Intruder/XSS_Polyglots.txt"),
    # ── SQLi: extra intruder lists ────────────────────────────────────────
    ("SQLi",       "SQLi-intruder",  f"{BASE_RAW}/SQL%20Injection/Intruder/SQL-Injection.txt"),
    ("SQLi",       "SQLi-auth-bypass",f"{BASE_RAW}/SQL%20Injection/Intruder/Authentication_Bypass.txt"),
    ("SQLi",       "SQLi-MSSQL",     f"{BASE_RAW}/SQL%20Injection/Intruder/MSSQL.txt"),
    ("SQLi",       "SQLi-MySQL",     f"{BASE_RAW}/SQL%20Injection/Intruder/MySQL.txt"),
    ("SQLi",       "SQLi-PostgreSQL",f"{BASE_RAW}/SQL%20Injection/Intruder/PostgreSQL.txt"),
    ("SQLi",       "SQLi-Oracle",    f"{BASE_RAW}/SQL%20Injection/Intruder/Oracle.txt"),
]

def fetch(name, url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            text = r.read().decode("utf-8", errors="ignore")
            lines = [l.strip() for l in text.splitlines()
                     if l.strip() and not l.startswith("#")]
            print(f"    {name:<22} {len(lines):>5} payloads")
            return lines
    except Exception as e:
        print(f"    {name:<22} FAILED ({e})")
        return []

def download_patt():
    if PATT_CACHE.exists():
        rows = []
        for line in PATT_CACHE.read_text(encoding="utf-8").splitlines():
            if "|" in line:
                parts = line.split("|", 1)
                rows.append((parts[1].strip(), parts[0].strip()))
        print(f"Loaded {len(rows)} PATT payloads from cache")
        return rows

    print("Downloading PayloadsAllTheThings...")
    rows = []
    for label, name, url in PATT_SOURCES:
        lines = fetch(name, url)
        for l in lines:
            rows.append((l, label))
        time.sleep(0.25)

    # deduplicate per label
    seen = set()
    unique = []
    for payload, label in rows:
        key = (payload.strip(), label)
        if key not in seen and payload.strip():
            seen.add(key)
            unique.append(key)

    PATT_CACHE.parent.mkdir(parents=True, exist_ok=True)
    with open(PATT_CACHE, "w", encoding="utf-8") as f:
        for payload, label in unique:
            f.write(f"{label}|{payload}\n")

    print(f"Total PATT unique payloads: {len(unique)}")
    from collections import Counter
    print(Counter(label for _, label in unique))
    print(f"Cached -> {PATT_CACHE}")
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
    df["label"] = df["label_raw"].astype(str).str.strip().apply(
        lambda x: "SQLi" if x=="1" else "Normal")
    return df[["payload","label"]]

def load_xss(path):
    df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
    df = df[["Sentence","Label"]].copy()
    df.columns = ["payload","label_raw"]
    df["label_raw"] = pd.to_numeric(df["label_raw"], errors="coerce")
    df = df.dropna(subset=["label_raw","payload"])
    df["label"] = df["label_raw"].apply(lambda x: "XSS" if int(x)==1 else "Normal")
    return df[["payload","label"]]

def load_seclists_cache():
    if not SUS_CACHE.exists():
        return []
    lines = [l.strip() for l in SUS_CACHE.read_text(encoding="utf-8").splitlines() if l.strip()]
    print(f"SecLists cache: {len(lines)} Suspicious payloads")
    return lines

def build(patt_rows, seclists_sus):
    print("\nLoading Kaggle datasets...")
    d1 = load_sqli(DATASET_DIR/"sqli.csv","utf-16")
    print(f"  sqli.csv        {len(d1):>6}  {dict(d1['label'].value_counts())}")
    d2 = load_sqli(DATASET_DIR/"sqliv2.csv","utf-16")
    print(f"  sqliv2.csv      {len(d2):>6}  {dict(d2['label'].value_counts())}")
    d3 = load_sqli_v3(DATASET_DIR/"SQLiV3.csv")
    print(f"  SQLiV3.csv      {len(d3):>6}  {dict(d3['label'].value_counts())}")
    d4 = load_xss(DATASET_DIR/"XSS_dataset.csv")
    print(f"  XSS_dataset.csv {len(d4):>6}  {dict(d4['label'].value_counts())}")

    # SecLists Suspicious
    sus_df = pd.DataFrame({"payload": seclists_sus, "label": "Suspicious"})

    # PATT rows — already (payload, label) tuples
    patt_df = pd.DataFrame(patt_rows, columns=["payload","label"])
    print(f"\nPATT payloads:    {len(patt_df):>6}  {dict(patt_df['label'].value_counts())}")

    combined = pd.concat([d1,d2,d3,d4,sus_df,patt_df], ignore_index=True)
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
    print(f"\nSaved -> {OUT_CSV}  ({len(df):,} rows)")

def train(df):
    df = df.copy()
    df["payload_clean"] = df["payload"].map(preprocess_payload)
    X, y = df["payload_clean"], df["label"].astype(str)

    vectorizer = TfidfVectorizer(
        analyzer="char_wb", ngram_range=(2,5),
        min_df=2, max_features=60000, sublinear_tf=True)
    model = RandomForestClassifier(
        n_estimators=400, class_weight="balanced",
        min_samples_leaf=1, n_jobs=-1, random_state=42)
    pipe = Pipeline([("tfidf",vectorizer),("clf",model)])

    print("\n5-fold CV...")
    from sklearn.model_selection import StratifiedKFold, cross_val_score
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

    # Confusion matrix
    labels = sorted(y_test.unique())
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    print("Confusion Matrix:")
    header = f"{'':>14}" + "".join(f"{'P:'+l:>14}" for l in labels)
    print(header)
    for i, actual in enumerate(labels):
        row = f"{'A:'+actual:>14}" + "".join(f"{cm[i][j]:>14}" for j in range(len(labels)))
        print(row)

    # Per-class detail
    print("\nPer-Class Detail:")
    for i, label in enumerate(labels):
        tp = cm[i][i]
        fp = int(cm[:,i].sum()) - tp
        fn = int(cm[i,:].sum()) - tp
        p  = tp/(tp+fp) if (tp+fp)>0 else 0
        r  = tp/(tp+fn) if (tp+fn)>0 else 0
        f1 = 2*p*r/(p+r) if (p+r)>0 else 0
        print(f"  {label:<14} TP={tp:>5} FP={fp:>5} FN={fn:>5}  "
              f"P={p:.4f}  R={r:.4f}  F1={f1:.4f}")

    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    w_f1     = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    print(f"\nMacro F1={macro_f1:.4f}  Weighted F1={w_f1:.4f}")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe.named_steps["clf"],   MODEL_PATH)
    joblib.dump(pipe.named_steps["tfidf"], VECTORIZER_PATH)
    print(f"\nSaved model      -> {MODEL_PATH}")
    print(f"Saved vectorizer -> {VECTORIZER_PATH}")

if __name__ == "__main__":
    patt_rows   = download_patt()
    seclists    = load_seclists_cache()
    df          = build(patt_rows, seclists)
    save(df)
    train(df)