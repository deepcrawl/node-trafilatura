import sys
from typing import Tuple


def get_args_from_command_line() -> Tuple[str, str]:
    """
    Get the file path and output format from command-line arguments.

    Returns:
        A tuple of (file_path, output_format)

    Raises:
        ValueError: If required arguments are missing or invalid
    """
    if len(sys.argv) < 3:
        raise ValueError("Usage: <script> <file_path> <output_format>")

    file_path = sys.argv[1]
    output_format = sys.argv[2]

    valid_formats = ["html", "txt"]
    if output_format not in valid_formats:
        raise ValueError(
            f"Invalid output format: {output_format}. Valid formats: {', '.join(valid_formats)}"
        )

    return file_path, output_format
