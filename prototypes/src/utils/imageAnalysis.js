/**
 * Local image analysis.
 *
 * This module runs in the browser and computes simple quality metrics from a
 * captured JPEG data URL.
 *
 * Output shape:
 * - `metrics` contains raw values and 5 level ratings
 * - `feedback` contains three buckets: warning, info, success
 *
 * The UI uses `feedback.type` to choose colors.
 */

// Image quality thresholds for mapping a raw metric to a 5 level rating.
const IMAGE_QUALITY_THRESHOLDS = {
  lighting_mean: {
    method: "kmeans",
    // Lighting thresholds.
    thresholds: [60, 90, 120, 180],
  },
  sharpness_metric: {
    method: "variance_of_laplacian",
    // Variance of Laplacian thresholds.
    thresholds: [40, 80, 110, 150],
  },
  contrast_metric: {
    method: "center_edge_contrast",
    // Center to edge contrast thresholds.
    thresholds: [15, 30, 40, 60],
  }
};

const RATING_LABELS = ["Very Poor", "Poor", "Intermediate", "Good", "Very Good"];

function rateValue(value, thresholds) {
  for (let i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i]) {
      return RATING_LABELS[i];
    }
  }
  return RATING_LABELS[RATING_LABELS.length - 1];
}

// Convert image data to a grayscale array.
function getGrayscaleData(imageData) {
  const data = imageData.data;
  const grayscale = new Uint8Array(imageData.width * imageData.height);
  
  for (let i = 0; i < data.length; i += 4) {
    // Use standard grayscale conversion weights
    grayscale[i/4] = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
  }
  
  return grayscale;
}

// Calculate contrast between center and edges.
function calculateCenterEdgeContrast(grayscale, width, height) {
  // Define center circle where the specimen is expected.
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.3; // 60% diameter circle
  
  let centerSum = 0;
  let centerCount = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  
  // Sample pixels and categorize as center or edge.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const idx = y * width + x;
      
      if (distance < radius) {
        // Inside center circle.
        centerSum += grayscale[idx];
        centerCount++;
      } else if (distance > radius * 1.5) {
        // Far from center.
        edgeSum += grayscale[idx];
        edgeCount++;
      }
    }
  }
  
  // Calculate average brightness in center vs edges.
  const centerAvg = centerSum / centerCount;
  const edgeAvg = edgeSum / edgeCount;
  
  // Return absolute difference. Higher means better separation.
  return Math.abs(centerAvg - edgeAvg);
}

// Calculate mean of array.
function mean(array) {
  return array.reduce((sum, val) => sum + val, 0) / array.length;
}

// Variance of Laplacian. Higher means sharper edges.
function calculateVarianceOfLaplacian(grayscale, width, height) {
  const laplacianValues = [];
  
  // Define center region (middle 50% of image).
  const centerStartX = Math.floor(width * 0.25);
  const centerEndX = Math.floor(width * 0.75);
  const centerStartY = Math.floor(height * 0.25);
  const centerEndY = Math.floor(height * 0.75);
  
  // Apply Laplacian only to center region.
  for (let y = centerStartY; y < centerEndY - 1; y++) {
    for (let x = centerStartX; x < centerEndX - 1; x++) {
      if (y < 1 || y >= height - 1 || x < 1 || x >= width - 1) continue;
      
      const idx = y * width + x;
      const center = grayscale[idx];
      const top = grayscale[(y - 1) * width + x];
      const bottom = grayscale[(y + 1) * width + x];
      const left = grayscale[y * width + (x - 1)];
      const right = grayscale[y * width + (x + 1)];
      
      // Laplacian: -4*center + top + bottom + left + right.
      const laplacian = -4 * center + top + bottom + left + right;
      laplacianValues.push(laplacian);
    }
  }
  
  // Calculate variance of Laplacian values.
  const meanLaplacian = mean(laplacianValues);
  const variance = laplacianValues.reduce((sum, val) => sum + Math.pow(val - meanLaplacian, 2), 0) / laplacianValues.length;
  
  return variance;
}

/**
 * Analyze image quality metrics from base64 image
 * @param {string} imageDataUrl - Base64 encoded image data
 * @returns {Promise<{metrics: object, feedback: array}>}
 */
export async function analyzeFossilQuality(imageDataUrl) {
  // Create image and canvas
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Load image and process
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image and get pixel data
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const grayscale = getGrayscaleData(imageData);
      
      // Calculate metrics
      const lightingMean = mean(grayscale);
      const contrastMetric = calculateCenterEdgeContrast(grayscale, canvas.width, canvas.height);
      const sharpnessMetric = calculateVarianceOfLaplacian(grayscale, canvas.width, canvas.height);
      
      // Optional debug logging.
      if (import.meta?.env?.DEV) {
        console.log("Raw metrics:", { lightingMean, contrastMetric, sharpnessMetric });
      }
      
      // Rate each metric
      const metrics = {
        lighting_mean: Math.round(lightingMean * 100) / 100,
        lighting_rating: rateValue(lightingMean, IMAGE_QUALITY_THRESHOLDS.lighting_mean.thresholds),
        contrast_metric: Math.round(contrastMetric * 100) / 100,
        contrast_rating: rateValue(contrastMetric, IMAGE_QUALITY_THRESHOLDS.contrast_metric.thresholds),
        sharpness_metric: Math.round(sharpnessMetric * 100) / 100,
        sharpness_rating: rateValue(sharpnessMetric, IMAGE_QUALITY_THRESHOLDS.sharpness_metric.thresholds)
      };
      
      // Generate feedback messages.
      const feedback = [];
      
      // Lighting feedback.
      if (metrics.lighting_rating === "Very Poor" || metrics.lighting_rating === "Poor") {
        feedback.push({ type: "warning", message: "Image too dark - increase lighting" });
      } else if (metrics.lighting_rating === "Intermediate") {
        feedback.push({ type: "info", message: "Lighting acceptable but could be improved" });
      } else {
        feedback.push({ type: "success", message: "Lighting quality is good" });
      }
      
      // Sharpness feedback.
      if (metrics.sharpness_rating === "Very Poor" || metrics.sharpness_rating === "Poor") {
        feedback.push({ type: "warning", message: "Image is blurry - hold camera steady" });
      } else if (metrics.sharpness_rating === "Intermediate") {
        feedback.push({ type: "info", message: "Sharpness moderate - consider refocusing" });
      } else {
        feedback.push({ type: "success", message: "Sharpness is good" });
      }
      
      // Contrast feedback.
      if (metrics.contrast_rating === "Very Poor" || metrics.contrast_rating === "Poor") {
        feedback.push({ type: "warning", message: "Low contrast - adjust lighting or exposure" });
      } else if (metrics.contrast_rating === "Intermediate") {
        feedback.push({ type: "info", message: "Contrast acceptable but could be improved" });
      } else {
        feedback.push({ type: "success", message: "Contrast is good" });
      }
      
      resolve({ metrics, feedback });
    };
    
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageDataUrl;
  });
}