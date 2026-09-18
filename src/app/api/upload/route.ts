import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function uploadToCloudinary(buffer: Buffer, mimeType: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "itservicedesk", resource_type: "image", format: mimeType.split("/")[1] },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error || new Error("Cloudinary did not return an image URL"));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !hasCloudinaryConfig) {
      return NextResponse.json(
        { error: "Image storage is not configured. Set the Cloudinary environment variables." },
        { status: 503 }
      );
    }

    if (!hasCloudinaryConfig) {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await request.formData();
    const incomingFiles = formData.getAll("files").filter((item): item is File => item instanceof File);

    if (!incomingFiles.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of incomingFiles) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File too large: ${file.name}` }, { status: 400 });
      }

      const extension = path.extname(file.name) || ".jpg";
      const buffer = Buffer.from(await file.arrayBuffer());
      if (hasCloudinaryConfig) {
        uploadedUrls.push(await uploadToCloudinary(buffer, file.type));
      } else {
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
        const targetPath = path.join(UPLOAD_DIR, safeName);
        await fs.writeFile(targetPath, buffer);
        uploadedUrls.push(`/uploads/${safeName}`);
      }
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0] ?? null,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
