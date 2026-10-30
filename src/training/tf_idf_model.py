
import pandas as pd
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer

from src.common.config import settings

# File paths
input_file = settings.data_processed_dir / "myntra_preprocessed_products_tokenized_catalog.csv"
output_dir = settings.tfidf_dir
output_dir.mkdir(parents=True, exist_ok=True)

# Load preprocessed dataset
df = pd.read_csv(input_file)

# Handle missing text
texts = df["preprocessed_text"].fillna("").astype(str)

# Initialize TF-IDF vectorizer
tfidf = TfidfVectorizer(
    lowercase=False,  # Text is already lowercased
    ngram_range=(1, 2),
    max_features=90000
)

# Train TF-IDF and transform product text
tfidf_matrix = tfidf.fit_transform(texts)

# Save trained vectorizer
with open(output_dir / "tfidf_vectorizer.pkl", "wb") as f:
    pickle.dump(tfidf, f)

# Save TF-IDF matrix
with open(output_dir / "tfidf_matrix.pkl", "wb") as f:
    pickle.dump(tfidf_matrix, f)

# Save product data for mapping recommendations to products
with open(output_dir / "products.pkl", "wb") as f:
    pickle.dump(df, f)

print("TF-IDF training completed successfully!")
print(f"Products trained: {len(df)}")
print(f"Vocabulary size: {len(tfidf.vocabulary_)}")
print(f"TF-IDF matrix shape: {tfidf_matrix.shape}")
print(f"Models saved in: {output_dir}")
