// Input replay system for deterministic testing and debugging
import type { InputEvent } from './types';

export interface InputRecording {
  id: string;
  events: InputEvent[];
  startTime: number;
  duration: number;
  metadata?: Record<string, unknown>;
}

export class InputReplayer {
  private recordings = new Map<string, InputRecording>();
  private currentReplay?: {
    recording: InputRecording;
    startTime: number;
    eventIndex: number;
    speed: number;
  };

  // Record input events
  startRecording(id: string, metadata?: Record<string, unknown>): void {
    const recording: InputRecording = {
      id,
      events: [],
      startTime: Date.now(),
      duration: 0,
      metadata
    };
    this.recordings.set(id, recording);
  }

  // Add event to current recording
  recordEvent(event: InputEvent): void {
    for (const recording of this.recordings.values()) {
      if (recording.events.length === 0) {
        // First event, set relative timestamp
        recording.events.push({
          ...event,
          timestamp: 0
        });
      } else {
        // Subsequent events, calculate relative time
        const relativeTime = event.timestamp - recording.startTime;
        recording.events.push({
          ...event,
          timestamp: relativeTime
        });
      }
    }
  }

  // Stop recording and save
  stopRecording(id: string): InputRecording | undefined {
    const recording = this.recordings.get(id);
    if (recording && recording.events.length > 0) {
      recording.duration = recording.events[recording.events.length - 1].timestamp;
      // Persist to localStorage for debugging
      try {
        localStorage.setItem(`dtp:input-recording:${id}`, JSON.stringify(recording));
      } catch (error) {
        console.warn('[InputReplayer] Failed to save recording:', error);
      }
      return recording;
    }
    return undefined;
  }

  // Start replaying a recording
  startReplay(id: string, speed = 1): boolean {
    const recording = this.recordings.get(id);
    if (!recording) {
      // Try to load from localStorage
      try {
        const stored = localStorage.getItem(`dtp:input-recording:${id}`);
        if (stored) {
          const parsed = JSON.parse(stored) as InputRecording;
          this.recordings.set(id, parsed);
          return this.startReplay(id, speed);
        }
      } catch (error) {
        console.warn('[InputReplayer] Failed to load recording:', error);
      }
      return false;
    }

    this.currentReplay = {
      recording,
      startTime: Date.now(),
      eventIndex: 0,
      speed
    };

    return true;
  }

  // Get next event in replay sequence
  getNextReplayEvent(): InputEvent | null {
    if (!this.currentReplay) return null;

    const { recording, startTime, eventIndex, speed } = this.currentReplay;
    if (eventIndex >= recording.events.length) {
      this.currentReplay = undefined;
      return null;
    }

    const event = recording.events[eventIndex];
    const targetTime = startTime + (event.timestamp / speed);
    const now = Date.now();

    if (now >= targetTime) {
      this.currentReplay.eventIndex++;
      return {
        ...event,
        timestamp: now // Update timestamp to current time
      };
    }

    return null; // Not time for this event yet
  }

  // Stop current replay
  stopReplay(): void {
    this.currentReplay = undefined;
  }

  // Get all recordings
  getRecordings(): InputRecording[] {
    return Array.from(this.recordings.values());
  }

  // Clear recordings
  clearRecordings(): void {
    this.recordings.clear();
    // Clear from localStorage
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('dtp:input-recording:'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[InputReplayer] Failed to clear recordings:', error);
    }
  }
}