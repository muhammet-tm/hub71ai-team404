// Browser only. Downscale a photo on a canvas to JPEG so the upload stays under the route's size cap.
import { IMAGE_LONG_EDGE, JPEG_QUALITY } from "./config";

export async function downscaleToJpeg(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, IMAGE_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b || file), "image/jpeg", JPEG_QUALITY));
}
