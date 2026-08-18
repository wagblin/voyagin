import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDeleteTripMutation, useTripQuery, useUpdateTripMutation } from '../hooks/useTrips';

export interface TripDetailScreenProps {
  tripId: string;
  onBack: () => void;
}

export function TripDetailScreen({ tripId, onBack }: TripDetailScreenProps) {
  const tripQuery = useTripQuery(tripId);
  const updateTripMutation = useUpdateTripMutation();
  const deleteTripMutation = useDeleteTripMutation();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  return (
    <View style={styles.container}>
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
            <Text key={participant.userId} style={styles.participant}>
              {participant.name} ({participant.role})
            </Text>
          ))}

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
    </View>
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
  participant: {
    fontSize: 15,
    color: '#374151',
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
});
