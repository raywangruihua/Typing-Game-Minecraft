"""
Parser to parse text into quotes for typing game.
"""

import argparse, sys, re

parser = argparse.ArgumentParser()
parser.add_argument("path", help="path of text file to parse")
args = parser.parse_args()

path = args.path
path_split = re.split(r"[./]+", path)

if path_split[-1] != "txt":
    print(f"Error: {path_split[-2:]} is not a text file.")
    sys.exit(1)

outpath = "text/" + f"{path_split[-2]}" + "." + f"{path_split[-1]}"

try:
    with open(path, "r") as infile, open(outpath, "w") as outfile:
        for line in infile:
            quotes = re.split(r"[.?!\n]+", line)
            for quote in quotes:
                if quote != "":
                    outfile.write(quote.strip() + "\n")
except FileNotFoundError:
    print(f"Error: {path} not found.")
    sys.exit(1)