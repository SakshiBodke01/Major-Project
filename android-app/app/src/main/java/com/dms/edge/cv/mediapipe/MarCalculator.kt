package com.dms.edge.cv.mediapipe

import kotlin.math.sqrt

/**
 * Calculates Mouth Aspect Ratio (MAR) using 6-point 2D/3D Euclidean distance math.
 * 
 * Formula:
 * MAR = ( ||p2 - p6|| + ||p3 - p5|| ) / ( 2.0 * ||p1 - p4|| )
 * where p1, p4 are left/right mouth corner points, and p2,p6 & p3,p5 are upper/lower lip points.
 */
object MarCalculator {

    /**
     * Calculates Mouth Aspect Ratio (MAR) for a 6-point mouth polygon.
     * @param p1 Left mouth corner (Index 61)
     * @param p2 Top-left upper lip (Index 37)
     * @param p3 Top-right upper lip (Index 267)
     * @param p4 Right mouth corner (Index 291)
     * @param p5 Bottom-right lower lip (Index 314)
     * @param p6 Bottom-left lower lip (Index 84)
     */
    fun calculateMAR(
        p1: EyeLandmarkPoint,
        p2: EyeLandmarkPoint,
        p3: EyeLandmarkPoint,
        p4: EyeLandmarkPoint,
        p5: EyeLandmarkPoint,
        p6: EyeLandmarkPoint
    ): Float {
        val v1 = euclideanDistance(p2, p6)
        val v2 = euclideanDistance(p3, p5)
        val horizontal = euclideanDistance(p1, p4)

        if (horizontal == 0.0f) return 0.0f

        return (v1 + v2) / (2.0f * horizontal)
    }

    private fun euclideanDistance(a: EyeLandmarkPoint, b: EyeLandmarkPoint): Float {
        val dx = a.x - b.x
        val dy = a.y - b.y
        val dz = a.z - b.z
        return sqrt(dx * dx + dy * dy + dz * dz)
    }
}
