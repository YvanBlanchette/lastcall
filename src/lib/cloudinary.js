import "server-only";
import { v2 as cloudinary } from "cloudinary";

/**
 * Abstraction média (section 3 du brief).
 * Rien d'autre dans l'application ne doit importer `cloudinary` directement :
 * changer de fournisseur ne devrait toucher que ce fichier.
 */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 8 * 1024 * 1024;

export async function uploadImage(file, folder = "lastcall/listings") {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Formats acceptés : JPG, PNG, WebP ou AVIF.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("L'image ne doit pas dépasser 8 Mo.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [{ width: 1600, height: 1000, crop: "limit" }],
          format: "webp",
        },
        (error, res) => (error ? reject(error) : resolve(res))
      )
      .end(buffer);
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

/** URL responsive dérivée du publicId — évite de stocker N variantes. */
export function imageUrl(publicId, { width = 800, height = 500 } = {}) {
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    width,
    height,
    crop: "fill",
    gravity: "auto",
    quality: "auto",
    fetch_format: "auto",
  });
}
