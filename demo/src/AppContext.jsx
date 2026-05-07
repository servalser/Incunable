/**
 * AppContext — remplace les props partagées Inertia (auth, flash, appConfig).
 * Toutes les pages y accèdent via usePage() dans le shim.
 */
import { createContext, useContext, useState } from 'react';
import { auth, appConfig, flash } from './mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Les toasts flash peuvent être déclenchés manuellement dans la démo
  const [demoFlash, setDemoFlash] = useState(flash);

  const showSuccess = (msg) => setDemoFlash({ success: msg, error: null });
  const showError   = (msg) => setDemoFlash({ success: null, error: msg });
  const clearFlash  = ()    => setDemoFlash({});

  const props = {
    auth,
    appConfig,
    flash: demoFlash,
  };

  return (
    <AppContext.Provider value={{ props, showSuccess, showError, clearFlash }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook utilisé par le shim à la place de usePage()
export function useAppContext() {
  return useContext(AppContext);
}
