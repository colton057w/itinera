import { Visibility } from "@prisma/client";
import { NextResponse } from "next/server";
import { buildBookingPlan } from "@/lib/booking-options";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await auth();
  const requestUrl = new URL(req.url);
  const partySize = Number.parseInt(requestUrl.searchParams.get("partySize") ?? "2", 10);

  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    include: {
      days: {
        orderBy: { dayIndex: "asc" },
        include: {
          events: {
            orderBy: { eventIndex: "asc" },
            select: {
              id: true,
              type: true,
              title: true,
              description: true,
              location: true,
              startsAt: true,
              endsAt: true,
              websiteUrl: true,
              googlePlaceId: true,
              googleMapsUrl: true,
              lat: true,
              lng: true,
              airline: true,
              departureAirportCode: true,
              arrivalAirportCode: true,
              departureAirportName: true,
              arrivalAirportName: true,
            },
          },
        },
      },
    },
  });

  if (!itinerary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canView =
    itinerary.visibility === Visibility.PUBLIC ||
    (session?.user?.id && session.user.id === itinerary.ownerId);

  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const plan = await buildBookingPlan({
    title: itinerary.title,
    days: itinerary.days,
    partySize,
  });

  return NextResponse.json(plan);
}
