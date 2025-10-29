import { API_URL } from "./config";

export const analyzeImage = async (imageData) => {
  const response = await fetch(`${API_URL}/api/analyze-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData }),
  });
  if (!response.ok) throw new Error("Failed to analyze image");
  return await response.json();
};

export const submitImages = async (
  submissionId,
  submissionDetails,
  prototypeNum,
  capturedImages
) => {
  const formData = new FormData();
  formData.append("submission_id", submissionId);
  formData.append("title", submissionDetails.title);
  formData.append("location", submissionDetails.location);
  formData.append("prototype", `p${prototypeNum}`);

  for (let i = 0; i < capturedImages.length; i++) {
    const response = await fetch(capturedImages[i].data);
    const blob = await response.blob();
    formData.append("images", blob, `image_${i}.jpg`);
  }

  const uploadResponse = await fetch(`${API_URL}/api/submit`, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.json();
    throw new Error(error.error || "Unknown error");
  }

  return await uploadResponse.json();
};