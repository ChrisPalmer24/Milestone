from .src.finance_api_one import alpha_vantage

__version__ = "1.0.0"

def package_level_function():
    print("This is a package-level function.")

__all__ = ["alpha_vantage", "package_level_function"]
