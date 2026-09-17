import { defineConfig } from 'vite';
// rapier3d-compat bundles the physics wasm as one ~2 MB inlined chunk; warning limit set above that so CI logs stay clean.
export default defineConfig({ base: './', build: { target: 'es2022', chunkSizeWarningLimit: 2200, rollupOptions: { output: { manualChunks: { three: ['three'], rapier: ['@dimforge/rapier3d-compat'] } } } } });
