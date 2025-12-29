import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    base: '/mer-algorithm/', // For GitHub Pages
    resolve: {
        alias: {
            '@src': path.resolve(__dirname, '../src')
        }
    },
    server: {
        fs: {
            // Allow serving files from one level up to the project root
            allow: ['..']
        }
    }
});
