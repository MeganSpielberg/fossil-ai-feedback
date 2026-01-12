/**
 * API layer for the prototype app.
 *
 * Important notes:
 * - Image quality analysis runs locally in the browser.
 * - Upload and database writes go to Supabase.
 */
import { analyzeFossilQuality } from "./utils/imageAnalysis";
import { supabase, uploadImageToStorage, getDeviceInfo } from "./utils/supabase";

/**
 * Run local image analysis on a base64 image.
 *
 * @param {string} base64Image Base64 data URL for a JPEG image.
 * @returns {Promise<{metrics: object, feedback: Array<{type: string, message: string}>}>}
 */
export const analyzeImage = async (base64Image) => {
  try {
    const result = await analyzeFossilQuality(base64Image);
    return result;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

/**
 * Submit the full study session to Supabase.
 *
 * This does three things:
 * 1. Creates a `submissions` row.
 * 2. Uploads all images to the `submissions` storage bucket.
 * 3. Creates `submission_prototype` rows and `images` rows.
 *
 * The database writes are not a real transaction, so we attempt best effort rollback
 * by deleting rows if a later insert fails.
 */
export const submitAllImages = async (
  submissionId,
  submissionDetails,
  imagesByPrototype,
  testingOrderId,
  timeSpentData = {},
  flashlightData = {}
) => {
  try {
    // Record device info so later analysis can group by device type.
    const deviceInfo = getDeviceInfo();
    
    // Step 1: Create the submission record.
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        username: submissionDetails.username,
        title: submissionDetails.title,
        location: submissionDetails.location,
        'testing order': testingOrderId,
        device: deviceInfo,
      })
      .select()
      .single();

    if (submissionError) throw submissionError;

    const submissionId_db = submission.id;

    // Step 2: Upload all images to storage first.
    const allUploadedImages = [];
    for (const [protoKey, images] of Object.entries(imagesByPrototype)) {
      const protoNum = parseInt(protoKey.replace(/^p?/, ""), 10);
      if (!images || images.length === 0) continue;

      for (let idx = 0; idx < images.length; idx++) {
        const img = images[idx];
        const filename = `${submissionId}_p${protoNum}_${idx + 1}.jpg`;
        try {
          const imageUrl = await uploadImageToStorage(img.data, filename);
          allUploadedImages.push({
            filename,
            image_url: imageUrl,
            prototype_num: protoNum,
          });
        } catch (uploadError) {
          throw new Error(`Failed to upload image ${filename}: ${uploadError.message}`);
        }
      }
    }

    // Step 3: Create database records.
    // First, create submission_prototype records for each prototype.
    const submission_prototype_records = [];
    const prototypeNums = [
      ...new Set(
        Object.entries(imagesByPrototype)
          .filter(([, images]) => images && images.length > 0)
          .map(([protoKey]) => parseInt(protoKey.replace(/^p?/, ""), 10))
      ),
    ];

    for (const protoNum of prototypeNums) {
      const timeKey = `p${protoNum}`;
      submission_prototype_records.push({
        submission_id: submissionId_db,
        prototype_name: `Prototype ${protoNum}`,
        time_spent: timeSpentData[timeKey] || {},
        flashlight_used: flashlightData[timeKey] || false,
      });
    }

    const { data: protoSubmissions, error: protoError } = await supabase
      .from('submission_prototype')
      .insert(submission_prototype_records)
      .select();

    if (protoError) {
      // Rollback: delete the submission
      await supabase.from('submissions').delete().eq('id', submissionId_db);
      throw protoError;
    }

    // Step 4: Create image records linked to submission_prototype.
    const imageRecords = [];
    for (const uploadedImg of allUploadedImages) {
      const protoSubmission = protoSubmissions.find(
        ps => ps.prototype_name === `Prototype ${uploadedImg.prototype_num}`
      );
      if (!protoSubmission) {
        // Rollback
        await supabase.from('submissions').delete().eq('id', submissionId_db);
        throw new Error(`Could not find submission_prototype for Prototype ${uploadedImg.prototype_num}`);
      }

      imageRecords.push({
        filename: uploadedImg.filename,
        image_url: uploadedImg.image_url,
        submission_prototype_id: protoSubmission.id,
      });
    }

    const { data: insertedImages, error: imageError } = await supabase
      .from('images')
      .insert(imageRecords)
      .select();

    if (imageError) {
      // Rollback: delete submission_prototype and submission
      await supabase.from('submission_prototype').delete().eq('submission_id', submissionId_db);
      await supabase.from('submissions').delete().eq('id', submissionId_db);
      throw imageError;
    }

    return {
      success: true,
      submission_id: submissionId_db,
      images_saved: insertedImages.length,
      prototypes_submitted: prototypeNums.length,
    };
  } catch (error) {
    console.error('Error in submitAllImages:', error);
    throw error;
  }
};