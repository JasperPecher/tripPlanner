import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { decryptStorageCredentials } from "@/lib/crypto";
import { SynologyClient } from "@/lib/synology";

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

    // Get storage configuration
    const storageConfig = await prisma.storageConfig.findUnique({
      where: { tripId },
    });

    const storageType = storageConfig?.type || "local";

    if (storageType === "synology" && storageConfig) {
      return await uploadToSynology(
        tripId,
        files,
        uploadedBy,
        storageConfig.config,
      );
    } else if (storageType === "google" && storageConfig) {
      console.log(
        "Google Photos upload - requires OAuth2 setup. Falling back to local.",
      );
      return await uploadLocally(tripId, files, uploadedBy);
    } else {
      return await uploadLocally(tripId, files, uploadedBy);
    }
  } catch (error) {
    console.error("Error uploading photos:", error);
    return NextResponse.json(
      { error: "Failed to upload photos" },
      { status: 500 },
    );
  }
}

async function uploadToSynology(
  tripId: string,
  files: File[],
  uploadedBy: string,
  encryptedConfig: string,
): Promise<NextResponse> {
  let client: SynologyClient | null = null;

  try {
    // Decrypt credentials to get the base folder path
    const credentials = decryptStorageCredentials(encryptedConfig);

    // Create client and login
    client = new SynologyClient({
      synologyUrl: credentials.synologyUrl || "",
      synologyUsername: credentials.synologyUsername || "",
      synologyPassword: credentials.synologyPassword || "",
    });
    await client.login();

    // Determine base folder:
    // 1. If user specified a shared folder, use it directly (e.g., "/home/potos")
    // 2. Otherwise, find the user's home directory
    let baseFolder: string;

    if (credentials.synologySharedFolder) {
      // User specified a folder - use it directly
      baseFolder = credentials.synologySharedFolder.startsWith("/")
        ? credentials.synologySharedFolder
        : `/${credentials.synologySharedFolder}`;
    } else {
      // Auto-detect: find user's home folder
      baseFolder = await client.findUserHomeFolder();
    }

    // Create only the trip-specific folder inside the base folder
    const tripFolder = `${baseFolder}/${tripId}`;

    // Try to create the trip folder - this should work if base folder exists and is writable
    try {
      await client.createFolder(baseFolder, tripId);
    } catch (e: any) {
      // If folder already exists, that's fine
      if (!e.message.includes("1101")) {
        // 1101 = folder already exists
        throw new Error(
          `Cannot create folder in ${baseFolder}. Make sure the folder exists and you have write permissions. Original error: ${e.message}`,
        );
      }
    }

    const photos = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(new Uint8Array(bytes));
      const ext = path.extname(file.name) || ".jpg";
      const filename = `${randomUUID()}${ext}`;

      // Upload file directly to trip folder
      await client.uploadFile(tripFolder, filename, buffer);

      // Get download URL
      const photoUrl = await client.getFileUrl(`${tripFolder}/${filename}`);

      // Store in database
      const photo = await prisma.photo.create({
        data: {
          filename: file.name,
          url: photoUrl,
          uploadedBy,
          tripId,
        },
      });

      photos.push(photo);
    }

    await client.logout();

    return NextResponse.json(photos);
  } catch (synologyError: any) {
    console.error("Synology upload error:", synologyError);

    if (client) {
      try {
        await client.logout();
      } catch {}
    }

    return NextResponse.json(
      {
        error: `Synology upload failed: ${synologyError.message}`,
      },
      { status: 500 },
    );
  }
}

async function uploadLocally(
  tripId: string,
  files: File[],
  uploadedBy: string,
): Promise<NextResponse> {
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
}
