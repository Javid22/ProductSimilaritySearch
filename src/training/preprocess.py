
import pandas as pd
from pathlib import Path

from src.common.config import settings
from src.common.preprocess import preprocess_text

# File paths
input_file = settings.data_processed_dir / "myntra_processed_products_catalog.csv"
output_file = settings.data_processed_dir / "myntra_preprocessed_products_catalog.csv"


def preprocess_dataset(input_file, output_file):
    # Load dataset
    df = pd.read_csv(input_file)

    if "combined_text" not in df.columns:
        raise ValueError("The dataset must contain 'combined_text'.")

    # Apply preprocessing
    df["preprocessed_text"] = df["combined_text"].apply(
        preprocess_text
    )

    # Ensure output directory exists
    Path(output_file).parent.mkdir(
        parents=True, exist_ok=True
    )

    # Save processed dataset
    df.to_csv(output_file, index=False, encoding="utf-8")

    print(f"Preprocessing completed: {output_file}")
    print(f"Total products: {len(df)}")
    print(df[["combined_text", "preprocessed_text"]].head())


if __name__ == "__main__":
    preprocess_dataset(input_file, output_file)
