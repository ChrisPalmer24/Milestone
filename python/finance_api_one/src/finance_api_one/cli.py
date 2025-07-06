import asyncio
import json
from finance_api_one.alpha_vantage import news_and_sentiments

def main():
  data = asyncio.run(news_and_sentiments(["QUBT", "IBM"]))
  print(json.dumps(data, indent=4))

if __name__ == "__main__":
  main()
