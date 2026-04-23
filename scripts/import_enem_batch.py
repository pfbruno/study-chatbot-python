import subprocess
import sys
from pathlib import Path

YEARS = [2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

def run_step(command: list[str]) -> tuple[bool, str]:
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="cp1252",
        errors="replace",
    )

    output = (result.stdout or "") + (result.stderr or "")
    return result.returncode == 0, output.strip()

def main() -> int:
    valid_years: list[int] = []
    invalid_years: list[int] = []

    print("=== IMPORTAÇÃO EM LOTE ENEM ===")

    for year in YEARS:
        print(f"\n--- ANO {year} ---")

        file_path = Path(f"data/exams/questions/enem/{year}.json")
        if file_path.exists():
          file_path.unlink()

        steps = [
            [sys.executable, "scripts/import_enem_year.py", str(year)],
            [sys.executable, "scripts/deduplicate_enem_year.py", str(year)],
            [sys.executable, "scripts/validate_enem_year_import.py", str(year)],
            [sys.executable, "scripts/validate_enem_question_bank_year.py", str(year)],
        ]

        year_ok = True

        for step in steps:
            ok, output = run_step(step)
            print(f"\n$ {' '.join(step)}")
            print(output)

            if not ok:
                year_ok = False
                break

        if year_ok:
            valid_years.append(year)
            print(f"[OK] Ano {year} validado.")
        else:
            invalid_years.append(year)
            if file_path.exists():
                file_path.unlink()
            print(f"[FALHA] Ano {year} removido por inconsistência.")

    print("\n=== RESUMO FINAL ===")
    print("Válidos:", valid_years if valid_years else "nenhum")
    print("Inválidos:", invalid_years if invalid_years else "nenhum")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())