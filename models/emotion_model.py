from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

class EmotionClassifier:
    def __init__(self, model_name="cardiffnlp/twitter-roberta-base-sentiment"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.eval()
        self.id2label = self.model.config.id2label

    def predict(self, text: str):
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True)
        with torch.no_grad():
            outputs = self.model(**inputs)
            scores = torch.softmax(outputs.logits, dim=1)[0]
        probs = scores.tolist()
        label_id = scores.argmax().item()
        label = self.id2label[label_id]
        return {
            "label": label,
            "scores": {
                self.id2label[i]: float(probs[i]) for i in range(len(probs))
            }
        }

if __name__ == "__main__":
    clf = EmotionClassifier()
    print(clf.predict("I am feeling so anxious and stressed recently."))
