import tempfile
import os
import librosa
import warnings
import soundfile as sf
import speech_recognition as sr
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File

from services.voice_features import extract_voice_features
from services.ml_service import predict_voice_score
from services.spiral_metrics import calculate_spiral_metrics, calculate_spiral_score
from services.tap_metrics import calculate_tap_metrics, calculate_tap_score
from schemas.models import SpiralRequest, TapRequest

warnings.filterwarnings("ignore")

router = APIRouter()


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
            
        # 2. Normalize and convert to strict 16-bit PCM WAV
        y_normalized = y / max_amplitude
        clean_path = tmp_path + "_clean.wav"
        
        # SpeechRecognition ONLY supports PCM_16. Float32 arrays look like pure static!
        y_int16 = (y_normalized * 32767).astype(np.int16)
        sf.write(clean_path, y_int16, sr_lib, subtype='PCM_16')

        # 3. Enforce Keyword via SpeechRecognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(clean_path) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data).lower()
                if "best" not in text:
                    return {
                        "success": False,
                        "error": f'You must say the keyword "I AM THE BEST". You said: "{text}"'
                    }
            except sr.UnknownValueError:
                return {
                    "success": False,
                    "error": 'Google Speech API could not understand any words. Ensure you speak clearly into the correct microphone!'
                }
            except Exception as e:
                print(f"Speech API Error: {e}")
                # Fallback if totally offline, but we assume online

        # 4. Extract Acoustic Features & Score
        features = extract_voice_features(y_normalized, sr_lib)
        voice_score = predict_voice_score(features)

        return {
            "success": True,
            "voice_score": round(voice_score, 2),
            "features": features,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if 'clean_path' in locals() and os.path.exists(clean_path):
            os.remove(clean_path)


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
