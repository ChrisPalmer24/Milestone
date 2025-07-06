const BASE_URL = "https://eodhd.com/api/"

type EODHDSecurity = {
  Code: string;
  Country: string;
  Currency: string;
  Exchange: string;
  ISIN: string;
  Name: string;
  Type: string;
  previousClose: number;
  previousCloseDate: string;
}

export async function findSecurities(securityIdentifiers: string[]): Promise<EODHDSecurity[]> {
  const EODHD_API_KEY = process.env.EODHD_API_KEY
  const queryParams = securityIdentifiers.join(",")
  const url = `${BASE_URL}/search/${queryParams}?api_token=${EODHD_API_KEY}`
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
  })
  const data = await response.json()
  return data
}
