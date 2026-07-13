from pathlib import Path
import pickle
import re

import numpy as np
STOPWORDS = {
    "the","a","an","is","it","in","on","at","to","for","of","and","or",
    "but","i","was","this","that","with","as","be","have","had","he",
    "she","they","we","are","were","been","has","do","did","not","by",
    "from","its","my","our","your","their","so","if","about","which",
    "would","could","should","more","also","just","than","then","when",
    "there","what","all","can","will","one","into","up","out","no","get"
}

def clean_text(text):
    text  = re.sub(r'<[^>]+>', ' ', text)      
    text  = re.sub(r"[^a-zA-Z']", ' ', text)    
    words = text.lower().split()
    words = [w for w in words if w not in STOPWORDS and len(w) > 1]
    return words

def get_ngrams(words):
    bigrams = [words[i] + "_" + words[i+1] for i in range(len(words) - 1)]
    return words + bigrams

def text_to_vector(text, vocab, idf):
    words  = get_ngrams(clean_text(text))
    vector = np.zeros(len(vocab))

    for word in words:
        if word in vocab:
            vector[vocab[word]] += 1

    if vector.sum() > 0:
        vector = vector / vector.sum()          

    vector = vector * idf                        

    norm = np.sqrt((vector ** 2).sum())          
    if norm > 0:
        vector = vector / norm

    return vector


_MODEL_PATH = Path(__file__).with_name("sentiment_model.pkl")

with _MODEL_PATH.open("rb") as f:
    saved = pickle.load(f)

weights = saved["weights"]
bias = saved["bias"]
vocab = saved["vocab"]
idf = saved["idf"]

def sigmoid(z):
    z = np.clip(z, -500, 500)
    return 1 / (1 + np.exp(-z))

def predict_sentiment(text):
    text = (text or "").strip()
    if not text:
        return "Neutral", 0.5

    vector = text_to_vector(text, vocab, idf)

    score = np.dot(vector, weights) + bias

    probability = sigmoid(score)

    sentiment = "Positive" if probability >= 0.5 else "Negative"

    return sentiment, float(probability)