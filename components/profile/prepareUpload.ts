import { MAX_TRANSCRIPT_BYTES } from "@/lib/ai/transcriptPrompt";

/**
 * Les photos de téléphone dépassent souvent 4 Mo : on les réduit dans le
 * navigateur avant l'envoi (import du relevé et du programme). Un PDF est
 * envoyé tel quel ; en cas d'échec de la réduction, le fichier d'origine aussi.
 */
const MAX_IMAGE_SIDE = 2000;

export async function prepareUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= MAX_TRANSCRIPT_BYTES / 2) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "document.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}
