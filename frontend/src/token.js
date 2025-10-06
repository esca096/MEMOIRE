/**
 * Fichier: constants.js (ou le fichier contenant ces constantes)
 * 
 * Description (FR):
 * - Définit les clés de stockage pour les tokens d'authentification et les clés API
 * - Centralise les noms des clés utilisées dans le localStorage et les appels API
 * - Assure la cohérence dans tout l'application pour la gestion des tokens
 * 
 * Constantes principales :
 * - Tokens JWT pour l'authentification standard
 * - Token Google pour l'authentification OAuth
 * - Clé publique Stripe pour les paiements
 * 
 * Connexions :
 * - Utilisé par les services d'authentification (auth.js)
 * - Référencé dans les composants qui gèrent l'authentification
 * - Intégré avec les intercepteurs Axios pour les requêtes API
 */

export const ACCESS_TOKEN = 'access';           // Token d'accès JWT
export const REFRESH_TOKEN = 'refresh';         // Token de rafraîchissement JWT  
export const GOOGLE_ACCESS_TOKEN = 'google_access_token';  // Token d'accès Google OAuth
export const STRIPE_PUB_KEY = 'stripe_pub_key'; // Clé publique Stripe pour les paiements