import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import {
  useAddParticipantMutation,
  useDeleteTripMutation,
  useRemoveParticipantMutation,
  useTripQuery,
  useUpdateTripMutation,
} from '../hooks/useTrips';
import { useAddPhotoMutation, useDeletePhotoMutation, useTripPhotosQuery } from '../hooks/useTripPhotos';
import { PhotoMap } from '../components/PhotoMap';
import type { TripParticipant } from '../lib/tripsApi';
import type { Photo } from '../lib/photosApi';

export interface TripDetailScreenProps {
  tripId: string;
  onBack: () => void;
}

export function TripDetailScreen({ tripId, onBack }: TripDetailScreenProps) {
  const { user } = useAuth();
  const tripQuery = useTripQuery(tripId);
  const updateTripMutation = useUpdateTripMutation();
  const deleteTripMutation = useDeleteTripMutation();
  const addParticipantMutation = useAddParticipantMutation(tripId);
  const removeParticipantMutation = useRemoveParticipantMutation(tripId);
  const photosQuery = useTripPhotosQuery(tripId);
  const addPhotoMutation = useAddPhotoMutation(tripId);
  const deletePhotoMutation = useDeletePhotoMutation(tripId);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (tripQuery.data) {
      setName(tripQuery.data.name);
      setStartDate(tripQuery.data.dateRange?.start ?? '');
      setEndDate(tripQuery.data.dateRange?.end ?? '');
    }
  }, [tripQuery.data]);

  function handleSave() {
    const trimmedName = name.trim();
    const input: { name?: string; startDate?: string; endDate?: string } = {};
    if (trimmedName !== '' && trimmedName !== tripQuery.data?.name) {
      input.name = trimmedName;
    }
    if (startDate.trim() !== '' && endDate.trim() !== '') {
      input.startDate = startDate.trim();
      input.endDate = endDate.trim();
    }
    if (Object.keys(input).length === 0) {
      return;
    }
    updateTripMutation.mutate({ id: tripId, input });
  }

  function handleDelete() {
    Alert.alert('Supprimer le voyage', 'Cette action est définitive. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deleteTripMutation.mutate(tripId, { onSuccess: onBack });
        },
      },
    ]);
  }

  function handleInvite() {
    const trimmedEmail = inviteEmail.trim();
    if (trimmedEmail === '') {
      return;
    }
    addParticipantMutation.mutate(trimmedEmail, {
      onSuccess: () => setInviteEmail(''),
    });
  }

  function handleRemoveParticipant(participant: TripParticipant) {
    Alert.alert('Retirer le participant', `Retirer ${participant.name} de ce voyage ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: () => {
          removeParticipantMutation.mutate(participant.userId);
        },
      },
    ]);
  }

  async function handleCapturePhoto() {
    setCaptureError(null);

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      setCaptureError('Autorisation caméra refusée.');
      return;
    }

    const locationPermission = await Location.requestForegroundPermissionsAsync();
    if (!locationPermission.granted) {
      setCaptureError('Autorisation de localisation refusée.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const position = await Location.getCurrentPositionAsync({});

    addPhotoMutation.mutate(
      {
        uri: result.assets[0]!.uri,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        takenAt: new Date().toISOString(),
      },
      {
        onError: (error) => setCaptureError(error.message),
      },
    );
  }

  function handleDeletePhoto(photo: Photo) {
    Alert.alert('Supprimer la photo', 'Cette action est définitive. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          deletePhotoMutation.mutate(photo.id);
        },
      },
    ]);
  }

  function canDeletePhoto(photo: Photo): boolean {
    if (user === null) {
      return false;
    }
    if (photo.uploaderId === user.id) {
      return true;
    }
    return tripQuery.data?.participants.some((p) => p.userId === user.id && p.role === 'owner') ?? false;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} testID="back-button">
        <Text style={styles.backText}>{'< Retour'}</Text>
      </TouchableOpacity>

      {tripQuery.isPending ? <ActivityIndicator style={styles.loading} /> : null}
      {tripQuery.isError ? <Text style={styles.error}>{tripQuery.error.message}</Text> : null}

      {tripQuery.data ? (
        <>
          <Text style={styles.title}>{tripQuery.data.name}</Text>

          <Text style={styles.label}>Nom</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} testID="trip-name-input" />

          <Text style={styles.label}>Date de début (ISO 8601)</Text>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="2026-08-18T00:00:00.000Z"
            testID="trip-start-date-input"
          />

          <Text style={styles.label}>Date de fin (ISO 8601)</Text>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="2026-08-25T00:00:00.000Z"
            testID="trip-end-date-input"
          />

          {updateTripMutation.isError ? <Text style={styles.error}>{updateTripMutation.error.message}</Text> : null}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={updateTripMutation.isPending}
            testID="save-trip-button"
          >
            <Text style={styles.saveButtonText}>{updateTripMutation.isPending ? '...' : 'Enregistrer'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Participants</Text>
          {tripQuery.data.participants.map((participant) => (
            <View key={participant.userId} style={styles.participantRow}>
              <Text style={styles.participant}>
                {participant.name} ({participant.role})
              </Text>
              {participant.role !== 'owner' ? (
                <TouchableOpacity
                  onPress={() => handleRemoveParticipant(participant)}
                  disabled={removeParticipantMutation.isPending}
                  testID={`remove-participant-${participant.userId}`}
                >
                  <Text style={styles.removeParticipantText}>Retirer</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          {removeParticipantMutation.isError ? (
            <Text style={styles.error}>{removeParticipantMutation.error.message}</Text>
          ) : null}

          <Text style={styles.label}>Inviter par email</Text>
          <TextInput
            style={styles.input}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="ami@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            testID="invite-email-input"
          />

          {addParticipantMutation.isError ? (
            <Text style={styles.error}>{addParticipantMutation.error.message}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleInvite}
            disabled={addParticipantMutation.isPending}
            testID="invite-participant-button"
          >
            <Text style={styles.saveButtonText}>{addParticipantMutation.isPending ? '...' : 'Inviter'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Carnet photo</Text>

          <PhotoMap photos={photosQuery.data ?? []} />

          {captureError ? <Text style={styles.error}>{captureError}</Text> : null}
          {addPhotoMutation.isError ? <Text style={styles.error}>{addPhotoMutation.error.message}</Text> : null}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => void handleCapturePhoto()}
            disabled={addPhotoMutation.isPending}
            testID="capture-photo-button"
          >
            <Text style={styles.saveButtonText}>
              {addPhotoMutation.isPending ? 'Envoi…' : 'Prendre une photo'}
            </Text>
          </TouchableOpacity>

          {photosQuery.isPending ? <ActivityIndicator style={styles.loading} /> : null}
          {photosQuery.isError ? <Text style={styles.error}>{photosQuery.error.message}</Text> : null}
          {deletePhotoMutation.isError ? (
            <Text style={styles.error}>{deletePhotoMutation.error.message}</Text>
          ) : null}

          <View style={styles.photoGrid}>
            {(photosQuery.data ?? []).map((photo) => (
              <View key={photo.id} style={styles.photoCard}>
                <Image source={{ uri: photo.imageUrl }} style={styles.photoImage} />
                {photo.caption ? <Text style={styles.photoCaption}>{photo.caption}</Text> : null}
                {canDeletePhoto(photo) ? (
                  <TouchableOpacity
                    onPress={() => handleDeletePhoto(photo)}
                    disabled={deletePhotoMutation.isPending}
                    testID={`delete-photo-${photo.id}`}
                  >
                    <Text style={styles.removeParticipantText}>Supprimer</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>

          {deleteTripMutation.isError ? (
            <Text style={styles.error}>{deleteTripMutation.error.message}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteTripMutation.isPending}
            testID="delete-trip-button"
          >
            <Text style={styles.deleteButtonText}>
              {deleteTripMutation.isPending ? '...' : 'Supprimer le voyage'}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 60,
    gap: 8,
  },
  backText: {
    color: '#2563eb',
    fontSize: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    color: '#dc2626',
  },
  loading: {
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  participant: {
    fontSize: 15,
    color: '#374151',
  },
  removeParticipantText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  photoCard: {
    width: '31%',
    gap: 4,
  },
  photoImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  photoCaption: {
    fontSize: 11,
    color: '#374151',
  },
});
