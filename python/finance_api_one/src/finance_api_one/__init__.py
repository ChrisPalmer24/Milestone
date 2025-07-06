# mypackage/__init__.py
from . import alpha_vantage
from . import open_figi
from . import eodhd

__version__ = "1.0.0"

def package_level_function():
    print("This is a package-level function.")

__all__ = ["alpha_vantage", "package_level_function", "open_figi", "eodhd"]
