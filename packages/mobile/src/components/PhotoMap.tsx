import { useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { chronologicalPhotoRoute, hasPhotoLocation } from '../lib/photoLocations';
import { cloudinaryThumbnailUrl } from '../lib/cloudinary';
import type { Photo, PhotoLocation } from '../lib/photosApi';

type LocatedPhoto = Photo & { location: PhotoLocation };

const DEFAULT_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 60,
  longitudeDelta: 60,
};

function averageRegion(photos: LocatedPhoto[]): Region {
  if (photos.length === 0) {
    return DEFAULT_REGION;
  }
  const latitudes = photos.map((photo) => photo.location.latitude);
  const longitudes = photos.map((photo) => photo.location.longitude);
  const latitude = latitudes.reduce((sum, value) => sum + value, 0) / latitudes.length;
  const longitude = longitudes.reduce((sum, value) => sum + value, 0) / longitudes.length;
  const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

  return {
    latitude,
    longitude,
    latitudeDelta: Math.max(spread(latitudes) * 1.5, 0.05),
    longitudeDelta: Math.max(spread(longitudes) * 1.5, 0.05),
  };
}

export interface PhotoMapProps {
  photos: Photo[];
}

export function PhotoMap({ photos }: PhotoMapProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<LocatedPhoto | null>(null);
  const locatedPhotos = photos.filter(hasPhotoLocation);
  const region = averageRegion(locatedPhotos);
  const route = chronologicalPhotoRoute(photos);

  return (
    <>
      <MapView style={styles.map} initialRegion={region} {...(locatedPhotos.length > 0 ? { region } : {})}>
        {route.length > 1 ? <Polyline coordinates={route} strokeColor="#2563eb" strokeWidth={3} /> : null}
        {locatedPhotos.map((photo) => (
          <Marker
            key={photo.id}
            coordinate={{ latitude: photo.location.latitude, longitude: photo.location.longitude }}
            onPress={() => setSelectedPhoto(photo)}
          />
        ))}
      </MapView>
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        {selectedPhoto ? (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <Image
                source={{ uri: cloudinaryThumbnailUrl(selectedPhoto.imageUrl, 320) }}
                style={styles.cardImage}
              />
              {selectedPhoto.caption ? <Text style={styles.cardCaption}>{selectedPhoto.caption}</Text> : null}
              <Text style={styles.cardDate}>{new Date(selectedPhoto.takenAt).toLocaleString()}</Text>
              <Pressable
                testID="photo-modal-close"
                style={styles.closeButton}
                onPress={() => setSelectedPhoto(null)}
              >
                <Text style={styles.closeButtonLabel}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    width: '100%',
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardCaption: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  closeButtonLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});
