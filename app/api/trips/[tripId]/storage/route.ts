import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidSynologyLink } from "@/lib/synology";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const {
      googlePhotosLink,
      synologyShareLink,
      synologyRequestLink,
    } = body;

    const config = JSON.stringify({
      googlePhotosLink: googlePhotosLink || "",
      synologyShareLink: synologyShareLink || "",
      synologyRequestLink: synologyRequestLink || "",
    });

    const storageConfig = await prisma.storageConfig.upsert({
      where: { tripId },
      update: { type: "links", config },
      create: { tripId, type: "links", config },
    });

    return NextResponse.json({
      id: storageConfig.id,
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

    const credentials = JSON.parse(storageConfig.config);

    return NextResponse.json({
      id: storageConfig.id,
      configured: true,
      credentials,
    });
  } catch (error) {
    console.error("Error fetching storage config:", error);
    return NextResponse.json(
      { error: "Failed to fetch storage configuration" },
      { status: 500 }
    );
  }
}
