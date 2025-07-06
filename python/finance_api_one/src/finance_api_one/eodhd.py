

from eodhd import APIClient

import pandas as pd

import dotenv
import os

from typing import List

from pydantic import BaseModel, TypeAdapter, RootModel

class EODHDResponseItem(BaseModel):
  date: str
  open: float
  high: float
  low: float
  close: float
  adjusted_close: float
  volume: int

class EODHDResponseItemList(RootModel[List[EODHDResponseItem]]):
   pass


dotenv.load_dotenv()

EODHD_API_KEY = os.getenv("EODHD_API_KEY")

api = APIClient(api_key=EODHD_API_KEY)

def main():
    data = api.get_eod_historical_stock_market_data(symbol = 'AAPL.MX', period='d', from_date = '2025-01-01', to_date = '2025-01-15', order='a')
    
    # parsed = TypeAdapter(list[EODHDResponseItem]).validate_python(data)
    parsed = TypeAdapter(EODHDResponseItemList).validate_python(data)
    #parsed = EODHDResponseItemList.model_validate(data)
    
    print(parsed.root[0])

if __name__ == "__main__":
    main()









