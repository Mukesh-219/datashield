from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
from flask import Flask, jsonify, request

from utils.preprocess import preprocess_payload


BASE_DIR = Path(__file__).resolve().parent

# ── Payload text model (TF-IDF + Random Forest) ──────────────────────────────
MODEL_PATH      = BASE_DIR / "model" / "threat_model.pkl"
VECTORIZER_PATH = BASE_DIR / "model" / "vectorizer.pkl"

# ── Network flow model (CICIDS2017 dataset) ───────────────────────────────────
NET_MODEL_PATH    = BASE_DIR / "model" / "network_model.pkl"
NET_SCALER_PATH   = BASE_DIR / "model" / "network_scaler.pkl"
NET_FEATURES_PATH = BASE_DIR / "model" / "network_features.pkl"
NET_ENCODER_PATH  = BASE_DIR / "model" / "network_label_encoder.pkl"

app = Flask(__name__)


def load_artifacts():
    """Load payload model and vectorizer once at startup."""
    if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
        raise FileNotFoundError(
            "Payload model files are missing. Run 'python train_model.py' first."
        )
    model      = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    return model, vectorizer


def load_network_artifacts():
    """Load network flow model artifacts once at startup."""
    if not all(p.exists() for p in [NET_MODEL_PATH, NET_SCALER_PATH, NET_FEATURES_PATH, NET_ENCODER_PATH]):
        raise FileNotFoundError(
            "Network model files are missing. Run 'python train_network_model.py' first."
        )
    model        = joblib.load(NET_MODEL_PATH)
    scaler       = joblib.load(NET_SCALER_PATH)
    feature_cols = joblib.load(NET_FEATURES_PATH)
    encoder      = joblib.load(NET_ENCODER_PATH)
    return model, scaler, feature_cols, encoder


try:
    MODEL, VECTORIZER = load_artifacts()
except Exception as exc:
    MODEL = None
    VECTORIZER = None
    STARTUP_ERROR = str(exc)
else:
    STARTUP_ERROR = None

try:
    NET_MODEL, NET_SCALER, NET_FEATURES, NET_ENCODER = load_network_artifacts()
except Exception as exc:
    NET_MODEL = None
    NET_SCALER = None
    NET_FEATURES = None
    NET_ENCODER = None
    NET_STARTUP_ERROR = str(exc)
else:
    NET_STARTUP_ERROR = None


@app.get("/health")
def health_check():
    """Simple health endpoint for service monitoring."""
    return jsonify(
        {
            "success": True,
            "service": "DataShield ML Service",
            "modelLoaded": MODEL is not None and VECTORIZER is not None,
            "networkModelLoaded": NET_MODEL is not None,
            "error": STARTUP_ERROR,
            "networkError": NET_STARTUP_ERROR,
        }
    ), 200


@app.post("/predict")
def predict_threat():
    """Predict payload class and confidence score."""
    try:
        if MODEL is None or VECTORIZER is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Model is not loaded. Train model and restart service.",
                    }
                ),
                500,
            )

        data = request.get_json(silent=True) or {}
        payload = data.get("payload", "")

        if not isinstance(payload, str) or not payload.strip():
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "payload is required and must be a non-empty string",
                    }
                ),
                400,
            )

        cleaned_payload = preprocess_payload(payload)
        payload_vector = VECTORIZER.transform([cleaned_payload])

        prediction = MODEL.predict(payload_vector)[0]
        probabilities = MODEL.predict_proba(payload_vector)[0]
        confidence = float(max(probabilities))

        return (
            jsonify(
                {
                    "success": True,
                    "prediction": prediction,
                    "confidence": round(confidence, 2),
                }
            ),
            200,
        )
    except Exception as exc:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Prediction failed",
                    "error": str(exc),
                }
            ),
            500,
        )


@app.post("/predict/network")
def predict_network_threat():
    """Classify network flow data using the CICIDS2017-trained model.

    Expects a JSON body with numeric flow features matching the training columns.
    Any missing features are filled with 0.

    Example body:
    {
        "Destination Port": 80,
        "Flow Duration": 12345,
        ...
    }
    """
    try:
        if NET_MODEL is None or NET_SCALER is None:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "Network model is not loaded. Run train_network_model.py first.",
                        "error": NET_STARTUP_ERROR,
                    }
                ),
                500,
            )

        data = request.get_json(silent=True) or {}
        if not data:
            return (
                jsonify({"success": False, "message": "Request body with flow features is required"}),
                400,
            )

        # Build feature vector in the same order as training; fill missing cols with 0
        feature_values = [float(data.get(col, 0)) for col in NET_FEATURES]
        X = np.array([feature_values], dtype=np.float32)

        # Replace any inf/nan with 0
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

        X_scaled = NET_SCALER.transform(X)
        pred_idx  = NET_MODEL.predict(X_scaled)[0]
        proba     = NET_MODEL.predict_proba(X_scaled)[0]
        confidence = float(max(proba))
        prediction = NET_ENCODER.inverse_transform([pred_idx])[0]

        # Build per-class probability map
        class_probs = {
            cls: round(float(p), 4)
            for cls, p in zip(NET_ENCODER.classes_, proba)
        }

        return (
            jsonify(
                {
                    "success": True,
                    "prediction": prediction,
                    "confidence": round(confidence, 4),
                    "classProbabilities": class_probs,
                }
            ),
            200,
        )
    except Exception as exc:
        return (
            jsonify({"success": False, "message": "Network prediction failed", "error": str(exc)}),
            500,
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
