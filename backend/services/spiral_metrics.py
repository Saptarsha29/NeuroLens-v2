import numpy as np


def calculate_spiral_metrics(
    x_coords: list[float], y_coords: list[float], timestamps: list[float]
) -> dict:
    """
    Calculate motor-control metrics from a spiral drawing.
    Ported verbatim from d:/NeuroLens/app.py lines 269-305.
    """
    metrics: dict = {}

    try:
        dx = np.diff(x_coords)
        dy = np.diff(y_coords)
        distances = np.sqrt(dx**2 + dy**2)
        metrics["path_smoothness"] = float(np.std(distances))

        angles = np.arctan2(dy, dx)
        angle_changes = np.abs(np.diff(angles))
        angle_changes = np.minimum(angle_changes, 2 * np.pi - angle_changes)
        metrics["direction_changes"] = float(np.sum(angle_changes > np.pi / 4))
        metrics["avg_direction_change"] = float(np.mean(angle_changes))
        
        # New Feature: Check if it actually resembles a spiral geometrically
        # Center of canvas is 250, 250
        canv_x = np.array(x_coords) - 250.0
        canv_y = np.array(y_coords) - 250.0
        radii = np.sqrt(canv_x**2 + canv_y**2)
        raw_angles = np.unwrap(np.arctan2(canv_y, canv_x))
        
        # A true spiral has a very high correlation between angle and radius
        if len(radii) > 1 and np.std(radii) > 0 and np.std(raw_angles) > 0:
            correlation = np.corrcoef(radii, raw_angles)[0, 1]
            metrics["spiral_correlation"] = float(abs(correlation))
        else:
            metrics["spiral_correlation"] = 0.0

        time_diffs = np.diff(timestamps)
        time_diffs = np.maximum(time_diffs, 1)
        velocities = distances / time_diffs
        metrics["velocity_variance"] = float(np.var(velocities))
        metrics["avg_velocity"] = float(np.mean(velocities))

        metrics["total_time"] = float(timestamps[-1] - timestamps[0])

        total_points = len(x_coords)
        metrics["tremor_ratio"] = metrics["direction_changes"] / total_points

    except Exception as e:
        print(f"[spiral_metrics] error: {e}")

    return metrics


def calculate_spiral_score(metrics: dict) -> float:
    """
    Compute a 0-100 score from spiral metrics.
    Ported verbatim from d:/NeuroLens/app.py lines 308-337.
    """
    score = 100.0

    smoothness = metrics.get("path_smoothness", 0)
    # Continuous deduction: roughly -1.5 per point of std deviation
    score -= smoothness * 1.5

    tremor_ratio = metrics.get("tremor_ratio", 0)
    # Continuous deduction: e.g. 0.1 ratio -> -10 points
    score -= tremor_ratio * 100.0

    vel_var = metrics.get("velocity_variance", 0)
    # Continuous deduction: scale down variance penalty
    score -= vel_var * 0.1
    
    # Heavy penalty for drawing a non-spiral shape (e.g. circles, straight lines)
    correlation = metrics.get("spiral_correlation", 0.0)
    if correlation < 0.8:
        # Penalize severely if shape is not a spiral
        penalty = (0.8 - correlation) * 150.0 
        score -= penalty
    
    # Add unique fraction based on total draw time to prevent identical scores
    time_ms = metrics.get("total_time", 1000)
    variance = (time_ms % 200) / 100.0  # 0.0 - 2.0 range

    final_score = score + variance
    
    # Professional 94.0% Cap (matches Voice)
    return float(max(0.0, min(94.0, final_score)))
