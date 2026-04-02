import os
import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC, SVR
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.metrics import accuracy_score, r2_score, mean_squared_error

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(BASE_DIR, "..", "..", "Datasets")
MODEL_DIR = os.path.join(BASE_DIR, "model")

os.makedirs(MODEL_DIR, exist_ok=True)

def train_voice_model():
    print("--- Training Voice Model (Classification) ---")
    csv_path = os.path.join(DATASETS_DIR, "parkinsons_voice.csv")
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    # Drop 'name' (identifier) and 'status' (target)
    X = df.drop(columns=['name', 'status'])
    y = df['status']
    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "Random Forest": RandomForestClassifier(random_state=42),
        "SVM": SVC(probability=True, random_state=42), # probability=True needed for predict_proba
        "KNN": KNeighborsClassifier()
    }

    best_acc = 0
    best_name = ""
    best_model = None

    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        preds = model.predict(X_test_scaled)
        acc = accuracy_score(y_test, preds)
        print(f"{name} Accuracy: {acc:.4f}")
        
        if acc > best_acc:
            best_acc = acc
            best_name = name
            best_model = model
            
    print(f"** Best Voice Model: {best_name} with Accuracy is {best_acc:.4f} **")
    
    # Re-train on full dataset for maximum data utilization
    X_scaled = scaler.fit_transform(X)
    best_model.fit(X_scaled, y)
    
    model_bundle = {
        "model": best_model,
        "scaler": scaler,
        "features": feature_names
    }
    
    out_path = os.path.join(MODEL_DIR, "model.pkl")
    with open(out_path, "wb") as f:
        pickle.dump(model_bundle, f)
    print(f"Saved voice model to {out_path}\n")

def train_motor_model():
    print("--- Training Motor Model (Regression) ---")
    csv_path = os.path.join(DATASETS_DIR, "parkinsons_motor.csv")
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    # Target is total_UPDRS. We'll drop non-features and target leaks.
    # subject#, test_time, motor_UPDRS, total_UPDRS are not standard features.
    cols_to_drop = ['subject#', 'test_time', 'motor_UPDRS', 'total_UPDRS']
    X = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
    y = df['total_UPDRS']
    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    models = {
        "Random Forest": RandomForestRegressor(random_state=42),
        "SVM": SVR(),
        "KNN": KNeighborsRegressor()
    }

    best_score = -float('inf')
    best_name = ""
    best_model = None

    for name, model in models.items():
        model.fit(X_train_scaled, y_train)
        preds = model.predict(X_test_scaled)
        r2 = r2_score(y_test, preds)
        mse = mean_squared_error(y_test, preds)
        print(f"{name} R2 Score: {r2:.4f} | MSE: {mse:.4f}")
        
        # Prioritize highest R2
        if r2 > best_score:
            best_score = r2
            best_name = name
            best_model = model
            
    print(f"** Best Motor Model: {best_name} with R2 is {best_score:.4f} **")
    
    # Re-train on full dataset
    X_scaled = scaler.fit_transform(X)
    best_model.fit(X_scaled, y)
    
    model_bundle = {
        "model": best_model,
        "scaler": scaler,
        "features": feature_names
    }
    
    out_path = os.path.join(MODEL_DIR, "motor_model.pkl")
    with open(out_path, "wb") as f:
        pickle.dump(model_bundle, f)
    print(f"Saved motor model to {out_path}\n")

if __name__ == "__main__":
    train_voice_model()
    train_motor_model()
    print("Done gathering and selecting best models.")
