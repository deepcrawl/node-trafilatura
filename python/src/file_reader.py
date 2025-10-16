from pathlib import Path


def read_file_content(file_path: str) -> str:
    """
    Read the raw content of a file.

    Args:
        file_path: Path to the file to read

    Returns:
        Raw file content as a string

    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If the path is not a file
        IOError: If there's an error reading the file
    """
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if not path.is_file():
        raise ValueError(f"Path is not a file: {file_path}")

    try:
        content = path.read_text(encoding="utf-8")
    except Exception as e:
        raise IOError(f"Error reading file: {e}")

    return content
