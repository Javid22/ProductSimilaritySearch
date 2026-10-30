import pandas as pd

from src.common.config import settings

# Input and output paths
input_file = settings.data_raw_dir / "Myntra_fashion_products.csv"

output_dir = settings.data_processed_dir
output_file = output_dir / "myntra_processed_products_catalog.csv"

# Create output directory if it doesn't exist
output_dir.mkdir(parents=True, exist_ok=True)

# Load dataset
df = pd.read_csv(input_file)

# Columns to combine
text_columns = [
    "name",
    "brand",
    "gender",
    "price",
    "description",
]

# Check for missing columns
missing_columns = [col for col in text_columns if col not in df.columns]
if missing_columns:
    raise ValueError(f"Missing columns in dataset: {missing_columns}")

# Handle missing values and combine columns
df["combined_text"] = (
    "product: " + df["name"].fillna("").astype(str) +
    " brand: " + df["brand"].fillna("").astype(str) +
    " gender: " + df["gender"].fillna("").astype(str) +
    " price: " + df["price"].fillna("").astype(str) +
    " description: " + df["description"].fillna("").astype(str)
)

# Save processed dataset
df.to_csv(output_file, index=False, encoding="utf-8")

print(f"Processed dataset saved to: {output_file}")
print(f"Total products processed: {len(df)}")
print(df[["mpn", "combined_text"]].head())