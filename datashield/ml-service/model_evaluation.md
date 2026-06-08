# ML Model Evaluation Results

## Dataset Summary
- File: `ml-service/data/sample_dataset.csv`
- Total samples: 40
- Class distribution:
  - `SQLi`: 10
  - `XSS`: 10
  - `Suspicious`: 10
  - `Normal`: 10
- TF-IDF vocabulary size: 189

## Model and Training
- Model: `RandomForestClassifier`
- Vectorizer: `TfidfVectorizer(ngram_range=(1, 2), min_df=1)`
- Training script: `ml-service/train_model.py`
- Model artifacts saved to:
  - `ml-service/model/threat_model.pkl`
  - `ml-service/model/vectorizer.pkl`

## Evaluation Metrics
- Accuracy: `0.4000`

### Classification Report
```
              precision    recall  f1-score   support

      Normal       0.00      0.00      0.00         3
        SQLi       0.25      1.00      0.40         2
  Suspicious       0.00      0.00      0.00         3
         XSS       1.00      1.00      1.00         2

    accuracy                           0.40        10
   macro avg       0.31      0.50      0.35        10
weighted avg       0.25      0.40      0.28        10
```

## Notes
- The available dataset is small and synthetic, causing limited generalization.
- The current evaluation shows high variance across classes and low overall accuracy.
- Additional real-world data, further feature engineering, or model tuning are recommended.
