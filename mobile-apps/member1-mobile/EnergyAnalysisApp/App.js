import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AccountProvider } from './src/contexts/AccountContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AccountProvider>
    </AuthProvider>
  );
}