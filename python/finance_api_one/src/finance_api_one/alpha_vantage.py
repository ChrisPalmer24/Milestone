"""
Alpha Vantage API

https://www.alphavantage.co/documentation/

https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo

https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo

"""

from dotenv import load_dotenv
import os
import requests
import asyncio
import json

load_dotenv()

API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
base_url = "https://www.alphavantage.co/query"


async def get_data(function: str, **kwargs) -> dict:
  params = {
    "function": function,
    "apikey": API_KEY
  }
  params.update(kwargs)
  r = requests.get(base_url, params=params)
  data = r.json()
  return data

async def time_series_intraday(symbol: str, interval: str) -> dict:
  return await get_data("TIME_SERIES_INTRADAY", symbol=symbol, interval=interval)


async def time_series_daily(symbol: str) -> dict:
  return await get_data("TIME_SERIES_DAILY", symbol=symbol)

async def market_status() -> dict:
  return await get_data("MARKET_STATUS")

async def ticker_search(keywords: str) -> dict:
  return await get_data("SYMBOL_SEARCH", keywords=keywords)

#premium only
async def real_time_options(symbol: str, require_greeks: bool = False) -> dict:
  return await get_data("REAL_TIME_OPTIONS", symbol=symbol, require_greeks=require_greeks)

async def news_and_sentiments(tickers: list[str]) -> dict:
  return await get_data("NEWS_SENTIMENT", tickers=",".join(tickers))

def main():
  #data = asyncio.run(time_series_intraday("VWRP.LON", "30min"))
  #data = asyncio.run(time_series_intraday("IBM", "5min"))
  #data = asyncio.run(news_and_sentiments(["QUBT", "IBM"]))
  #data = asyncio.run(time_series_daily("VWRP.LON"))

  #data = asyncio.run(time_series_daily("QUBT"))
  #data = asyncio.run(market_status())
  #data = asyncio.run(real_time_options("QUBT"))
  data = asyncio.run(ticker_search("US0378331005"))

  print(json.dumps(data, indent=4))

if __name__ == "__main__":
  main()


