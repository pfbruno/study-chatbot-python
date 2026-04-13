from __future__ import annotations

import argparse

from app.exams.service import import_enem_year


def main() -> None:
    parser = argparse.ArgumentParser(description="Importar provas ENEM")
    parser.add_argument("--start", type=int, default=2009)
    parser.add_argument("--end", type=int, default=2024)
    args = parser.parse_args()

    for year in range(args.start, args.end + 1):
        try:
            result = import_enem_year(year)
            print(f"[OK] ENEM {year} -> exam_id={result['id']}")
        except Exception as exc:  # noqa: BLE001
            print(f"[ERRO] ENEM {year}: {exc}")


if __name__ == "__main__":
    main()
