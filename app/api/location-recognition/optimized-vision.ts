/**
 * Optimized Vision API Client
 * 
 * This module provides optimized versions of Google Vision API calls
 * that are faster and more efficient than the standard ones.
 */

import * as vision from "@google-cloud/vision";
import { getEnv } from "../utils/env";
import { getConfig } from "./config";

// Singleton Vision client to avoid repeated initialization
let visionClient: vision.ImageAnnotatorClient | null = null;

/**
 * Gets or creates a Vision API client
 */
export function getVisionClient(): vision.ImageAnnotatorClient {
  if (visionClient) return visionClient;
  
  try {
    const base64Credentials = getEnv("GCLOUD_CREDENTIALS");
    if (!base64Credentials) {
      throw new Error("GCLOUD_CREDENTIALS environment variable is not set.");
    }
    
    const credentialsBuffer = Buffer.from(base64Credentials, "base64");
    const credentialsJson = credentialsBuffer.toString("utf8");
    const serviceAccount = JSON.parse(credentialsJson);
    
    visionClient = new vision.ImageAnnotatorClient({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      projectId: serviceAccount.project_id,
    });
    
    return visionClient;
  } catch (error) {
    console.error("Failed to initialize Vision client:", error);
    throw new Error("Vision API initialization failed");
  }
}

/**
 * Performs text detection with optimized settings
 */
export async function fastTextDetection(imageBuffer: Buffer): Promise<string> {
  const client = getVisionClient();
  
  // Use a timeout to prevent long-running requests
  const timeout = getConfig("performance.timeouts.visionAPI", 5000);
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Vision API timeout")), timeout);
    });
    
    const detectionPromise = client.textDetection({ image: { content: imageBuffer } });
    
    // Race the detection against the timeout
    const [result] = await Promise.race([
      detectionPromise,
      timeoutPromise
    ]) as any;
    
    if (!result || !result.textAnnotations || result.textAnnotations.length === 0) {
      return "";
    }
    
    return result.textAnnotations[0].description || "";
  } catch (error) {
    console.error("Error in fast text detection:", error);
    return "";
  }
}

/**
 * Performs only the essential image analysis needed for location recognition
 */
export async function essentialImageAnalysis(imageBuffer: Buffer) {
  const client = getVisionClient();
  
  // Only request the features we need based on config
  const features = [
    { type: "TEXT_DETECTION" as const }
  ];
  
  // Add optional features based on config
  if (getConfig("features.enableSceneAnalysis", false)) {
    features.push({ type: "LABEL_DETECTION" as const });
  }
  
  try {
    const [result] = await client.annotateImage({
      image: { content: imageBuffer },
      features: features
    });
    
    return {
      text: result.textAnnotations?.[0]?.description || "",
      labels: result.labelAnnotations || []
    };
  } catch (error) {
    console.error("Error in essential image analysis:", error);
    return {
      text: "",
      labels: []
    };
  }
}