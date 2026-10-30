import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Mic, 
  MicOff,
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  ArrowUpRight, 
  Clock,
  Sparkles,
  MessageCircle,
  PhoneCall,
  X
} from 'lucide-react';
import { askClinicalAssistant } from '../lib/clinicalEngine';
import { useLanguage } from '../context/LanguageContext';
import useConnectionStatus from '../hooks/useConnectionStatus';

export default function AskAIScreen({ onOpenEmergency }) {
  const { language, t } = useLanguage();
  const { isOnline } = useConnectionStatus();

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      type: 'answer',
      isWelcome: true,
      durationMs: 1
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const [showFirstUseNotice, setShowFirstUseNotice] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const isSpeechSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const suggestedChips = [
    { labelKey: 'chip_anc_milestones', query: "When should pregnant woman complete ANC checkups and visits?" },
    { labelKey: 'chip_ors_diarrhea', query: "How to assess dehydration and give ORS and Zinc for diarrhea?" },
    { labelKey: 'chip_bp_lifestyle', query: "What is dietary lifestyle advice for high blood pressure and salt?" },
    { labelKey: 'chip_10week_vaccines', query: "Which vaccines are due at 10 weeks of age for an infant?" },
    { labelKey: 'chip_newborn_danger', query: "Newborn baby is unable to suck and not feeding breastmilk" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Clean up recognition instance on unmount
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch (_e) {}
    };
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (_e) {}
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setVoiceError(null);
    const SpeechRecognitionClass = typeof window !== 'undefined' 
      ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
      : null;

    if (!SpeechRecognitionClass) {
      setVoiceError(t('voice_unsupported'));
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let recognizedText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          recognizedText += event.results[i][0].transcript;
        }
        if (recognizedText) {
          setInputQuery(recognizedText);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError(t('voice_perm_denied'));
        } else if (event.error === 'no-speech') {
          setVoiceError(t('voice_no_speech'));
        } else if (event.error === 'network') {
          setVoiceError(t('voice_network_error'));
        } else {
          setVoiceError(t('voice_generic_error'));
        }
        setIsListening(false);
        setTimeout(() => setVoiceError(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setVoiceError(t('voice_generic_error'));
      setIsListening(false);
    }
  }, [language, t]);

  const handleMicClick = () => {
    // 1. If unsupported in this browser
    if (!isSpeechSupported) {
      setVoiceError(t('voice_unsupported'));
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    // 2. If offline, disable mic and prompt to type
    if (!isOnline) {
      setVoiceError(t('voice_offline_disabled'));
      setTimeout(() => setVoiceError(null), 4500);
      return;
    }

    // 3. First-use notice requirement
    const hasSeenNotice = typeof localStorage !== 'undefined' ? localStorage.getItem('sahaaya_voice_notice_seen') : null;
    if (!hasSeenNotice) {
      setShowFirstUseNotice(true);
      return;
    }

    // 4. Toggle: If already listening, stop
    if (isListening) {
      stopListening();
      return;
    }

    // 5. Start listening
    startListening();
  };

  const handleSend = async (queryToSend) => {
    // Stop mic if listening
    if (isListening) {
      stopListening();
    }

    const query = (queryToSend || inputQuery).trim();
    if (!query || isProcessing) return;

    setInputQuery('');
    const userMsgId = `user-${Date.now()}`;
    const newMessages = [...messages, { id: userMsgId, sender: 'user', text: query }];
    setMessages(newMessages);
    setIsProcessing(true);

    try {
      const response = await askClinicalAssistant(query);
      setMessages([...newMessages, {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        ...response
      }]);
    } catch (err) {
      setMessages([...newMessages, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        type: 'error',
        message: t('outside_scope_message')
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] pb-14 md:pb-4 max-w-4xl mx-auto w-full relative">
      {/* First Use Notice Modal */}
      {showFirstUseNotice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-primary flex items-center justify-center mx-auto">
              <Mic className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-gray-900">
                {language === 'te' ? 'వాయిస్ ఇన్‌పుట్ సమాచారం' : 'Voice Input Notice'}
              </h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                {t('voice_first_use_notice')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('sahaaya_voice_notice_seen', 'true');
                }
                setShowFirstUseNotice(false);
                startListening();
              }}
              className="w-full min-h-touch py-3 bg-primary hover:bg-primary-hover active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
            >
              {t('voice_got_it')}
            </button>
          </div>
        </div>
      )}

      {/* Top Engine & Offline Status Ribbon */}
      <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-emerald-900 shrink-0 mb-3 shadow-xs">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold">{t('offline_chip')}</span>
        </div>
        <span className="text-[11px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
          {isOnline ? t('online_status_desc') : t('offline_status_desc')}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            {msg.sender === 'user' ? (
              <div className="max-w-[85%] bg-primary text-white p-3.5 rounded-2xl rounded-tr-sm text-sm font-medium shadow-sm leading-relaxed">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-[95%] w-full space-y-2">
                {/* Case 0: Welcome Message */}
                {msg.isWelcome && (
                  <div className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 shadow-sm space-y-2">
                    <p className="text-sm text-gray-800 leading-relaxed font-normal whitespace-pre-line">
                      {t('welcome_message')}
                    </p>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="font-semibold text-primary bg-primary-light px-2 py-0.5 rounded">
                        {t('source_citation')}: National Health Protocols & IMNCI
                      </span>
                    </div>
                  </div>
                )}

                {/* Case 1: Danger Sign Triggered - Inline Red Card */}
                {msg.type === 'danger' && (
                  <div className="p-4 bg-red-50 border-2 border-emergency rounded-2xl text-red-950 shadow-md">
                    <div className="flex items-center gap-2 text-emergency font-black text-sm uppercase tracking-wide">
                      <ShieldAlert className="w-5 h-5 animate-bounce" />
                      <span>{t('refer_immediately')}</span>
                    </div>

                    <div className="mt-2.5 p-2.5 bg-white/90 rounded-lg border border-red-200">
                      <span className="text-xs font-bold text-red-700 block uppercase">
                        {t('detected_danger')}:
                      </span>
                      <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                        {msg.category} — {msg.matchedSign}
                      </p>
                    </div>

                    <p className="text-xs text-red-900 mt-2 font-medium leading-relaxed">
                      {msg.immediateAction}
                    </p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={onOpenEmergency}
                        className="min-h-touch py-2.5 px-3 bg-red-100 hover:bg-red-200 text-emergency font-bold text-xs rounded-xl border border-red-300 flex items-center justify-center gap-1.5 transition-all active:scale-98"
                      >
                        <span>{t('refer_phc')}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                      <a
                        href="tel:108"
                        className="min-h-touch py-2.5 px-3 bg-emergency hover:bg-emergency-dark text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5 transition-all active:scale-98"
                        aria-label="Call 108 Ambulance"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>{t('call_108_btn')} ({t('ambulance_108')})</span>
                      </a>
                    </div>

                    <div className="mt-2 pt-2 border-t border-red-200/60 flex items-center justify-between text-[11px] text-red-800">
                      <span>{msg.protocolCitation}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {msg.durationMs}ms
                      </span>
                    </div>
                  </div>
                )}

                {/* Case 2: Small Talk / Greetings */}
                {msg.type === 'smalltalk' && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-gray-900 shadow-sm space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <MessageCircle className="w-4 h-4" />
                      <span>{t('app_title')}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">
                      {t(msg.messageKey) || msg.message}
                    </p>
                    {msg.chips && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {msg.chips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(chip)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-xs text-primary font-semibold rounded-full border border-emerald-300 transition-colors"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="pt-2 border-t border-emerald-100 text-right text-[11px] text-gray-400 font-mono">
                      {msg.durationMs}ms
                    </div>
                  </div>
                )}

                {/* Case 3: Refusal (Out of Scope / Prescription) */}
                {msg.type === 'refusal' && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{t('outside_scope_title')}</span>
                    </div>
                    <p className="text-xs text-amber-950 mt-1.5 leading-relaxed font-medium">
                      {t(msg.messageKey) || msg.message}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-amber-200 flex items-center justify-between text-[11px] text-amber-800">
                      <span>{msg.source}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {msg.durationMs}ms
                      </span>
                    </div>
                  </div>
                )}

                {/* Case 4: Verified Protocol Answer */}
                {msg.type === 'answer' && !msg.isWelcome && (
                  <div className="p-4 bg-white border border-gray-200 rounded-2xl text-gray-900 shadow-sm space-y-2">
                    {msg.title && (
                      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {msg.title}
                      </h4>
                    )}
                    <p className="text-sm text-gray-800 leading-relaxed font-normal whitespace-pre-line">
                      {msg.text}
                    </p>

                    {/* Source Citation & Latency */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                      <span className="font-semibold text-primary bg-primary-light px-2 py-0.5 rounded">
                        {t('source_citation')}: {msg.docName || msg.citation}, {t('section')} {msg.docSection || ''}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-gray-400">
                        <Clock className="w-3 h-3" /> {msg.durationMs}ms
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white p-3 rounded-2xl border border-gray-200 max-w-[70%]">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span>{t('retrieving_indicator')}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Question Chips */}
      <div className="px-1 py-2 bg-gray-50 border-t border-gray-200 overflow-x-auto shrink-0 flex gap-2 no-scrollbar">
        {suggestedChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.query)}
            disabled={isProcessing}
            className="shrink-0 px-3.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-xs text-gray-700 hover:text-primary font-medium rounded-full border border-gray-300 transition-all shadow-xs"
          >
            {t(chip.labelKey)}
          </button>
        ))}
      </div>

      {/* Input Box & Mic Controls */}
      <div className="p-2 md:p-3 bg-white border-t border-gray-200 shrink-0 rounded-b-xl">
        {/* Active Listening Indicator */}
        {isListening && (
          <div className="mb-2 p-2.5 bg-red-50 border border-red-300 rounded-xl flex items-center justify-between text-xs text-red-900 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span className="font-bold flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-red-600 animate-bounce" />
                {t('voice_listening')} ({language === 'te' ? 'te-IN' : 'en-IN'})
              </span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[11px] active:scale-95 transition-all shadow-xs"
            >
              {t('stop')}
            </button>
          </div>
        )}

        {/* Voice Error Notification */}
        {voiceError && (
          <div className="mb-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center justify-between animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-medium">{voiceError}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceError(null)}
              className="p-1 text-amber-700 hover:text-amber-950 rounded"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Mic Button - 48px touch target */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!isOnline}
            className={`min-h-touch min-w-touch p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-600 text-white border-red-700 animate-pulse ring-2 ring-red-400'
                : !isOnline
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                : 'border-gray-300 hover:bg-emerald-50 active:scale-95 text-gray-700 hover:text-primary'
            }`}
            aria-label={isListening ? t('voice_listening') : !isOnline ? t('voice_offline_disabled') : t('voice_listening')}
            title={!isOnline ? t('voice_offline_disabled') : isListening ? t('voice_listening') : t('voice_listening')}
          >
            {isListening ? (
              <Mic className="w-5 h-5 text-white animate-bounce" />
            ) : !isOnline ? (
              <MicOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Mic className="w-5 h-5 text-gray-700" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-1 min-h-touch px-4 py-2 text-base text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white"
            disabled={isProcessing}
          />

          {/* Send Button - 48px touch target */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isProcessing}
            className="min-h-touch min-w-touch px-4 py-2.5 bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl font-bold flex items-center justify-center transition-all shadow-sm"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
