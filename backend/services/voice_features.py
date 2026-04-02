import numpy as np
import librosa
import warnings

warnings.filterwarnings("ignore")


def extract_voice_features(y: np.ndarray, sr: int) -> dict:
    """
    Extract acoustic features from a voice signal.
    Ported verbatim from d:/NeuroLens/app.py lines 135-194.
    """
    features: dict = {}

    try:
        # Pitch features
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)

        if pitch_values:
            features["mean_pitch"] = float(np.mean(pitch_values))
            features["std_pitch"] = float(np.std(pitch_values))
        else:
            features["mean_pitch"] = 0.0
            features["std_pitch"] = 0.0

        # Jitter (pitch variation between consecutive frames)
        if len(pitch_values) > 1:
            jitter = np.mean(
                [abs(pitch_values[i] - pitch_values[i - 1]) for i in range(1, len(pitch_values))]
            )
            features["jitter"] = float(jitter)
        else:
            features["jitter"] = 0.0

        # Shimmer (amplitude variation between consecutive frames)
        rms = librosa.feature.rms(y=y)[0]
        if len(rms) > 1:
            shimmer = np.mean([abs(rms[i] - rms[i - 1]) for i in range(1, len(rms))])
            features["shimmer"] = float(shimmer)
        else:
            features["shimmer"] = 0.0

        # Spectral centroid
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        features["spectral_centroid_mean"] = float(np.mean(spectral_centroids))
        features["spectral_centroid_std"] = float(np.std(spectral_centroids))

        # Energy
        features["energy_mean"] = float(np.mean(rms))
        features["energy_std"] = float(np.std(rms))

        # Zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        features["zcr_mean"] = float(np.mean(zcr))
        features["zcr_std"] = float(np.std(zcr))

        # MFCCs (13 coefficients, mean + std each)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        for i in range(13):
            features[f"mfcc_{i}_mean"] = float(np.mean(mfccs[i]))
            features[f"mfcc_{i}_std"] = float(np.std(mfccs[i]))

    except Exception as e:
        print(f"[voice_features] extraction error: {e}")

    return features
