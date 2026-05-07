import pandas as pd

# =========================================
# LOAD YOUR DATASET
# =========================================
df = pd.read_csv("emails.csv")   # adjust path if needed

print("Original columns:", df.columns)

# =========================================
# HANDLE DIFFERENT COLUMN NAMES
# =========================================

# Enron CSVs sometimes have different column names
subject_col = None
body_col = None

for col in df.columns:
    if "subject" in col.lower():
        subject_col = col
    if "body" in col.lower() or "message" in col.lower():
        body_col = col

# fallback (if not found)
if subject_col is None:
    subject_col = df.columns[0]

if body_col is None:
    body_col = df.columns[-1]

print("Using columns →", subject_col, "|", body_col)

# =========================================
# CREATE TEXT FIELD
# =========================================
df["text"] = (
    df[subject_col].fillna("") + " " +
    df[body_col].fillna("")
)

# keep it small for speed
df = df.sample(n=min(3000, len(df)), random_state=42)

# =========================================
# LABELING FUNCTION
# =========================================
def label_email(text):
    text = text.lower()

    urgent_keywords = [
        "interview", "deadline", "urgent", "meeting",
        "project", "submission", "offer",
        "apply", "shortlisted", "last date", "asap"
    ]

    for word in urgent_keywords:
        if word in text:
            return 1

    return 0


df["label"] = df["text"].apply(label_email)

# =========================================
# CLEAN TEXT (IMPORTANT)
# =========================================
df["text"] = df["text"].str.replace("\n", " ", regex=False)
df["text"] = df["text"].str.replace("\r", " ", regex=False)
df["text"] = df["text"].str.slice(0, 1000)  # truncate

# =========================================
# FINAL DATASET
# =========================================
final_df = df[["text", "label"]]
final_df.to_csv("emails_small.csv", index=False)


print("✅ Dataset ready:", len(final_df))
print(final_df["label"].value_counts())