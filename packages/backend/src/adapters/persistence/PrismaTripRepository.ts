import { Prisma, PrismaClient } from '@prisma/client';
import { DateRange, Trip, TripId, TripRepository } from '@voyagin/domain';

type TripWithParticipants = Prisma.TripGetPayload<{ include: { participants: true } }>;

export class PrismaTripRepository implements TripRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(trip: Trip): Promise<void> {
    const dateRange = trip.getDateRange();

    await this.prisma.trip.upsert({
      where: { id: trip.id.toString() },
      create: {
        id: trip.id.toString(),
        name: trip.getName(),
        startDate: dateRange?.start ?? null,
        endDate: dateRange?.end ?? null,
        participants: {
          create: trip.getParticipants().map((participant) => ({
            userId: participant.userId,
            name: participant.name,
            role: participant.role,
          })),
        },
      },
      update: {
        name: trip.getName(),
        startDate: dateRange?.start ?? null,
        endDate: dateRange?.end ?? null,
      },
    });
  }

  async findById(id: TripId): Promise<Trip | null> {
    const record = await this.prisma.trip.findUnique({
      where: { id: id.toString() },
      include: { participants: true },
    });

    return record ? this.toDomain(record) : null;
  }

  async findByParticipant(userId: string): Promise<Trip[]> {
    const records = await this.prisma.trip.findMany({
      where: { participants: { some: { userId } } },
      include: { participants: true },
    });

    return records.map((record) => this.toDomain(record));
  }

  async delete(id: TripId): Promise<void> {
    await this.prisma.trip.delete({ where: { id: id.toString() } });
  }

  private toDomain(record: TripWithParticipants): Trip {
    const dateRange =
      record.startDate && record.endDate
        ? DateRange.create(record.startDate, record.endDate)
        : undefined;

    return Trip.reconstitute({
      id: record.id,
      name: record.name,
      participants: record.participants.map((participant) => ({
        userId: participant.userId,
        name: participant.name,
        role: participant.role === 'owner' ? 'owner' : 'member',
      })),
      ...(dateRange ? { dateRange } : {}),
    });
  }
}
