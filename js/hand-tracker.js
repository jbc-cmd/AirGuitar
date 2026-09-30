/**
 * AirGuitar AI — Hand Landmark Tracker & Gesture Classifier
 * Integrates MediaPipe Hands with smooth exponential filtering and robust gesture detection.
 */

class AirGuitarHandTracker {
  constructor() {
    this.videoElement = null;
    this.hands = null;
    this.camera = null;
    this.isTracking = false;
    this.isProcessing = false; // Concurrency guard to prevent frame queue backpressure
    this.smoothingFactor = 0.25; // Responsive low-latency EMA filter

    // Smoothed primary hand point (X, Y)
    this.smoothedPoint = { x: 0.5, y: 0.5, z: 0 };
    this.rawPoint = { x: 0.5, y: 0.5, z: 0 };

    // Gesture detection stability debounce (fast 50ms response)
    this.currentGesture = 'none';
    this.candidateGesture = 'none';
    this.gestureHoldStartTime = 0;
    this.debounceMs = 50;

    // Callbacks
    this.onGestureDetected = null;
    this.onHandMove = null;
    this.onTrackingStatus = null;
    this.onFrameLandmarks = null;
  }

  async init(videoElement) {
    this.videoElement = videoElement;

    if (typeof Hands === 'undefined') {
      console.warn("MediaPipe Hands library not loaded from CDN. Retrying...");
      await this.loadMediaPipeScript();
    }

    try {
      this.hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      // Ultra low-latency settings with dual-hand tracking
      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.hands.onResults((results) => this.handleResults(results));
      console.log("MediaPipe Hands initialized in high-performance dual-hand mode.");
      return true;
    } catch (err) {
      console.error("Failed to initialize MediaPipe Hands:", err);
      return false;
    }
  }

  async startCamera() {
    if (!this.videoElement) return false;

    try {
      // 1. Start native WebRTC camera immediately (instant video feed)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      this.videoElement.srcObject = stream;
      await this.videoElement.play();
      this.isTracking = true;

      // 2. Start continuous processing loop
      this.startProcessingLoop();

      if (this.onTrackingStatus) this.onTrackingStatus(true, "Camera Live");
      return true;
    } catch (err) {
      console.error("Camera access error:", err);
      if (this.onTrackingStatus) this.onTrackingStatus(false, "Camera Access Denied");
      return false;
    }
  }

  startProcessingLoop() {
    const process = async () => {
      if (!this.isTracking) return;

      if (this.hands && this.videoElement && (this.videoElement.readyState >= 2 || this.videoElement.currentTime > 0) && !this.isProcessing) {
        this.isProcessing = true;
        try {
          await this.hands.send({ image: this.videoElement });
        } catch (e) {
          // Ignore occasional dropped frame
        } finally {
          this.isProcessing = false;
        }
      }

      if (this.isTracking) {
        requestAnimationFrame(process);
      }
    };
    requestAnimationFrame(process);
  }

  stopCamera() {
    this.isTracking = false;
    this.isProcessing = false;
    if (this.camera && this.camera.stop) {
      this.camera.stop();
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(t => t.stop());
      this.videoElement.srcObject = null;
    }
    if (this.onTrackingStatus) this.onTrackingStatus(false, "Camera Stopped");
  }

  // =========================================================================
  // Landmark Processing & Gesture Recognition
  // =========================================================================

  handleResults(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      this.handleNoHands();
      if (this.onFrameLandmarks) this.onFrameLandmarks(results, null, null);
      return;
    }

    // Pick primary hand (Hand 0)
    const landmarks = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness?.[0]?.label || 'Right';

    // 1. Compute Primary Control Point (Index Fingertip or Palm Center)
    // Landmarks: 0: Wrist, 8: Index Tip, 9: Middle MCP
    const targetPoint = landmarks[8] || landmarks[9] || landmarks[0];
    // Note: Video is mirrored horizontally for natural user mirror experience
    const rawX = 1.0 - targetPoint.x;
    const rawY = targetPoint.y;
    const rawZ = targetPoint.z;

    this.rawPoint = { x: rawX, y: rawY, z: rawZ };

    // Apply EMA smoothing
    const alpha = 1.0 - this.smoothingFactor;
    this.smoothedPoint.x += (rawX - this.smoothedPoint.x) * alpha;
    this.smoothedPoint.y += (rawY - this.smoothedPoint.y) * alpha;
    this.smoothedPoint.z += (rawZ - this.smoothedPoint.z) * alpha;

    if (this.onHandMove) {
      this.onHandMove(this.smoothedPoint, this.rawPoint);
    }

    // 2. Classify Gesture from primary or secondary hand
    let detected = this.classifyGesture(landmarks);
    if (detected === 'none' && results.multiHandLandmarks.length > 1) {
      detected = this.classifyGesture(results.multiHandLandmarks[1]);
    }
    this.debounceGesture(detected);

    if (this.onFrameLandmarks) {
      this.onFrameLandmarks(results, results.multiHandLandmarks, this.smoothedPoint);
    }
  }

  handleNoHands() {
    if (this.currentGesture !== 'none') {
      this.currentGesture = 'none';
      if (this.onGestureDetected) this.onGestureDetected('none');
    }
  }

  // Robust Geometry-Based Gesture Recognition
  classifyGesture(lm) {
    const wrist = lm[0];

    // Helper: Distance between two 3D landmarks
    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z - p2.z) * 0.5);

    // Finger Tip vs PIP / MCP positions to determine extension
    // Fingers: Thumb (4), Index (8), Middle (12), Ring (16), Pinky (20)
    // Knuckles / MCPs: Thumb (2), Index (5), Middle (9), Ring (13), Pinky (17)

    const isIndexExtended = dist(lm[8], wrist) > dist(lm[6], wrist) * 1.25 && lm[8].y < lm[6].y + 0.05;
    const isMiddleExtended = dist(lm[12], wrist) > dist(lm[10], wrist) * 1.25 && lm[12].y < lm[10].y + 0.05;
    const isRingExtended = dist(lm[16], wrist) > dist(lm[14], wrist) * 1.25 && lm[16].y < lm[14].y + 0.05;
    const isPinkyExtended = dist(lm[20], wrist) > dist(lm[18], wrist) * 1.25 && lm[20].y < lm[18].y + 0.05;
    
    // Thumb extension
    const isThumbExtended = dist(lm[4], lm[17]) > dist(lm[2], lm[17]) * 1.15;

    // Pinch: Thumb tip close to Index tip
    const pinchDist = dist(lm[4], lm[8]);
    const isPinch = pinchDist < 0.07;

    // Count extended non-thumb fingers
    const extendedCount = (isIndexExtended ? 1 : 0) + (isMiddleExtended ? 1 : 0) + 
                          (isRingExtended ? 1 : 0) + (isPinkyExtended ? 1 : 0);

    // 1. Rock Horns (🤘): Index & Pinky extended, Middle & Ring curled
    if (isIndexExtended && isPinkyExtended && !isMiddleExtended && !isRingExtended) {
      return 'rock';
    }

    // 2. Shaka Sign (🤙): Thumb & Pinky extended, Index/Middle/Ring curled
    if (isThumbExtended && isPinkyExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended) {
      return 'shaka';
    }

    // 3. Pinch / OK Sign (👌): Thumb and Index close together
    if (isPinch && (isMiddleExtended || isRingExtended)) {
      return 'pinch';
    }

    // 4. Peace / Victory (✌️): Index & Middle extended, Ring & Pinky curled
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'peace';
    }

    // 5. Pointing (☝️): Only Index extended
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'point';
    }

    // 6. Thumbs Up (👍): Thumb extended upward, other fingers curled
    if (isThumbExtended && extendedCount === 0 && lm[4].y < lm[3].y) {
      return 'thumbs_up';
    }

    // 7. Open Palm (🖐️): 4 or 5 fingers extended
    if (extendedCount >= 4) {
      return 'palm';
    }

    // 8. Fist (✊): All fingers curled
    if (extendedCount === 0) {
      return 'fist';
    }

    return 'none';
  }

  // Stable Debounce Filter for Gesture Transitions
  debounceGesture(detected) {
    const now = performance.now();

    if (detected !== this.candidateGesture) {
      this.candidateGesture = detected;
      this.gestureHoldStartTime = now;
      return;
    }

    if (now - this.gestureHoldStartTime >= this.debounceMs) {
      if (this.currentGesture !== this.candidateGesture) {
        this.currentGesture = this.candidateGesture;
        if (this.onGestureDetected && this.currentGesture !== 'none') {
          this.onGestureDetected(this.currentGesture);
        }
      }
    }
  }

  async loadMediaPipeScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

window.AirGuitarHandTracker = AirGuitarHandTracker;
