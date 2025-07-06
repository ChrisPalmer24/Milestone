import { findSecurities } from "@server/services/securities"

import dotenv from "dotenv"

dotenv.config({
  path: "./.local.env",
})

console.log("EODHD_API_KEY", process.env.EODHD_API_KEY)

const go = async () => {

  const securities = await findSecurities(["AAPL"])

  console.log(securities)
}

go()
