from trafilatura import extract
from file_reader import read_file_content
from arg_parser import get_args_from_command_line
from error_handler import run_with_error_handling


def main():
    def run():
        file_path, output_format = get_args_from_command_line()
        content = read_file_content(file_path)
        extracted = extract(content, favor_recall=True, output_format=output_format)
        print(extracted)

    run_with_error_handling(run)


if __name__ == "__main__":
    main()
