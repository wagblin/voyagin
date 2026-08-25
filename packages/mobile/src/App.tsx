import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthScreen } from './screens/AuthScreen';
import { TripsListScreen } from './screens/TripsListScreen';
import { TripDetailScreen } from './screens/TripDetailScreen';
import { AccountScreen } from './screens/AccountScreen';

const queryClient = new QueryClient();

type Screen = 'trips' | 'account' | { type: 'trip'; id: string };

function Navigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('trips');

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (screen === 'trips') {
    return (
      <TripsListScreen
        onSelectTrip={(id) => setScreen({ type: 'trip', id })}
        onOpenAccount={() => setScreen('account')}
      />
    );
  }

  if (screen === 'account') {
    return <AccountScreen onBack={() => setScreen('trips')} />;
  }

  return <TripDetailScreen tripId={screen.id} onBack={() => setScreen('trips')} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
