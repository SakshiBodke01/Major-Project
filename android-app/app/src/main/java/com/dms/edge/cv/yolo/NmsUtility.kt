package com.dms.edge.cv.yolo

import kotlin.math.max
import kotlin.math.min

/**
 * Non-Maximum Suppression (NMS) & Intersection-over-Union (IoU) Bounding Box Filter.
 */
object NmsUtility {

    /**
     * Calculates Intersection-over-Union (IoU) between two bounding boxes.
     */
    fun calculateIoU(boxA: BoundingBox, boxB: BoundingBox): Float {
        val interLeft = max(boxA.left, boxB.left)
        val interTop = max(boxA.top, boxB.top)
        val interRight = min(boxA.right, boxB.right)
        val interBottom = min(boxA.bottom, boxB.bottom)

        val interWidth = (interRight - interLeft).coerceAtLeast(0.0f)
        val interHeight = (interBottom - interTop).coerceAtLeast(0.0f)
        val interArea = interWidth * interHeight

        if (interArea == 0.0f) return 0.0f

        val areaA = boxA.area()
        val areaB = boxB.area()
        val unionArea = areaA + areaB - interArea

        if (unionArea <= 0.0f) return 0.0f

        return interArea / unionArea
    }

    /**
     * Applies Non-Maximum Suppression (NMS) to eliminate redundant overlapping bounding boxes.
     */
    fun applyNMS(
        detections: List<DetectedObject>,
        iouThreshold: Float = 0.45f,
        confidenceThreshold: Float = 0.45f
    ): List<DetectedObject> {
        // 1. Filter by confidence threshold
        val filtered = detections.filter { it.confidence >= confidenceThreshold }
            .sortedByDescending { it.confidence }
            .toMutableList()

        val results = mutableListOf<DetectedObject>()

        while (filtered.isNotEmpty()) {
            val best = filtered.removeAt(0)
            results.add(best)

            val iterator = filtered.iterator()
            while (iterator.hasNext()) {
                val candidate = iterator.next()
                if (candidate.classId == best.classId) {
                    val iou = calculateIoU(best.boundingBox, candidate.boundingBox)
                    if (iou >= iouThreshold) {
                        iterator.remove() // Suppress overlapping candidate box
                    }
                }
            }
        }

        return results
    }
}
