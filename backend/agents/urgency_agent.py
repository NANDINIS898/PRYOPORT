from models.urgency_model import predict_urgency


def detect_urgency(category, subject, snippet):
    text = f"{category} {subject} {snippet}"

    result = predict_urgency(text)

    return result