import pandas as pd
from pathlib import Path

from src.common.config import settings

input_file = settings.data_processed_dir / "myntra_preprocessed_products_catalog.csv"
output_file = settings.data_processed_dir / "myntra_preprocessed_products_tokenized_catalog.csv"

df = pd.read_csv(input_file)

df["preprocessed_text"] = (
    df["preprocessed_text"].fillna("").astype(str)
)

# Convert each product's text into a list of words
df["tokens"] = df["preprocessed_text"].apply(str.split)

Path(output_file).parent.mkdir(parents=True, exist_ok=True)
df.to_csv(output_file, index=False)

print("Tokenization completed!")
print(df[["mpn", "preprocessed_text", "tokens"]].head())