/**
 * Fichier: eslint.config.js
 * 
 * Description (FR):
 * - Configuration ESLint pour la qualité et la cohérence du code React
 * - Définit les règles de linting pour JavaScript/JSX
 * - Configure les environnements et plugins pour le développement React
 * 
 * Configuration principale :
 * - Ignore le dossier `dist/` (fichiers de build)
 * - Support JSX et modules ES6
 * - Règles recommandées pour React Hooks
 * - Règles de rafraîchissement à chaud (Hot Reload)
 * 
 * Connexions :
 * - Utilisé par le script "lint" dans package.json
 * - S'applique à tous les fichiers .js et .jsx du projet
 * - Intègre les configurations recommandées de ESLint et React
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },  // Ignore le dossier de build dist/
  {
    files: ['**/*.{js,jsx}'],  // Applique à tous les fichiers JS/JSX
    languageOptions: {
      ecmaVersion: 2020,  // Version ECMAScript supportée
      globals: globals.browser,  // Variables globales du navigateur
      parserOptions: {
        ecmaVersion: 'latest',  // Dernière version ECMAScript
        ecmaFeatures: { jsx: true },  // Active le support JSX
        sourceType: 'module',  // Utilise les modules ES6
      },
    },
    plugins: {
      'react-hooks': reactHooks,  // Plugin pour les règles React Hooks
      'react-refresh': reactRefresh,  // Plugin pour React Refresh
    },
    rules: {
      ...js.configs.recommended.rules,  // Règles recommandées ESLint
      ...reactHooks.configs.recommended.rules,  // Règles recommandées React Hooks
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],  // Variables non utilisées (sauf constantes)
      'react-refresh/only-export-components': [  // Règle pour React Refresh
        'warn',
        { allowConstantExport: true },  // Autorise l'export de constantes
      ],
    },
  },
]