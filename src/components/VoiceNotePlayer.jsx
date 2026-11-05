import React, { useState, useRef, useEffect } from 'react';

const DEFAULT_BARS = [4, 8, 14, 9, 18, 22, 12, 17, 8, 15, 11, 20, 14, 18, 10, 16, 7, 13, 9, 5];

export default function VoiceNotePlayer({ audioSrc, duration = 0, isUser = false, transcription = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && totalDuration === 0) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      document.querySelectorAll('audio').forEach(a => {
        if (a !== audioRef.current) a.pause();
      });
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleSeek = (index) => {
    if (!audioRef.current) return;
    const dur = totalDuration || audioRef.current.duration || 5;
    const seekPercentage = (index + 1) / DEFAULT_BARS.length;
    const seekTime = seekPercentage * dur;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (secs) => {
    const s = Math.floor(secs || 0);
    const mins = Math.floor(s / 60);
    const remSecs = s % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const dur = totalDuration || 5;
  const progressPercent = dur > 0 ? (currentTime / dur) : 0;
  const activeBarCount = Math.floor(progressPercent * DEFAULT_BARS.length);

  const playBtnBg = isUser ? '#10b981' : '#059669';
  const barActiveColor = isUser ? '#10b981' : '#059669';
  const barInactiveColor = isUser ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  const textColor = isUser ? '#d1d5db' : '#6b7280';

  const hasTranscription = transcription && 
    transcription.trim() && 
    transcription.trim().toLowerCase() !== 'customer inquiry' && 
    transcription.trim().toLowerCase() !== '[voice inquiry]' &&
    transcription.trim().toLowerCase() !== 'transcribing voice...' &&
    transcription.trim().toLowerCase() !== 'customer voice message';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '220px', maxWidth: '300px' }}>
      {/* WhatsApp Voice Player Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Circular Play / Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          title={isPlaying ? "Pause" : "Play voice message"}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: playBtnBg,
            color: '#ffffff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}
        >
          {isPlaying ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        {/* Waveform Bars & Time Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Waveform Visualizer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2.5px',
              height: '24px',
              cursor: 'pointer'
            }}
          >
            {DEFAULT_BARS.map((height, i) => {
              const isActive = i <= activeBarCount;
              return (
                <div
                  key={i}
                  onClick={() => handleSeek(i)}
                  title={`Seek`}
                  style={{
                    width: '3px',
                    height: `${height}px`,
                    borderRadius: '2px',
                    backgroundColor: isActive ? barActiveColor : barInactiveColor,
                    transition: 'background-color 0.1s ease',
                    flexShrink: 0
                  }}
                />
              );
            })}
          </div>

          {/* Time & Mic Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: textColor, fontWeight: 500 }}>
            <span>{isPlaying ? formatTime(currentTime) : formatTime(totalDuration || currentTime || 5)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.8 }}>
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              <span>Voice</span>
            </span>
          </div>
        </div>
      </div>

      {/* Optional Transcribed Text Below */}
      {hasTranscription && (
        <div
          style={{
            fontSize: '12.5px',
            lineHeight: '1.4',
            opacity: 0.9,
            marginTop: '2px',
            paddingTop: '6px',
            borderTop: isUser ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.06)'
          }}
        >
          {transcription}
        </div>
      )}
    </div>
  );
}
