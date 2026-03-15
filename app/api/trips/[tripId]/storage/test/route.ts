import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptStorageCredentials } from "@/lib/crypto";
import { SynologyClient } from "@/lib/synology";

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
      // Decrypt credentials to verify they work
      let credentials;
      try {
        credentials = decryptStorageCredentials(storageConfig.config);
      } catch (e: any) {
        return NextResponse.json({
          success: false,
          error: "Failed to decrypt stored credentials. Please re-enter your credentials.",
        });
      }

      if (!credentials.synologyUrl || !credentials.synologyUsername) {
        return NextResponse.json({
          success: false,
          error: "Missing Synology URL or username in stored config. Please re-save your settings.",
        });
      }

      const client = new SynologyClient({
        synologyUrl: credentials.synologyUrl,
        synologyUsername: credentials.synologyUsername,
        synologyPassword: credentials.synologyPassword || "",
      });

      try {
        // Test API discovery
        await client.testConnection();

        return NextResponse.json({
          success: true,
          message: `Connected to ${credentials.synologyUrl}`,
        });
      } catch (error: any) {
        return NextResponse.json({
          success: false,
          error: error.message,
        });
      }
    } else if (storageConfig.type === "google") {
      return NextResponse.json({
        success: false,
        error:
          "Google Photos testing requires OAuth2 implementation.",
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
