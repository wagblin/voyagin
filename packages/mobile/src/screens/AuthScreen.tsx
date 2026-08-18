import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';

type Mode = 'login' | 'register';

export function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register({ email, name, password });
      } else {
        await login({ email, password });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleMode() {
    setError(null);
    setMode(isRegister ? 'login' : 'register');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VoyagIn</Text>
      <Text style={styles.subtitle}>{isRegister ? 'Créer un compte' : 'Se connecter'}</Text>

      {isRegister ? (
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          testID="auth-name-input"
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="auth-email-input"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="auth-password-input"
      />

      {error !== null ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => void handleSubmit()}
        disabled={isSubmitting}
        testID="auth-submit-button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{isRegister ? "S'inscrire" : 'Se connecter'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleMode} testID="auth-toggle-mode">
        <Text style={styles.toggleText}>
          {isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
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
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleText: {
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 8,
  },
});
