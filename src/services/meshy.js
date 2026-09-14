/**
 * Meshy AI Image-to-3D Integration Service
 * Documentation: https://docs.meshy.ai/en/api/image-to-3d
 */

const STORAGE_KEY = "meshy_api_key";

export function getMeshyApiKey() {
  const envKey = (import.meta.env.VITE_MESHY_API_KEY || "").trim();
  if (envKey) return envKey;
  try {
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveMeshyApiKey(key) {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn("Could not access localStorage for Meshy key", e);
  }
}

export function clearMeshyApiKey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Could not clear Meshy key", e);
  }
}

function getStatusMessage(status, progress = 0) {
  if (progress > 0 && progress < 100) {
    if (progress < 25) return `Analyzing contours & depth... (${progress}%)`;
    if (progress < 50) return `Generating voxel geometry... (${progress}%)`;
    if (progress < 75) return `Reconstructing surfaces... (${progress}%)`;
    return `Synthesizing PBR textures & GLB... (${progress}%)`;
  }
  switch (status) {
    case "PENDING":
      return "Queued in Meshy processing pipeline...";
    case "IN_PROGRESS":
      return `Synthesizing 3D mesh... (${progress}%)`;
    case "SUCCEEDED":
      return "Model successfully generated!";
    case "FAILED":
      return "Generation failed.";
    default:
      return "Communicating with Meshy AI...";
  }
}

/**
 * Generate a 3D model from an image data URL or public URL via Meshy API
 */
export async function generate3DFromImage({
  image,
  apiKey,
  onProgress,
  signal,
}) {
  const token = (apiKey || getMeshyApiKey()).trim();
  if (!token) {
    throw new Error("No Meshy API key provided. Add VITE_MESHY_API_KEY in .env.local or enter it in the dialog.");
  }

  // Use proxy in dev or direct in prod
  const baseUrl = import.meta.env.DEV ? "/api/meshy" : "https://api.meshy.ai";

  onProgress?.({
    status: "PENDING",
    progress: 5,
    message: "Submitting image to Meshy API...",
  });

  const response = await fetch(`${baseUrl}/openapi/v1/image-to-3d`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: image,
      enable_pbr: true,
      should_remesh: false,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const msg =
      errorBody?.message ||
      errorBody?.error ||
      `Meshy API request failed (${response.status}: ${response.statusText})`;
    throw new Error(msg);
  }

  const resultData = await response.json();
  const taskId = resultData.result;

  if (!taskId) {
    throw new Error("Meshy API did not return a valid task ID.");
  }

  onProgress?.({
    status: "IN_PROGRESS",
    progress: 10,
    message: "Task accepted. Beginning generation...",
  });

  // Poll for completion
  let attempts = 0;
  const maxAttempts = 150; // ~10 minutes max with 4s intervals

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 4000));
    if (signal?.aborted) {
      throw new Error("Generation cancelled by user.");
    }

    const pollRes = await fetch(`${baseUrl}/openapi/v1/image-to-3d/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      signal,
    });

    if (!pollRes.ok) {
      // transient network error, retry next round
      attempts++;
      continue;
    }

    const task = await pollRes.json();
    const progress = Math.max(10, Math.min(100, task.progress || 0));

    onProgress?.({
      status: task.status,
      progress,
      message: getStatusMessage(task.status, progress),
    });

    if (task.status === "SUCCEEDED") {
      let glbUrl = task.model_urls?.glb || task.model_url;
      if (!glbUrl) {
        throw new Error("Task succeeded but no GLB model URL was returned.");
      }
      // Route through local /meshy-assets proxy to bypass CloudFront CORS restrictions
      if (typeof glbUrl === "string" && glbUrl.startsWith("https://assets.meshy.ai")) {
        glbUrl = glbUrl.replace("https://assets.meshy.ai", "/meshy-assets");
      }
      return {
        glbUrl,
        thumbnailUrl: task.thumbnail_url,
        task,
      };
    }

    if (task.status === "FAILED" || task.status === "EXPIRED") {
      const reason = task.task_error?.message || `Task ${task.status.toLowerCase()}`;
      throw new Error(`Meshy generation failed: ${reason}`);
    }

    attempts++;
  }

  throw new Error("Generation timed out after 10 minutes. Check your Meshy dashboard.");
}

/**
 * Fallback simulation for demo/testing when no API key is available
 */
export async function simulateMeshyGeneration({ onProgress, signal }) {
  const steps = [
    { progress: 15, msg: "Authenticating with Meshy API..." },
    { progress: 35, msg: "Analyzing sketch contours & silhouettes..." },
    { progress: 60, msg: "Generating 3D voxel representation..." },
    { progress: 85, msg: "Extracting mesh and interpolating surfaces..." },
    { progress: 98, msg: "Applying base textures and finalizing GLB..." },
  ];

  for (const step of steps) {
    if (signal?.aborted) throw new Error("Cancelled");
    onProgress?.({
      status: "IN_PROGRESS",
      progress: step.progress,
      message: step.msg,
    });
    await new Promise((r) => setTimeout(r, 1200));
  }

  onProgress?.({
    status: "SUCCEEDED",
    progress: 100,
    message: "Generation complete (Demo fallback primitive)!",
  });

  return {
    glbUrl: null, // Signals App to use aesthetic generated form
    isDemo: true,
  };
}
