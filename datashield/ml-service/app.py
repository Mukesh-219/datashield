from __future__ import annotations

from pathlib import Path

import joblib
from flask import Flask, jsonify, request

from utils.preprocess import preprocess_payload


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "model" / "threat_model.pkl"
VECTORIZER_PATH = BASE_DIR / "model" / "vectorizer.pkl"

app = Flask(__name__)


def load_artifacts():
    """Load trained model and vectorizer once at startup."""
    if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
        raise FileNotFoundError(
            "Model files are missing. Run 'python train_model.py' first."
        )

    model = joblib.load(MODEL_PATH)
    vectorizer = joblib.load(VECTORIZER_PATH)
    return model, vectorizer


try:
    MODEL, VECTORIZER = load_artifacts()
except Exception as exc:  # keep startup explicit and readable
    MODEL = None
    VECTORIZER = None
    STARTUP_ERROR = str(exc)
else:
    STARTUP_ERROR = None


@app.get("/health")
def health_check():
    """Simple health endpoint for service monitoring."""
    return jsonify(
        {
            "success": True,
            "service": "DataShield ML Service",
            "modelLoaded": MODEL is not None and VECTORIZER is not None,
            "error": STARTUP_ERROR,
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
