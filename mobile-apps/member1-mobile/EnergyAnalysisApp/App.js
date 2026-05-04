import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AccountProvider } from './src/contexts/AccountContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { GlobalAlert } from './src/components/GlobalAlert';
import PowerLinkLoading from './src/components/outage/PowerLinkLoading';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <PowerLinkLoading />;
  }

  return (
    <AuthProvider>
      <AccountProvider>
        <SafeAreaProvider>
          <PaperProvider>
            <StatusBar style="light" />
            <RootNavigator />
            <GlobalAlert />
          </PaperProvider>
        </SafeAreaProvider>
      </AccountProvider>
    </AuthProvider>
  );
}