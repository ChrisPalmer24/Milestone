

import fetch from 'node-fetch';

const API_KEY = process.env.TRADING_212_API_KEY;



export async function getExchanges() {

  if (!API_KEY) {
    throw new Error('TRADING_212_API_KEY is not set');
  }

  console.log(API_KEY);

  const resp = await fetch(
    `https://demo.trading212.com/api/v0/equity/metadata/exchanges`,
    {
      method: 'GET',
      headers: {
        Authorization: API_KEY,
      },
    }
  );

  console.log(resp);

  if (!resp.ok) {
    throw new Error('Failed to fetch exchanges');
  }



  const data = await resp.json();

  return data;
}
