import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  try {
    const { tripId } = await params;
    const formData = await request.formData();
    const files = formData.getAll("photos") as File[];
    const uploadedBy = (formData.get("uploadedBy") as string) || "Unknown";

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", tripId);
    await mkdir(uploadDir, { recursive: true });

    const photos = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(bytes));
      const ext = path.extname(file.name) || ".jpg";
      const filename = `${randomUUID()}${ext}`;
      const filepath = path.join(uploadDir, filename);

      await writeFile(filepath, buffer);

      const photo = await prisma.photo.create({
        data: {
          filename: file.name,
          url: `/uploads/${tripId}/${filename}`,
          uploadedBy,
          tripId,
        },
      });

      photos.push(photo);
    }

    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error uploading photos:", error);
    return NextResponse.json(
      { error: "Failed to upload photos" },
      { status: 500 },
    );
  }
}
