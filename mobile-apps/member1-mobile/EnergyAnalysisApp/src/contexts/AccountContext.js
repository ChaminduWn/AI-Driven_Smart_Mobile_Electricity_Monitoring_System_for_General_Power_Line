import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccountContext = createContext(null);

export const useAccount = () => {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
};

export const AccountProvider = ({ children }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('selectedAccount');
        if (stored) setSelectedAccount(stored);
        const accs = await AsyncStorage.getItem('accounts');
        if (accs) setAccounts(JSON.parse(accs));
      } catch (_) {}
    })();
  }, []);

  const selectAccount = async (accountNumber) => {
    setSelectedAccount(accountNumber);
    await AsyncStorage.setItem('selectedAccount', accountNumber);

    // Add to known accounts if not already there
    if (!accounts.includes(accountNumber)) {
      const updated = [...accounts, accountNumber];
      setAccounts(updated);
      await AsyncStorage.setItem('accounts', JSON.stringify(updated));
    }
  };

  const addAccount = async (accountNumber) => {
    if (!accounts.includes(accountNumber)) {
      const updated = [...accounts, accountNumber];
      setAccounts(updated);
      await AsyncStorage.setItem('accounts', JSON.stringify(updated));
    }
    await selectAccount(accountNumber);
  };

  return (
    <AccountContext.Provider value={{ selectedAccount, accounts, selectAccount, addAccount }}>
      {children}
    </AccountContext.Provider>
  );
};