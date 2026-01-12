/**
 * Supabase client and helpers.
 *
 * This module centralizes:
 * - Supabase client creation
 * - Storage uploads for captured images
 * - Testing order selection and completion tracking
 * - Basic device metadata collection
 */
import { createClient } from "@supabase/supabase-js";

// Read Supabase credentials from environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Validate environment variables.
if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('VITE_SUPABASE_KEY:', supabaseKey ? 'Set' : 'Missing');
  throw new Error('Supabase environment variables are not configured. Please check your .env file.');
}

// Initialize Supabase client.
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload a captured image to the Supabase Storage bucket named `submissions`.
 *
 * @param {string} imageDataUrl Base64 data URL.
 * @param {string} filename File name to use in the bucket.
 * @returns {Promise<string>} Public URL of the uploaded image.
 */
export async function uploadImageToStorage(imageDataUrl, filename) {
  // Convert base64 data URL to a Blob.
  const response = await fetch(imageDataUrl);
  const blob = await response.blob();

  // Upload to storage bucket.
  const { error: uploadError } = await supabase.storage
    .from("submissions")
    .upload(filename, blob, {
      contentType: "image/jpeg",
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  // Get public URL.
  const { data: publicData, error: publicError } = supabase.storage
    .from("submissions")
    .getPublicUrl(filename);

  if (publicError) throw publicError;
  return publicData.publicUrl;
}

/**
 * Pick a testing order with the fewest completions.
 *
 * The expectation is that `testing_orders.order_sequence` is a string like `p1,p2,p3`.
 */
export async function getTestingOrder() {
  const { data: orders, error } = await supabase
    .from("testing_orders")
    .select("*")
    .order("completions", { ascending: true })
    .limit(1);
  
  if (error) throw error;
  if (!orders || orders.length === 0) throw new Error("No testing orders found");
  
  return orders[0];
}

/**
 * Increment the `testing_orders.completions` counter.
 *
 * This is used after a full submission (all three prototypes) is uploaded.
 */
export async function incrementOrderCompletion(orderId) {
  // Fetch current completions.
  const { data: currentData, error: fetchError } = await supabase
    .from("testing_orders")
    .select("completions")
    .eq("id", orderId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Increment and update.
  const { error: updateError } = await supabase
    .from("testing_orders")
    .update({ completions: (currentData?.completions || 0) + 1 })
    .eq("id", orderId);
  
  if (updateError) throw updateError;
}

export default supabase;

/**
 * Collect basic device and browser info.
 *
 * This is best effort and depends on what the browser exposes.
 */
export function getDeviceInfo() {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  // Detect OS
  let os = 'Unknown';
  if (/Android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    os = 'iOS';
  } else if (/Windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/Mac/i.test(userAgent)) {
    os = 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    os = 'Linux';
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (/Chrome/i.test(userAgent) && !/Edg|OPR/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/Firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/Edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/OPR|Opera/i.test(userAgent)) {
    browser = 'Opera';
  }
  
  // Try to extract phone model (works better on Android)
  let model = 'Unknown';
  
  // Android device detection
  const androidMatch = userAgent.match(/Android.*?;\s*([^)]+)/i);
  if (androidMatch && androidMatch[1]) {
    model = androidMatch[1].trim();
  }
  
  // iOS device detection
  if (/iPhone/i.test(userAgent)) {
    model = 'iPhone';
  } else if (/iPad/i.test(userAgent)) {
    model = 'iPad';
  } else if (/iPod/i.test(userAgent)) {
    model = 'iPod';
  }
  
  // Screen information
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const pixelRatio = window.devicePixelRatio || 1;
  
  return {
    os,
    browser,
    model,
    userAgent,
    platform,
    screen: {
      width: screenWidth,
      height: screenHeight,
      pixelRatio
    }
  };
}