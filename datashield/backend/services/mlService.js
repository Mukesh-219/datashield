import axios from "axios";

const ML_API_URL =
  process.env.ML_API_URL || "http://127.0.0.1:8000/predict";

// Debug log
console.log("ML_API_URL =", ML_API_URL);

const predictPayloadThreat = async (payload) => {
  try {
    console.log("Sending payload to ML service:", payload);

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

    console.log("ML Service Response:", response.data);

    const data = response.data || {};

    if (!data.success) {
      throw new Error(
        data.message || "ML service returned unsuccessful response"
      );
    }

    return {
      prediction: data.prediction,
      confidence: Number(data.confidence),
    };
  } catch (error) {
    console.error("ML Service Error:", {
      url: ML_API_URL,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      "ML service request failed";

    throw new Error(message);
  }
};

export default {
  predictPayloadThreat,
};


