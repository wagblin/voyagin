import { PrismaClient } from '@prisma/client';
import { GeoLocation, Photo, PhotoId, PhotoRepository } from '@voyagin/domain';

export class PrismaPhotoRepository implements PhotoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(photo: Photo): Promise<void> {
    const data = {
      tripId: photo.getTripId(),
      uploaderId: photo.getUploaderId(),
      imageUrl: photo.getImageUrl(),
      latitude: photo.getLocation().latitude,
      longitude: photo.getLocation().longitude,
      takenAt: photo.getTakenAt(),
      caption: photo.getCaption() ?? null,
    };

    await this.prisma.photo.upsert({
      where: { id: photo.id.toString() },
      create: { id: photo.id.toString(), ...data },
      update: data,
    });
  }

  async findById(id: PhotoId): Promise<Photo | null> {
    const record = await this.prisma.photo.findUnique({ where: { id: id.toString() } });
    return record ? this.toDomain(record) : null;
  }

  async findByTrip(tripId: string): Promise<Photo[]> {
    const records = await this.prisma.photo.findMany({
      where: { tripId },
      orderBy: { takenAt: 'asc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async delete(id: PhotoId): Promise<void> {
    await this.prisma.photo.delete({ where: { id: id.toString() } });
  }

  private toDomain(record: {
    id: string;
    tripId: string;
    uploaderId: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
    takenAt: Date;
    caption: string | null;
  }): Photo {
    return Photo.reconstitute({
      id: record.id,
      tripId: record.tripId,
      uploaderId: record.uploaderId,
      imageUrl: record.imageUrl,
      location: GeoLocation.create(record.latitude, record.longitude),
      takenAt: record.takenAt,
      ...(record.caption !== null ? { caption: record.caption } : {}),
    });
  }
}
