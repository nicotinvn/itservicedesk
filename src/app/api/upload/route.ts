import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

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
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
      const targetPath = path.join(UPLOAD_DIR, safeName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(targetPath, buffer);

      uploadedUrls.push(`/uploads/${safeName}`);
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
