import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidSynologyLink } from "@/lib/synology";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;

    const storageConfig = await prisma.storageConfig.findUnique({
      where: { tripId },
    });

    if (!storageConfig) {
      return NextResponse.json(
        { success: false, error: "No storage configuration found" },
        { status: 400 }
      );
    }

    let credentials;
    try {
      credentials = JSON.parse(storageConfig.config);
    } catch {
      return NextResponse.json({
        success: false,
        error: "Invalid stored configuration. Please re-enter your links.",
      });
    }

    const errors: string[] = [];
    const valid: string[] = [];

    const googleLink = credentials.googlePhotosLink || "";
    if (googleLink) {
      if (
        googleLink.includes("photos.app.goo.gl") ||
        googleLink.includes("photos.google.com")
      ) {
        valid.push("Google Photos");
      } else {
        errors.push("Google Photos link is not a valid sharing URL");
      }
    }

    const shareLink = credentials.synologyShareLink || "";
    const requestLink = credentials.synologyRequestLink || "";
    if (shareLink || requestLink) {
      if (shareLink && !isValidSynologyLink(shareLink)) {
        errors.push("Synology share link is not a valid sharing URL");
      }
      if (requestLink && !isValidSynologyLink(requestLink)) {
        errors.push("Synology request link is not a valid sharing URL");
      }
      if (
        (!shareLink || isValidSynologyLink(shareLink)) &&
        (!requestLink || isValidSynologyLink(requestLink))
      ) {
        valid.push("Synology");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: errors.join(". "),
      });
    }

    if (valid.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No links configured. Please add at least one link.",
      });
    }

    return NextResponse.json({
      success: true,
      message: `Links configured: ${valid.join(", ")}`,
    });
  } catch (error: any) {
    console.error("Storage test error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
