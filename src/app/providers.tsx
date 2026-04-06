'use client';

import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(212, 160, 23, 0.1)',
            color: '#fff',
          },
        }}
      />
      {children}
    </>
  );
}
