import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppQueryClientProvider } from '@/app/providers/query-client';
import { AppearanceProvider } from '@/app/providers/appearance-provider';
import { AppRouter } from '@/app/router';

export function App() {
  return (
    <AppQueryClientProvider>
      <AppearanceProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-right" richColors closeButton duration={4000} />
        </BrowserRouter>
      </AppearanceProvider>
    </AppQueryClientProvider>
  );
}
