"""
Fichier: api/views_ipaymoney.py

Description (FR):
- Gère les callbacks et webhooks de IpayMoney
- Met à jour le statut des commandes après paiement
- Valide les signatures IpayMoney pour la sécurité
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import json
import hashlib
import hmac
from .models import Order

# =============================================================================
# CONFIGURATION IPAYMONEY
# =============================================================================
IPAYMONEY_SECRET_KEY = getattr(settings, 'IPAYMONEY_SECRET_KEY', 'votre_secret_key_ici')
IPAYMONEY_PUBLIC_KEY = getattr(settings, 'IPAYMONEY_PUBLIC_KEY', 'votre_public_key_ici')

@csrf_exempt
def ipaymoney_callback(request):
    """
    Endpoint pour recevoir les confirmations de paiement IpayMoney (webhook)
    
    Fonctionnement :
    - IpayMoney envoie une requête POST avec les détails du paiement
    - On vérifie la signature pour sécurité
    - On met à jour le statut de la commande
    
    URL: /api/ipaymoney/callback/
    Méthode: POST
    """
    
    if request.method != 'POST':
        return JsonResponse({'error': 'Méthode non autorisée'}, status=405)
    
    try:
        # Récupération des données
        data = json.loads(request.body)
        print("Callback IpayMoney reçu:", data)
        
        # Extraction des données importantes
        transaction_id = data.get('transaction_id')
        order_reference = data.get('order_id')  # Notre référence de commande
        status = data.get('status')
        amount = data.get('amount')
        signature = data.get('signature')
        
        # Validation des données requises
        if not all([transaction_id, order_reference, status, amount]):
            return JsonResponse({'error': 'Données manquantes'}, status=400)
        
        # Vérification de la signature (sécurité)
        if not verify_ipaymoney_signature(data, signature):
            return JsonResponse({'error': 'Signature invalide'}, status=400)
        
        # Recherche de la commande
        try:
            order = Order.objects.get(id=order_reference)
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Commande non trouvée'}, status=404)
        
        # Traitement selon le statut
        if status.upper() == 'SUCCESS':
            # Paiement réussi
            order.status = Order.COMPLETED
            order.payment_completed = True
            order.payement_id = transaction_id  # Stocke l'ID de transaction IpayMoney
            order.save()
            
            print(f"Commande {order.id} marquée comme payée via IpayMoney")
            return JsonResponse({'status': 'success', 'message': 'Paiement confirmé'})
        
        elif status.upper() in ['FAILED', 'CANCELLED']:
            # Paiement échoué
            order.status = Order.CANCELLED
            order.save()
            
            return JsonResponse({'status': 'success', 'message': 'Statut mis à jour'})
        
        else:
            # Statut inconnu
            return JsonResponse({'error': 'Statut non reconnu'}, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON invalide'}, status=400)
    except Exception as e:
        print(f"Erreur callback IpayMoney: {str(e)}")
        return JsonResponse({'error': 'Erreur interne du serveur'}, status=500)

@csrf_exempt
def ipaymoney_redirect(request):
    """
    Endpoint pour la redirection après paiement
    
    Fonctionnement :
    - L'utilisateur est redirigé ici après le paiement
    - On affiche une page de confirmation
    - On peut vérifier le statut du paiement
    
    URL: /payment/success/
    Méthode: GET
    """
    
    # Récupération des paramètres URL
    transaction_id = request.GET.get('transaction_id')
    order_id = request.GET.get('order_id')
    status = request.GET.get('status')
    
    context = {
        'transaction_id': transaction_id,
        'order_id': order_id,
        'status': status,
        'success': status.upper() == 'SUCCESS'
    }
    
    # En mode API, on retourne du JSON
    return JsonResponse(context)

def verify_ipaymoney_signature(data, received_signature):
    """
    Vérifie la signature IpayMoney pour sécurité
    
    Args:
        data: Données reçues
        received_signature: Signature fournie
    
    Returns:
        bool: True si signature valide
    """
    # NOTE: IpayMoney peut avoir son propre algorithme de signature
    # À adapter selon leur documentation
    
    # Pour l'instant, on accepte toutes les signatures en développement
    if settings.DEBUG:
        return True
    
    # En production, implémentez la vérification réelle
    # Généralement: hmac avec votre secret key
    expected_signature = hmac.new(
        IPAYMONEY_SECRET_KEY.encode(),
        json.dumps(data, sort_keys=True).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(expected_signature, received_signature)

def get_ipaymoney_config(request):
    """
    Endpoint pour récupérer la configuration IpayMoney côté frontend
    
    Fonctionnement :
    - Retourne la clé publique et autres configs
    - Sécurisé - ne renvoie pas la clé secrète
    
    URL: /api/ipaymoney/config/
    Méthode: GET
    """
    
    config = {
        'public_key': IPAYMONEY_PUBLIC_KEY,
        'environment': 'live',  # ou 'test' en développement
        'callback_url': f"{request.scheme}://{request.get_host()}/api/ipaymoney/callback/",
        'redirect_url': f"{request.scheme}://{request.get_host()}/payment/success/",
    }
    
    return JsonResponse(config)
