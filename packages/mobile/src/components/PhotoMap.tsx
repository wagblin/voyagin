import { Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, type Region } from 'react-native-maps';
import type { Photo } from '../lib/photosApi';

const DEFAULT_REGION: Region = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 60,
  longitudeDelta: 60,
};

function averageRegion(photos: Photo[]): Region {
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
  const region = averageRegion(photos);

  return (
    <MapView style={styles.map} initialRegion={region} {...(photos.length > 0 ? { region } : {})}>
      {photos.map((photo) => (
        <Marker
          key={photo.id}
          coordinate={{ latitude: photo.location.latitude, longitude: photo.location.longitude }}
        >
          <Callout>
            <View style={styles.callout}>
              <Image source={{ uri: photo.imageUrl }} style={styles.calloutImage} />
              {photo.caption ? <Text style={styles.calloutCaption}>{photo.caption}</Text> : null}
              <Text style={styles.calloutDate}>{new Date(photo.takenAt).toLocaleString()}</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  callout: {
    width: 160,
  },
  calloutImage: {
    width: '100%',
    height: 100,
    borderRadius: 6,
    marginBottom: 4,
  },
  calloutCaption: {
    fontSize: 13,
    fontWeight: '600',
  },
  calloutDate: {
    fontSize: 11,
    color: '#6b7280',
  },
});
