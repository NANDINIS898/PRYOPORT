import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import joblib

# sample dataset (replace later with real csv)
data = {
    "text": [
        "Interview tomorrow at 10 AM",
        "Apply now internship closes tonight",
        "Reminder assignment deadline today",
        "Big sale 50 off",
        "Your friend tagged you",
        "Weekly newsletter update",
        "Hackathon registration ends soon",
        "Meeting rescheduled urgent response needed"
    ],
    "label": [1,1,1,0,0,0,1,1]
}

df = pd.DataFrame(data)

X = df["text"]
y = df["label"]

pipeline = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("model", LogisticRegression())
])

pipeline.fit(X, y)

joblib.dump(pipeline, "models/urgency.pkl")

print("Model trained and saved.")