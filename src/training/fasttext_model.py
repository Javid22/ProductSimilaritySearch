
import pandas as pd
import pickle
from gensim.models import FastText

from src.common.config import settings

# File paths
input_file = settings.data_processed_dir / "myntra_preprocessed_products_tokenized_catalog.csv"
output_dir = settings.fasttext_dir
output_dir.mkdir(parents=True, exist_ok=True)

# Load preprocessed dataset
df = pd.read_csv(input_file)

# Handle missing values and tokenize text
texts = df["preprocessed_text"].fillna("").astype(str)
sentences = texts.apply(str.split).tolist()

# Initialize and train FastText
fasttext_model = FastText(
    sentences=sentences,
    vector_size=100,  # Embedding dimensions
    window=5,         # Context window size
    min_count=2,      # Ignore words appearing fewer than 2 times
    workers=4,
    sg=1,             # 1 = Skip-gram, 0 = CBOW
    epochs=20,
    min_n=3,
    max_n=6
)

# Save trained model as a pickle file
with open(output_dir / "fasttext_model.pkl", "wb") as f:
    pickle.dump(fasttext_model, f)

print("fasttext training completed successfully!")
print(f"Total products: {len(df)}")
print(f"Vocabulary size: {len(fasttext_model.wv)}")
print(f"Vector dimensions: {fasttext_model.vector_size}")
print(f"Model saved to: {output_dir / 'fasttext/fasttext_model.pkl'}")
