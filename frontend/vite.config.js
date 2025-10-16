/**
 * Fichier: vite.config.js
 * 
 * Description (FR):
 * - Configuration de Vite pour le projet React (frontend)
 * - Vite est un outil de build rapide pour les applications web modernes
 * - Définit les plugins et options de configuration pour le développement et la production
 * 
 * Configuration principale :
 * - Plugin React pour le support JSX/TSX
 * - Serveur de développement avec rechargement à chaud (HMR)
 * - Build optimisé pour la production
 * 
 * Connexions :
 * - Utilisé par `package.json` dans les scripts "dev", "build", "preview"
 * - Interagit avec le dossier `src/` contenant le code source React
 * - Génère les fichiers finaux dans le dossier `dist/` pour la production
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: {
  //   host: '0.0.0.0',  // Toujours accepter les connexions réseau
  //   port: 5173,
  // }
})