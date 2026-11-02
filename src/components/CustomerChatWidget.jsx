import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function CustomerChatWidget() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! 👋 Welcome to I Care Gadget. How can I help you find authentic chargers, AirPods, or accessories today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const currentAudioRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      scrollToBottom();
    }
  }, [isOpen, messages]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentAudioRef.current) currentAudioRef.current.pause();
    };
  }, []);

  const playVoice = (audioSrc) => {
    if (!audioSrc || isMuted) return;
    try {
      if (currentAudioRef.current) currentAudioRef.current.pause();
      const sound = new Audio(audioSrc);
      currentAudioRef.current = sound;
      sound.play().catch(e => console.warn('Audio auto-play blocked by browser:', e));
    } catch (e) {
      console.warn('Playback error:', e);
    }
  };

  const speakTextFallback = (text) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const quickPrompts = [
    "🔥 Best Sellers",
    "⚡ iPhone 20W Charger",
    "🎧 AirPods & Audio",
    "📍 Store Location & Hours"
  ];

  const handleSend = async (textToSend, audioBase64 = null) => {
    const text = (textToSend !== undefined ? textToSend : input).trim();
    if (!text && !audioBase64) return;
    if (loading) return;

    const displayUserText = text || "🎙️ [Voice Inquiry]";
    const newMessages = [...messages, { role: 'user', content: displayUserText }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: 'icare',
          role: 'customer',
          message: text,
          audio: audioBase64,
          history: history
        })
      });

      const data = await res.json();
      const reply = data.reply || "I'm having a brief connection issue. Please give me a moment and ask again!";
      setMessages([...newMessages, { role: 'assistant', content: reply, audio: data.audio }]);

      if (data.audio) {
        playVoice(data.audio);
      } else {
        speakTextFallback(reply);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: "Sorry, I couldn't connect right now. You can also reach our store directly at +92 300 1234567!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result;
          handleSend("", base64Data);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access denied:", err);
      alert("Please allow microphone permissions to record a voice message.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: 'Inter, sans-serif' }}>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#0a0a0a',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '9999px',
            padding: '12px 20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            fontWeight: 600,
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>💬</span>
          <span>Chat with Store AI</span>
          {unread > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '9999px',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(239,68,68,0.5)'
              }}
            >
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#0a0a0a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}
              >
                🛍️
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>I Care Support</div>
                <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  Voice & AI Active
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute Voice Replies" : "Mute Voice Replies"}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isMuted ? '#9ca3af' : '#10b981',
                  cursor: 'pointer',
                  fontSize: '17px',
                  padding: '4px'
                }}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  color: '#374151',
                  flexShrink: 0
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: '#fafafa'
            }}
          >
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: isAssistant ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '10px 14px',
                      borderRadius: isAssistant ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      backgroundColor: isAssistant ? '#ffffff' : '#0a0a0a',
                      color: isAssistant ? '#111827' : '#ffffff',
                      fontSize: '13.5px',
                      lineHeight: '1.45',
                      boxShadow: isAssistant ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      border: isAssistant ? '1px solid #e5e7eb' : 'none',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {msg.content}
                    {isAssistant && (
                      <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f3f4f6' }}>
                        <button
                          type="button"
                          onClick={() => msg.audio ? playVoice(msg.audio) : speakTextFallback(msg.content)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            color: '#374151',
                            fontWeight: 500
                          }}
                        >
                          {msg.audio ? '▶ Replay Voice' : '🔊 Listen'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce 1s infinite 0.1s' }} />
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce 1s infinite 0.25s' }} />
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Recording Status Banner */}
          {isRecording && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                borderTop: '1px solid #fecaca',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#991b1b',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#dc2626', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                <span>Listening... ({recordingSeconds}s)</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Send Voice ➔
              </button>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '12px 14px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#ffffff'
            }}
          >
            <input
              type="text"
              placeholder={isRecording ? "Listening to your voice..." : "Ask about gadgets, cables, prices..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || isRecording}
              style={{
                flex: 1,
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '13.5px',
                outline: 'none',
                backgroundColor: isRecording ? '#f3f4f6' : '#f9fafb'
              }}
            />

            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading}
              title={isRecording ? "Click to finish and send voice" : "Hold or click to speak"}
              style={{
                backgroundColor: isRecording ? '#dc2626' : '#f3f4f6',
                color: isRecording ? '#ffffff' : '#374151',
                border: isRecording ? 'none' : '1px solid #e5e7eb',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              🎙️
            </button>

            {/* Send Text Button */}
            <button
              type="submit"
              disabled={loading || !input.trim() || isRecording}
              style={{
                backgroundColor: input.trim() && !loading ? '#0a0a0a' : '#e5e7eb',
                color: input.trim() && !loading ? '#ffffff' : '#9ca3af',
                border: 'none',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                flexShrink: 0
              }}
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
