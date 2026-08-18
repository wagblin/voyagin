import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { useHealth } from './hooks/useHealth';

const queryClient = new QueryClient();

function ApiStatus() {
  const health = useHealth();

  if (health.isPending) {
    return <Text style={styles.status}>{"Connexion à l'API…"}</Text>;
  }

  if (health.isError) {
    return <Text style={styles.statusError}>API injoignable : {health.error.message}</Text>;
  }

  return <Text style={styles.status}>API : {health.data.status}</Text>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        <Text style={styles.title}>VoyagIn</Text>
        <Text style={styles.subtitle}>Le carnet de voyage collaboratif en temps réel.</Text>
        <ApiStatus />
        <StatusBar style="auto" />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  status: {
    color: '#6b7280',
  },
  statusError: {
    color: '#dc2626',
  },
});
