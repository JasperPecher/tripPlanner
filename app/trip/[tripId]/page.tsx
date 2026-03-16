import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TripDashboard } from "@/components/TripDashboard";

interface PageProps {
  params: Promise<{ tripId: string }>;
}

function serializeTrip(trip: any) {
  return {
    ...trip,
    startDate: trip.startDate ? trip.startDate.toISOString() : null,
    endDate: trip.endDate ? trip.endDate.toISOString() : null,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    members: trip.members.map((m: any) => ({ ...m, joinedAt: m.joinedAt.toISOString() })),
    expenses: trip.expenses.map((e: any) => ({
      ...e, createdAt: e.createdAt.toISOString(),
      paidBy: { ...e.paidBy, joinedAt: e.paidBy.joinedAt.toISOString() },
      splits: e.splits.map((s: any) => ({ ...s, member: { ...s.member, joinedAt: s.member.joinedAt.toISOString() } })),
    })),
    bookings: trip.bookings.map((b: any) => ({
      ...b, checkIn: b.checkIn ? b.checkIn.toISOString() : null,
      checkOut: b.checkOut ? b.checkOut.toISOString() : null,
      createdAt: b.createdAt.toISOString(), updatedAt: b.updatedAt.toISOString(),
    })),
    photos: trip.photos.map((p: any) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    payments: trip.payments.map((p: any) => ({
      ...p, createdAt: p.createdAt.toISOString(),
    })),
  };
}

export default async function TripPage({ params }: PageProps) {
  const { tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      members: { orderBy: { joinedAt: "asc" } },
      expenses: { include: { paidBy: true, splits: { include: { member: true } } }, orderBy: { createdAt: "desc" } },
      bookings: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { createdAt: "desc" } },
      payments: { include: { from: true, to: true }, orderBy: { createdAt: "desc" } },
      storageConfig: true,
    },
  });

  if (!trip) notFound();

  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/join/${trip.shareCode}`;

  return <TripDashboard trip={serializeTrip(trip)} shareUrl={shareUrl} />;
}
