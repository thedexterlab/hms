import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tests exercise the demo-login and mock-data paths, so mock auth stays
  // enabled in the test environment only.
  define: {
    'import.meta.env.VITE_USE_MOCK_AUTH': JSON.stringify('true'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true,
  },
});
