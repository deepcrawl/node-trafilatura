from trafilatura import extract
from pathlib import Path
import sys

def main():
  if len(sys.argv) < 2:
    sys.stderr.write("Missing argument: file path\n")
    sys.exit(1)

  file_path = sys.argv[1]
  path = Path(file_path)

  if not path.exists() or not path.is_file():
    sys.stderr.write(f"Invalid file path: {file_path}\n")
    sys.exit(1)

  try:
    content = path.read_text(encoding='utf-8')
  except Exception as e:
    sys.stderr.write(f"Read error: {e}\n")
    sys.exit(1)

  extracted = extract(content, favor_recall=True)

  print(extracted)

if __name__ == "__main__":
  main()
