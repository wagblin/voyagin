import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import * as authApi from '../lib/authApi';

export interface AccountScreenProps {
  onBack: () => void;
}

export function AccountScreen({ onBack }: AccountScreenProps) {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await authApi.updateMe({ name, email });
      await updateUser(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert('Supprimer mon compte', 'Supprimer définitivement ton compte ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => void confirmDeleteAccount() },
    ]);
  }

  async function confirmDeleteAccount() {
    setIsDeleting(true);
    try {
      await authApi.deleteMe();
    } finally {
      await logout();
      setIsDeleting(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} testID="account-back-button">
        <Text style={styles.backText}>{'< Retour'}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mon compte</Text>

      <Text style={styles.label}>Nom</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        testID="account-name-input"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="account-email-input"
      />

      {error !== null ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => void handleSave()}
        disabled={isSubmitting}
        testID="account-save-button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutRow}
        onPress={() => void logout()}
        testID="account-logout-button"
      >
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
        disabled={isDeleting}
        testID="account-delete-button"
      >
        <Text style={styles.deleteButtonText}>
          {isDeleting ? 'Suppression…' : 'Supprimer mon compte'}
        </Text>
      </TouchableOpacity>
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
  logoutRow: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
