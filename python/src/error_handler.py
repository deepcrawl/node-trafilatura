import sys
from typing import Callable, TypeVar

T = TypeVar("T")


def run_with_error_handling(func: Callable[[], T]) -> T:
    """
    Run a function with error handling, writing errors to stderr and exiting on failure.

    Args:
        func: A callable function to execute

    Returns:
        The return value of the function

    Raises:
        SystemExit: Always exits with code 1 on any error
    """
    try:
        return func()
    except ValueError as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
    except FileNotFoundError as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
    except IOError as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)
    except Exception as e:
        sys.stderr.write(f"Unexpected error: {e}\n")
        sys.exit(1)
