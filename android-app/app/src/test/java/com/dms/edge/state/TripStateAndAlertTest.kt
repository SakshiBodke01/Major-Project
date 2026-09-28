package com.dms.edge.state

import com.dms.edge.alert.AlertManager
import com.dms.edge.engine.RiskEngineEvent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Unit Tests for Trip State Machine, Alert Manager, and State Recovery.
 */
class TripStateAndAlertTest {

    private lateinit var stateMachine: TripStateMachine
    private lateinit var alertManager: AlertManager

    @Before
    fun setUp() {
        stateMachine = TripStateMachine()
        alertManager = AlertManager()
    }

    @Test
    fun testPredictableStateTransitions() {
        assertEquals(TripState.IDLE, stateMachine.getCurrentState())

        // 1. IDLE -> STARTING
        assertTrue(stateMachine.transitionTo(TripState.STARTING))
        assertEquals(TripState.STARTING, stateMachine.getCurrentState())

        // 2. STARTING -> MONITORING
        assertTrue(stateMachine.transitionTo(TripState.MONITORING))
        assertEquals(TripState.MONITORING, stateMachine.getCurrentState())

        // 3. MONITORING -> PAUSED (App Backgrounded)
        assertTrue(stateMachine.transitionTo(TripState.PAUSED))
        assertEquals(TripState.PAUSED, stateMachine.getCurrentState())

        // 4. PAUSED -> MONITORING (App Foregrounded)
        assertTrue(stateMachine.transitionTo(TripState.MONITORING))
        assertEquals(TripState.MONITORING, stateMachine.getCurrentState())

        // 5. MONITORING -> STOPPING -> COMPLETED
        assertTrue(stateMachine.transitionTo(TripState.STOPPING))
        assertTrue(stateMachine.transitionTo(TripState.COMPLETED))
        assertEquals(TripState.COMPLETED, stateMachine.getCurrentState())
    }

    @Test
    fun testInvalidStateTransitionRejection() {
        assertEquals(TripState.IDLE, stateMachine.getCurrentState())

        // Invalid: Direct transition from IDLE to COMPLETED must be rejected
        val result = stateMachine.transitionTo(TripState.COMPLETED)
        assertFalse("Direct transition from IDLE to COMPLETED MUST be rejected!", result)
        assertEquals(TripState.IDLE, stateMachine.getCurrentState())
    }

    @Test
    fun testAlertFormattingForDriverUI() {
        val event = RiskEngineEvent(
            eventId = "EVT_001",
            eventType = "DROWSINESS",
            pointsDeducted = 30,
            previousScore = 100,
            currentScore = 70,
            severity = "CRITICAL",
            explanation = "Drowsiness detected (-30 pts). Score reduced from 100 to 70."
        )

        val warningText = alertManager.triggerAlert(event)

        assertNotNull(warningText)
        assertTrue("Warning text must display clear driver reason", warningText.contains("DROWSINESS WARNING"))
        assertTrue("Warning text must display exact score deduction", warningText.contains("-30 pts"))
    }
}
