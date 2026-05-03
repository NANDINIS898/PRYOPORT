import joblib
import os

MODEL_PATH = os.path.join("models", "urgency.pkl")

model = joblib.load(MODEL_PATH)


def predict_urgency(text):
    prob = model.predict_proba([text])[0][1]   # probability of urgent

    score = round(prob * 100, 2)

    priority = "high" if score >= 70 else "low"

    return {
        "score": score,
        "priority": priority
    }