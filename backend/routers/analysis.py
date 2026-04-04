import tempfile
import os
import librosa
import warnings
import soundfile as sf
import speech_recognition as sr
import numpy as np
from scipy.signal import butter, lfilter
from fastapi import APIRouter, HTTPException, UploadFile, File

from services.voice_features import extract_voice_features
from services.ml_service import predict_voice_score
from services.spiral_metrics import calculate_spiral_metrics, calculate_spiral_score
from services.tap_metrics import calculate_tap_metrics, calculate_tap_score
from schemas.models import SpiralRequest, TapRequest

warnings.filterwarnings("ignore")

router = APIRouter()


def highpass_filter(data, cutoff, fs, order=5):
    """
    Remove low-frequency background noise (hum, fans).
    """
    nyq = 0.5 * fs
    normal_cutoff = cutoff / nyq
    b, a = butter(order, normal_cutoff, btype='high', analog=False)
    y = lfilter(b, a, data)
    return y


# ---------------------------------------------------------------------------
# Voice
# ---------------------------------------------------------------------------

@router.post("/analyze_voice")
async def analyze_voice(audio: UploadFile = File(...)):
    """
    Accept a WAV audio recording, extract acoustic features,
    run the ML model, and return a voice health score (0-100).
    """
    if not audio:
        raise HTTPException(status_code=400, detail="No audio file provided")

    # Write to a named temp file so librosa can read it by path
    suffix = os.path.splitext(audio.filename or "recording.wav")[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        # 1. Extract audio bytes and check for pure silence
        y, sr_lib = librosa.load(tmp_path, sr=None, mono=True)
        if len(y) == 0:
            raise HTTPException(status_code=400, detail="Invalid or empty audio file")
            
        max_amplitude = np.max(np.abs(y))
        if max_amplitude < 0.001:
            return {
                "success": False, 
                "error": "The recording is completely silent! Please check your microphone selection in browser settings (it might be set to the wrong input)."
            }
            
        # 2. Normalize and Clean
        y_normalized = y / max_amplitude
        # High-pass filter only for acoustic features, not for STT
        y_filtered = highpass_filter(y_normalized, 80, sr_lib)
        
        # Save UNFILTERED normalized audio for Google STT (it handles noise better than our filter)
        # Added np.clip to prevent "wraparound" distortion if filtering or normalization spikes.
        stt_path = tmp_path + "_stt.wav"
        y_stt_int16 = (np.clip(y_normalized, -1.0, 1.0) * 32767).astype(np.int16)
        sf.write(stt_path, y_stt_int16, sr_lib, subtype='PCM_16')

        # 3. Enforce/Validate Keyword via SpeechRecognition
        recognizer = sr.Recognizer()
        phrase_score = 0.0
        with sr.AudioFile(stt_path) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data).lower()
                
                # Bulletproof consistency score: handle variations like "I'm full fit", "fully feet"
                # target_words = ["fully", "fit", "i", "am", "i'm", "im", "full", "feet", "feel"]
                text_words = text.split()
                
                # Check for "Fully" or "Full"
                has_full = any(w in text_words for w in ["fully", "full", "fooly"])
                # Check for "Fit" or "Feet" or "Feel"
                has_fit = any(w in text_words for w in ["fit", "feet", "feel"])
                
                has_helper = any(w in text_words for w in ["i", "am", "i'm", "im", "i've"])
                
                if has_full and has_fit and has_helper:
                    phrase_score = 1.0
                elif has_full and has_fit:
                    phrase_score = 0.9  # No "I am", just "Fully fit"
                elif has_fit or has_full:
                    phrase_score = 0.5  # Only part of the phrase
                else:
                    phrase_score = 0.0
                
            except sr.UnknownValueError:
                text = "unrecognized"
                phrase_score = 0.0
            except Exception as e:
                print(f"Speech API Error: {e}")
                text = "api_error"
                phrase_score = 0.5  # Neutral fallback

        # 4. Extract Acoustic Features & Score from Filtered Audio
        features = extract_voice_features(y_filtered, sr_lib)
        voice_score = predict_voice_score(features, phrase_score=phrase_score)

        return {
            "success": True,
            "voice_score": round(voice_score, 2),
            "transcription": text,
            "features": features,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if 'stt_path' in locals() and os.path.exists(stt_path):
            os.remove(stt_path)


# ---------------------------------------------------------------------------
# Spiral
# ---------------------------------------------------------------------------

@router.post("/analyze_spiral")
async def analyze_spiral(body: SpiralRequest):
    """
    Accept an array of {x, y, time} drawing points,
    compute spiral metrics, and return a hand-tremor score (0-100).
    """
    if len(body.points) < 10:
        raise HTTPException(status_code=400, detail="Insufficient drawing data (need ≥10 points)")

    x = [p.x for p in body.points]
    y = [p.y for p in body.points]
    t = [p.time for p in body.points]

    metrics = calculate_spiral_metrics(x, y, t)
    spiral_score = calculate_spiral_score(metrics)

    return {"success": True, "spiral_score": round(spiral_score, 2), "metrics": metrics}


# ---------------------------------------------------------------------------
# Tap
# ---------------------------------------------------------------------------

@router.post("/analyze_tap")
async def analyze_tap(body: TapRequest):
    """
    Accept an array of tap timestamps (ms offsets from test start),
    compute rhythm metrics, and return a motor-response score (0-100).
    """
    if len(body.tap_times) < 3:
        raise HTTPException(status_code=400, detail="Insufficient tap data (need ≥3 taps)")

    metrics = calculate_tap_metrics(body.tap_times)
    tap_score = calculate_tap_score(metrics)

    return {"success": True, "tap_score": round(tap_score, 2), "metrics": metrics}
