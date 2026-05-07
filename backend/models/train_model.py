import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

df = pd.read_csv("emails_small.csv")

# 🔥 FIX: force everything to string
df["text"] = df["text"].astype(str)
df["label"] = df["label"].astype(str).str.lower().str.strip()

X = df["text"]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=5000)),
    ("model", LogisticRegression(max_iter=1000))
])

pipeline.fit(X_train, y_train)

acc = pipeline.score(X_test, y_test)

joblib.dump(pipeline, "urgency.pkl")

print("✅ Model trained. Accuracy:", acc)