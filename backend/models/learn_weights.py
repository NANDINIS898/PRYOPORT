import json

def update_weights(category, feedback_score):
    try:
        with open("models/category_weights.json", "r") as f:
            weights = json.load(f)
    except:
        weights = {}

    weights[category] = weights.get(category, 0) + feedback_score

    with open("models/category_weights.json", "w") as f:
        json.dump(weights, f)