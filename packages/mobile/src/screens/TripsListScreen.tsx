import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useCreateTripMutation, useTripsQuery } from '../hooks/useTrips';
import type { Trip } from '../lib/tripsApi';

export interface TripsListScreenProps {
  onSelectTrip: (id: string) => void;
  onOpenAccount: () => void;
}

export function TripsListScreen({ onSelectTrip, onOpenAccount }: TripsListScreenProps) {
  const { user, logout } = useAuth();
  const tripsQuery = useTripsQuery();
  const createTripMutation = useCreateTripMutation();
  const [newTripName, setNewTripName] = useState('');

  function handleCreateTrip() {
    const name = newTripName.trim();
    if (name === '') {
      return;
    }
    createTripMutation.mutate(
      { name },
      {
        onSuccess: () => setNewTripName(''),
      },
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes voyages</Text>
          <Text style={styles.subtitle}>Connecté en tant que {user?.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onOpenAccount} testID="account-button">
            <Text style={styles.accountText}>Mon compte</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void logout()} testID="logout-button">
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Nouveau voyage</Text>
      <View style={styles.createForm}>
        <TextInput
          style={styles.input}
          placeholder="Nom du voyage"
          value={newTripName}
          onChangeText={setNewTripName}
          testID="new-trip-name-input"
        />
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTrip}
          disabled={createTripMutation.isPending}
          testID="create-trip-button"
        >
          <Text style={styles.createButtonText}>{createTripMutation.isPending ? '...' : 'Créer'}</Text>
        </TouchableOpacity>
      </View>
      {createTripMutation.isError ? <Text style={styles.error}>{createTripMutation.error.message}</Text> : null}

      {tripsQuery.isPending ? <ActivityIndicator style={styles.loading} /> : null}
      {tripsQuery.isError ? <Text style={styles.error}>{tripsQuery.error.message}</Text> : null}

      {tripsQuery.data ? (
        <FlatList
          data={tripsQuery.data}
          keyExtractor={(trip) => trip.id}
          renderItem={({ item }: { item: Trip }) => (
            <TouchableOpacity style={styles.tripItem} onPress={() => onSelectTrip(item.id)}>
              <Text style={styles.tripName}>{item.name}</Text>
              <Text style={styles.tripParticipants}>{item.participants.length} participant(s)</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun voyage pour le moment.</Text>}
        />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  accountText: {
    color: '#2563eb',
  },
  logoutText: {
    color: '#dc2626',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  createForm: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#dc2626',
    marginBottom: 8,
  },
  loading: {
    marginTop: 16,
  },
  tripItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tripName: {
    fontSize: 16,
  },
  tripParticipants: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 24,
  },
});
