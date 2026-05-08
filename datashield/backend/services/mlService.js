import axios from "axios";

const ML_API_URL = process.env.ML_API_URL || "http://127.0.0.1:5000/predict";

const predictPayloadThreat = async (payload) => {
  try {
    const response = await axios.post(
      ML_API_URL,
      { payload },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data || {};

    if (!data.success) {
      throw new Error(data.message || "ML service returned unsuccessful response");
    }

    return {
      prediction: data.prediction,
      confidence: Number(data.confidence),
    };
  } catch (error) {
    // Throw a clean message so controller can handle graceful fallback.
    const message = error.response?.data?.message || error.message || "ML service request failed";
    throw new Error(message);
  }
};

export default {
  predictPayloadThreat,
};
