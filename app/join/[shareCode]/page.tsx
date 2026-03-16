import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { JoinTripClient } from "@/components/JoinTripClient";

interface PageProps {
  params: Promise<{ shareCode: string }>;
}

export default async function JoinTripPage({ params }: PageProps) {
  const { shareCode } = await params;

  const trip = await prisma.trip.findUnique({
    where: { shareCode },
    select: { id: true, name: true, description: true, members: { select: { id: true, name: true }, orderBy: { joinedAt: "asc" as const } } },
  });

  if (!trip) notFound();

  return (
    <JoinTripClient tripId={trip.id} tripName={trip.name} tripDescription={trip.description} existingMembers={trip.members} />
  );
}
