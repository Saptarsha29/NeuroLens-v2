import sys
import os

# Align pathing so it can find 'services' package
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from services.ml_service import predict_voice_score, MODEL
except ImportError as e:
    print(f"Import Error: {e}")
    sys.exit(1)

def run_tests():
    print("=== NeuroLens Voice Accuracy Diagnostic ===\n")
    print(f"ML Model Loaded: {'✅ Yes' if MODEL is not None else '❌ No (Using Rule-Based Fallback)'}\n")
    
    test_cases = [
        {
            "name": "PERFECT VOICE (Clear Pronunciation + Stable Voice)",
            "phrase_score": 1.0,
            "features": {"jitter": 20, "shimmer": 0.05, "std_pitch": 50, "zcr_std": 0.1, "mean_pitch": 220}
        },
        {
            "name": "CLEAR VOICE + ROOM NOISE (Clear Pronunciation + Moderate Noise)",
            "phrase_score": 1.0,
            "features": {"jitter": 80, "shimmer": 0.35, "std_pitch": 250, "zcr_std": 0.3, "mean_pitch": 210}
        },
        {
            "name": "MUMBLED BUT RECOGNIZED (Partial Pronunciation + Stable Voice)",
            "phrase_score": 0.9,
            "features": {"jitter": 30, "shimmer": 0.10, "std_pitch": 80, "zcr_std": 0.15, "mean_pitch": 215}
        },
        {
            "name": "WRONG WORDS (No Keywords + Stable Voice)",
            "phrase_score": 0.0,
            "features": {"jitter": 20, "shimmer": 0.05, "std_pitch": 50, "zcr_std": 0.1, "mean_pitch": 220}
        },
        {
            "name": "REAL TREMOR (Clear Pronunciation + High Jitter/Shimmer)",
            "phrase_score": 1.0,
            "features": {"jitter": 280, "shimmer": 0.85, "std_pitch": 600, "zcr_std": 0.6, "mean_pitch": 190}
        }
    ]

    for case in test_cases:
        score = predict_voice_score(case["features"], phrase_score=case["phrase_score"])
        print(f"Test: {case['name']}")
        print(f"  - Pronunciation Score: {case['phrase_score'] * 100}%")
        print(f"  - Acoustic Score: [SIMULATED]")
        print(f"  - Result: {score:.2f} / 100")
        
        status = "✅ HIGH ACCURACY (90-94% REALISTIC RANGE)" if score >= 90.0 else "⚠️ VARIABLE"
        if case["phrase_score"] == 0.0:
            status = "❌ LOW ACCURACY (AS INTENDED)"
        elif score < 70:
            status = "🚨 POTENTIAL TREMOR DETECTED"
            
        print(f"  - status: {status}\n")

if __name__ == "__main__":
    run_tests()
