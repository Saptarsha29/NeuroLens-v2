from pydantic import BaseModel


class SpiralPoint(BaseModel):
    x: float
    y: float
    time: float


class SpiralRequest(BaseModel):
    points: list[SpiralPoint]


class TapRequest(BaseModel):
    tap_times: list[int]


class FinalScoreRequest(BaseModel):
    voice_score: float
    spiral_score: float
    tap_score: float


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class VoiceResponse(BaseModel):
    success: bool
    voice_score: float
    features: dict


class SpiralResponse(BaseModel):
    success: bool
    spiral_score: float
    metrics: dict


class TapResponse(BaseModel):
    success: bool
    tap_score: float
    metrics: dict


class FinalScoreResponse(BaseModel):
    success: bool
    voice_score: float
    spiral_score: float
    tap_score: float
    final_score: float
    status: str
    status_color: str
