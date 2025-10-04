import api from '../api';
import { ACCESS_TOKEN, GOOGLE_ACCESS_TOKEN } from '../token';


export const fetchCart = async () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    const googleAccessToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN);

    // determin token to use

    const headers = {};
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    } else if (googleAccessToken) {
        headers['X-Google-Access-Token'] = googleAccessToken;
    }else {
        throw new Error('No access token found');
    }

    // fetch our cart
    const response = await api.get('api/cart/', {headers});
    return response.data.items;
};

// function to updat carts items
export const updateCart =  async (cartItems) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN);
    const googleAccessToken = localStorage.getItem(GOOGLE_ACCESS_TOKEN);

    // determin token to use
    const headers = {};
    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    } else if (googleAccessToken) {
        headers['X-Google-Access-Token'] = googleAccessToken;
    }else {
        throw new Error('No access token found');
    }

    // update our cart
    await api.put('api/cart/', { items: cartItems }, { headers });
    
}