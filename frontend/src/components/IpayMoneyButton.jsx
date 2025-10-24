/**
 * Fichier: src/components/IpayMoneyButton.jsx
 * 
 * Description (FR):
 * - Composant React pour le bouton de paiement IpayMoney
 * - Gère l'intégration du SDK IpayMoney
 * - Crée des transactions uniques pour chaque commande
 * 
 * Fonctionnalités :
 * - Chargement dynamique du SDK IpayMoney
 * - Génération d'ID de transaction unique
 * - Gestion des erreurs de paiement
 * - Redirection après paiement
 */

import React, { useEffect, useState } from 'react';
import api from '../api';

const IpayMoneyButton = ({ orderId, amount, onSuccess, onError }) => {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState(null);

    // Chargement de la configuration IpayMoney
    useEffect(() => {
        const loadIpayMoneyConfig = async () => {
            try {
                const response = await api.get('/api/ipaymoney/config/');
                setConfig(response.data);
            } catch (error) {
                console.error('Erreur chargement config IpayMoney:', error);
                onError?.('Erreur de configuration de paiement');
            }
        };

        loadIpayMoneyConfig();
    }, [onError]);

    // Génération d'un ID de transaction unique
    const generateTransactionId = () => {
        return `TECHSHOP-${orderId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Initialisation du paiement IpayMoney
    const handleIpayMoneyPayment = async () => {
        if (!config) {
            onError?.('Configuration de paiement non chargée');
            return;
        }

        setLoading(true);

        try {
            const transactionId = generateTransactionId();
            
            // Création du bouton IpayMoney dynamiquement
            const button = document.createElement('button');
            button.className = 'ipaymoney-button';
            button.setAttribute('data-amount', Math.round(amount * 100)); // Conversion en centimes
            button.setAttribute('data-environement', config.environment);
            button.setAttribute('data-key', config.public_key);
            button.setAttribute('data-transaction-id', transactionId);
            button.setAttribute('data-redirect-url', `${window.location.origin}/payment/success/?order_id=${orderId}`);
            button.setAttribute('data-callback-url', config.callback_url);
            button.innerHTML = 'Payer avec IpayMoney';
            
            // Style optionnel du bouton
            button.style.cssText = `
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin: 10px 0;
            `;

            // Simulation du clic
            document.body.appendChild(button);
            button.click();
            document.body.removeChild(button);

            // Le SDK IpayMoney gère le reste
            console.log('Paiement IpayMoney initié pour la commande:', orderId);

        } catch (error) {
            console.error('Erreur initialisation paiement IpayMoney:', error);
            onError?.('Erreur lors du lancement du paiement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ipaymoney-container">
            <button
                onClick={handleIpayMoneyPayment}
                disabled={loading || !config}
                className="ipaymoney-custom-button"
                style={{
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    margin: '10px 0',
                    opacity: loading ? 0.6 : 1
                }}
            >
                {loading ? 'Chargement...' : 'Payer avec IpayMoney'}
            </button>
            
            {!config && (
                <p style={{ color: 'red', fontSize: '14px' }}>
                    Configuration de paiement indisponible
                </p>
            )}
        </div>
    );
};

export default IpayMoneyButton;
