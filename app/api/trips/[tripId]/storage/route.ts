import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptStorageCredentials } from "@/lib/crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { type, googleAlbumId, synologyUrl, synologyUsername, synologyPassword, synologySharedFolder } =
      body;

    // Encrypt credentials before storing
    const config = encryptStorageCredentials({
      googleAlbumId: googleAlbumId || "",
      synologyUrl: synologyUrl || "",
      synologyUsername: synologyUsername || "",
      synologyPassword: synologyPassword || "",
      synologySharedFolder: synologySharedFolder || "",
    });

    const storageConfig = await prisma.storageConfig.upsert({
      where: { tripId },
      update: { type, config },
      create: { tripId, type, config },
    });

    // Return config without sensitive data
    return NextResponse.json({
      id: storageConfig.id,
      type: storageConfig.type,
      configured: true,
    });
  } catch (error) {
    console.error("Error saving storage config:", error);
    return NextResponse.json(
      { error: "Failed to save storage configuration" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const storageConfig = await prisma.storageConfig.findUnique({
      where: { tripId },
    });

    if (!storageConfig) {
      return NextResponse.json({ configured: false });
    }

    // Return only type, not the encrypted config
    return NextResponse.json({
      id: storageConfig.id,
      type: storageConfig.type,
      configured: true,
    });
  } catch (error) {
    console.error("Error fetching storage config:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage configuration" },
      { status: 500 }
    );
  }
}
