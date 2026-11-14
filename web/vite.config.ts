import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // The api's CORS allows exactly this origin, so fail loudly if the port is
  // taken rather than silently moving to 5174.
  server: { port: 5173, strictPort: true },
});
