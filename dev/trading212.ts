

import { getExchanges } from '../server/services/intergration/trading212';

const exchanges = await getExchanges();

console.log(exchanges);
