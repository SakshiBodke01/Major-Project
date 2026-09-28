package com.dms.edge.cv.mediapipe

import kotlin.math.sqrt

/**
 * Calculates Eye Aspect Ratio (EAR) using 6-point 2D/3D Euclidean distance math.
 * 
 * Formula:
 * EAR = ( ||p2 - p6|| + ||p3 - p5|| ) / ( 2.0 * ||p1 - p4|| )
 * where p1, p4 are horizontal eye corner points, and p2,p6 & p3,p5 are vertical eyelid points.
 */
object EarCalculator {

    /**
     * Calculates Eye Aspect Ratio (EAR) for a 6-point eye polygon.
     * @param p1 Left corner
     * @param p2 Top-left eyelid
     * @param p3 Top-right eyelid
     * @param p4 Right corner
     * @param p5 Bottom-right eyelid
     * @param p6 Bottom-left eyelid
     */
    fun calculateEAR(
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
