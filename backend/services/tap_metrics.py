import numpy as np


def calculate_tap_metrics(tap_times: list[int]) -> dict:
    """
    Calculate motor-rhythm metrics from tapping timestamps (ms).
    Ported verbatim from d:/NeuroLens/app.py lines 366-398.
    """
    metrics: dict = {}

    try:
        tap_times_sorted = sorted(tap_times)
        intervals = np.diff(tap_times_sorted)

        total_time = tap_times_sorted[-1] - tap_times_sorted[0]
        total_taps = len(tap_times_sorted)
        metrics["taps_per_second"] = float(total_taps / (total_time / 1000))

        metrics["interval_variance"] = float(np.var(intervals))
        metrics["interval_mean"] = float(np.mean(intervals))
        metrics["interval_std"] = float(np.std(intervals))

        if metrics["interval_mean"] > 0:
            metrics["rhythm_consistency"] = float(
                metrics["interval_std"] / metrics["interval_mean"]
            )
        else:
            metrics["rhythm_consistency"] = 1.0

        metrics["total_taps"] = total_taps
        metrics["total_time_ms"] = float(total_time)

    except Exception as e:
        print(f"[tap_metrics] error: {e}")

    return metrics


def calculate_tap_score(metrics: dict) -> float:
    """
    Compute a 0-100 score from tap metrics.
    Ported verbatim from d:/NeuroLens/app.py lines 402-430.
    """
    score = 100.0

    tps = metrics.get("taps_per_second", 0)
    if tps < 2:
        score -= 30
    elif tps < 3:
        score -= 15
    elif tps > 8:
        score -= 20
    elif tps > 7:
        score -= 10

    rhythm = metrics.get("rhythm_consistency", 0)
    if rhythm > 0.5:
        score -= 25
    elif rhythm > 0.3:
        score -= 15
    elif rhythm > 0.2:
        score -= 8

    if metrics.get("total_taps", 0) < 10:
        score -= 20

    # Add realistic micro-variance (0.1 - 1.5) based on rhythm
    variance = (metrics.get("interval_variance", 0) % 15) / 10.0
    return float(min(97.0, max(0.0, score + variance)))
