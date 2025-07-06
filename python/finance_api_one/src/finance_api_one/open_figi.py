

from dotenv import load_dotenv
import os
import requests
import asyncio
import json
import urllib.parse

load_dotenv()

OPENFIGI_API_KEY = os.getenv("OPENFIGI_API_KEY")
base_url = "https://api.openfigi.com"

JsonType = None | int | str | bool | list["JsonType"] | dict[str, "JsonType"]

def api_call(
    path: str,
    data: dict | None = None,
    method: str = "POST",
) -> JsonType | None:
    """
        Make an api call to `api.openfigi.com`.
        Uses builtin `urllib` library, end users may prefer to
        swap out this function with another library of their choice

        Args:
            path (str): API endpoint, for example "search"
            method (str, optional): HTTP request method. Defaults to "POST".
            data (dict | None, optional): HTTP request data. Defaults to None.

        Returns:
            JsonType: Response of the api call parsed as a JSON object
    """
  
    headers = {"Content-Type": "application/json"}

    print("OPENFIGI_API_KEY: ", OPENFIGI_API_KEY)

    if OPENFIGI_API_KEY:
        headers |= {"X-OPENFIGI-APIKEY": OPENFIGI_API_KEY}

    # params = {
    #     "path": path,
    #     "data": data,
    #     "headers": headers
    # }

    url = urllib.parse.urljoin(base_url, path)

    print("Data: ", data)
    print("Headers: ", headers)
    print("URL: ", url)

    r = requests.request(method, url, timeout=10, data=data, headers=headers)
    
    print("status code: ", r.status_code)

    if(r.status_code != 200):
        print("Error: ", r.status_code)
        print("Error: ", r.text)
        return None
    
    data = r.json()
    return data


def main():
    """
    Make search and mapping API requests and print the results
    to the console

    Returns:
        None
    """
    search_request = {"query": "APPLE"}
    print("Making a search request:", search_request)
    search_response = api_call("/v3/search", data=json.dumps(search_request))
    if(search_response is None):
        print("v3/search Error: ", search_response)
    else:
        print("Search response:", json.dumps(search_response, indent=2))

    mapping_request = [
        {"idType":"ID_BB_GLOBAL","idValue":"BBG000BLNNH6"," ":"US"},
    ]
    print("Making a mapping request:", mapping_request)
    mapping_response = api_call("/v3/mapping", data=json.dumps(mapping_request))
    if(mapping_response is None):
        print("v3/mapping Error: ", mapping_response)
    else:
        print("Mapping response:", json.dumps(mapping_response, indent=2))

    print("Getting Values")
    
    value_response = api_call("/v3/mapping/values/marketSecDes", method="GET")
    if(value_response is None):
        print("v3/mapping/values/marketSecDes Error: ", value_response)
    else:
        print("Values response:", json.dumps(value_response, indent=2))



if __name__ == "__main__":
    main()
