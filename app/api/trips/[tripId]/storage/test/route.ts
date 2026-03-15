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

    if (storageConfig.type === "synology") {
      let credentials;
      try {
        credentials = JSON.parse(storageConfig.config);
      } catch {
        return NextResponse.json({
          success: false,
          error: "Invalid stored configuration. Please re-enter your links.",
        });
      }

      const shareLink = credentials.synologyShareLink || "";
      const requestLink = credentials.synologyRequestLink || "";

      if (!shareLink && !requestLink) {
        return NextResponse.json({
          success: false,
          error: "No Synology links configured. Please add at least one link.",
        });
      }

      const errors: string[] = [];
      if (shareLink && !isValidSynologyLink(shareLink)) {
        errors.push("Share link is not a valid Synology sharing URL");
      }
      if (requestLink && !isValidSynologyLink(requestLink)) {
        errors.push("Request link is not a valid Synology sharing URL");
      }

      if (errors.length > 0) {
        return NextResponse.json({
          success: false,
          error: errors.join(". "),
        });
      }

      const parts: string[] = [];
      if (shareLink) parts.push("gallery link configured");
      if (requestLink) parts.push("upload link configured");

      return NextResponse.json({
        success: true,
        message: `Synology connected: ${parts.join(", ")}`,
      });
    } else if (storageConfig.type === "google") {
      let credentials;
      try {
        credentials = JSON.parse(storageConfig.config);
      } catch {
        return NextResponse.json({
          success: false,
          error: "Invalid stored configuration. Please re-enter your link.",
        });
      }

      const link = credentials.googlePhotosLink || "";
      if (!link) {
        return NextResponse.json({
          success: false,
          error: "No Google Photos link configured. Please add a link.",
        });
      }

      if (!link.includes("photos.app.goo.gl") && !link.includes("photos.google.com")) {
        return NextResponse.json({
          success: false,
          error: "Link does not look like a valid Google Photos sharing link.",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Google Photos link configured",
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Local storage is always available",
      });
    }
  } catch (error: any) {
    console.error("Storage test error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
