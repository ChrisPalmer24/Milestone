

import { getExchanges } from '../server/services/intergration/trading212';

// const exchanges = await getExchanges()
// .catch(err => {
//   console.log("Error fetching exchanges");
//   console.error(err);
// });

// console.log(exchanges);

const openPositions = await getOpenPositions()
.catch(err => {
  console.log("Error fetching open positions");
  console.error(err);
});

console.log(openPositions);
