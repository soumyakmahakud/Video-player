
 class VideoProgressTracker {
            constructor(videoElement, videoId = 'default') {
                this.video = videoElement;
                this.videoId = videoId;
                this.watchedIntervals = [];
                this.currentStartTime = null;
                this.lastPosition = 0;
                this.sessionStartTime = Date.now();
                this.isTracking = false;

                this.loadProgress();
                this.initializeEventListeners();
            }

            initializeEventListeners() {
                // Track when video starts playing
                this.video.addEventListener('play', () => {
                    this.startTracking();
                });

                // Track when video pauses
                this.video.addEventListener('pause', () => {
                    this.stopTracking();
                });

                // Track seeking (jumping to different positions)
                this.video.addEventListener('seeked', () => {
                    this.handleSeek();
                });

                // Update progress periodically while playing
                this.video.addEventListener('timeupdate', () => {
                    this.updateProgress();
                });

                // Handle when video metadata loads
                this.video.addEventListener('loadedmetadata', () => {
                    this.updateDisplay();
                });

                // Handle when video ends
                this.video.addEventListener('ended', () => {
                    this.stopTracking();
                });
            }

            startTracking() {
                if (!this.isTracking) {
                    this.currentStartTime = this.video.currentTime;
                    this.isTracking = true;
                }
            }

            stopTracking() {
                if (this.isTracking && this.currentStartTime !== null) {
                    const endTime = this.video.currentTime;
                    if (endTime > this.currentStartTime) {
                        this.addInterval(this.currentStartTime, endTime);
                    }
                    this.isTracking = false;
                    this.currentStartTime = null;
                }
            }

            handleSeek() {
                // If user seeks while playing, save the current interval first
                if (this.isTracking && this.currentStartTime !== null) {
                    const seekFromTime = this.lastPosition;
                    if (seekFromTime > this.currentStartTime) {
                        this.addInterval(this.currentStartTime, seekFromTime);
                    }
                }

                // Start tracking from the new position
                if (!this.video.paused) {
                    this.
                        currentStartTime = this.video.currentTime;
                }
            }

            updateProgress() {
                this.lastPosition = this.video.currentTime;
                this.updateDisplay();
                this.saveProgress();
            }

            addInterval(start, end) {
                if (start >= end || start < 0) return;

                const newInterval = { start, end };
                this.watchedIntervals.push(newInterval);
                this.mergeIntervals();
                this.updateDisplay();
                this.saveProgress();
            }

            mergeIntervals() {
                if (this.watchedIntervals.length <= 1) return;

                // Sort intervals by start time
                this.watchedIntervals.sort((a, b) => a.start - b.start);

                const merged = [this.watchedIntervals[0]];

                for (let i = 1; i < this.watchedIntervals.length; i++) {
                    const current = this.watchedIntervals[i];
                    const lastMerged = merged[merged.length - 1];

                    if (current.start <= lastMerged.end) {
                        // Overlapping intervals - merge them
                        lastMerged.end = Math.max(lastMerged.end, current.end);
                    } else {
                        // Non-overlapping interval - add it
                        merged.push(current);
                    }
                }

                this.watchedIntervals = merged;
            }

            calculateUniqueWatchedTime() {
                let totalTime = 0;
                for (const interval of this.watchedIntervals) {
                    totalTime += interval.end - interval.start;
                }
                return totalTime;
            }

            calculateProgressPercentage() {
                if (!this.video.duration || this.video.duration === 0) return 0;
                const uniqueTime = this.calculateUniqueWatchedTime();
                return Math.min((uniqueTime / this.video.duration) * 100, 100);
            }

            formatTime(seconds) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = Math.floor(seconds % 60);
                return `${ minutes }:${ remainingSeconds.toString().padStart(2, '0') }`;
            }

            updateDisplay() {
                const progressPercentage = this.calculateProgressPercentage();
                const uniqueTime = this.calculateUniqueWatchedTime();
                const sessionTime = (Date.now() - this.sessionStartTime) / 1000;

                // Update progress percentage and bar
                document.getElementById('progressPercentage').textContent = `${ Math.round(progressPercentage) }`;
                document.getElementById('progressBar').style.width = `${ progressPercentage }`;

                // Update stats
                document.getElementById('uniqueTime').textContent = this.formatTime(uniqueTime);
                document.getElementById('totalTime').textContent = this.formatTime(this.video.duration || 0);
                document.getElementById('sessionTime').textContent = this.formatTime(sessionTime);
                document.getElementById('intervalsCount').textContent = this.watchedIntervals.length;

                // Update intervals display
                this.updateIntervalsDisplay();
            }

            updateIntervalsDisplay() {
                const intervalsList = document.getElementById('intervalsList');
                intervalsList.innerHTML = '';

                this.watchedIntervals.forEach((interval, index) => {
                    const chip = document.createElement('div');
                    chip.className = 'interval-chip';
                    chip.textContent = `${ this.formatTime(interval.start) } - ${ this.formatTime(interval.end) }`;
                    intervalsList.appendChild(chip);
                });
            }

            saveProgress() {
                const progressData = {
                    watchedIntervals: this.watchedIntervals,
                    lastPosition: this.video.currentTime,
                    timestamp: Date.now()
                };

                // In a real application, this would be sent to a server
                // For demo purposes, we're using in-memory storage
                window.videoProgressData = progressData;
            }

            loadProgress() {
                const progressData = window.videoProgressData;

                if (progressData) {
                    this.watchedIntervals = progressData.watchedIntervals || [];
                    this.lastPosition = progressData.lastPosition || 0;

                    // Set video to last position when metadata loads
                    if (this.video.readyState >= 1) {
                        this.video.currentTime = this.lastPosition;
                    } else {
                        this.video.addEventListener('loadedmetadata', () => {
                            this.video.currentTime = this.lastPosition;
                        }, { once: true });
                    }

                    this.updateDisplay();
                }
            }

            resumeFromLastPosition() {
                if (this.lastPosition > 0) {
                    this.video.currentTime = this.lastPosition;
                }
            }

            reset() {
                this.watchedIntervals = [];
                this.currentStartTime = null;
                this.lastPosition = 0;
                this.isTracking = false;
                this.video.currentTime = 0;
                window.videoProgressData = null;
                this.updateDisplay();
            }

            getDebugInfo() {
                return {
                    watchedIntervals: this.watchedIntervals,
                    currentTime: this.video.currentTime,
                    duration: this.video.duration,
                    isTracking: this.isTracking,
                    uniqueWatchedTime: this.calculateUniqueWatchedTime(),
                    progressPercentage: this.calculateProgressPercentage(),
                    lastPosition: this.lastPosition
                };
            }
        }

        // Initialize the tracker when the page loads
        let tracker;
        document.addEventListener('DOMContentLoaded', function () {
            const video = document.getElementById('lectureVideo');
            tracker = new VideoProgressTracker(video, 'sample-lecture');
        });

        // Global functions for buttons
        function resumeFromLastPosition() {
            if (tracker) {
                tracker.resumeFromLastPosition();
            }
        }

        function resetProgress() {
            if (tracker && confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                tracker.reset();
            }
        }

        function showDebugInfo() {
            if (tracker) {
                const debugInfo = tracker.getDebugInfo();
                const debugElement = document.getElementById('debugInfo');
                debugElement.innerHTML = `
                    <h3>🔧 Debug Information</h3>
                    <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
                `;
                debugElement.style.display = debugElement.style.display === 'none' ? 'block' : 'none';
            }
        }