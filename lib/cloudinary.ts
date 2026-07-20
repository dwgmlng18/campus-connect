import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Mengunggah berkas gambar ke Cloudinary
 * @param file Berkas gambar dari Client (File)
 * @returns Promise berisi URL gambar yang aman (Secure URL)
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "campus-connect",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Gagal mengunggah ke Cloudinary: ${error.message}`));
        } else {
          resolve(result!.secure_url);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}
