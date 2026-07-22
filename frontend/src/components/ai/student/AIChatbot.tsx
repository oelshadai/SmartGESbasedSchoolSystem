import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, BookOpen, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { secureApiClient } from '@/lib/secureApiClient';

// Browser speech API types
const SpeechRecognitionAPI =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognitionAPI;
const hasSpeechSynthesis = 'speechSynthesis' in window;

interface Message {
  id: number;
  role: 'student' | 'ai';
  text: string;
  time: string;
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'Social Studies', 'ICT', 'French', 'RME', 'Creative Arts', 'Ghanaian Language'];

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'ai',
      text: "Hi! I'm your AI Tutor 👋 Ask me anything about your schoolwork. I'll guide you with hints on homework questions!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('all');
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(0);
  const [limit] = useState(20);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const speakingIdRef = useRef<number | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up speech on unmount
  useEffect(() => () => {
    window.speechSynthesis?.cancel();
    clearInterval(resumeTimerRef.current);
    recognitionRef.current?.stop();
  }, []);

  const resumeTimerRef = useRef<any>(null);

  const speak = useCallback((text: string, msgId: number) => {
    if (!hasSpeechSynthesis) return;
    window.speechSynthesis.cancel();
    clearInterval(resumeTimerRef.current);
    if (speakingIdRef.current === msgId) {
      speakingIdRef.current = null;
      setSpeakingId(null);
      return;
    }
    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 1;
      utt.onstart = () => {
        // Android Chrome bug: synthesis pauses after ~15s, keep resuming it
        resumeTimerRef.current = setInterval(() => {
          if (window.speechSynthesis.speaking) window.speechSynthesis.resume();
          else clearInterval(resumeTimerRef.current);
        }, 10000);
      };
      utt.onend = () => { clearInterval(resumeTimerRef.current); speakingIdRef.current = null; setSpeakingId(null); };
      utt.onerror = () => { clearInterval(resumeTimerRef.current); speakingIdRef.current = null; setSpeakingId(null); };
      speakingIdRef.current = msgId;
      setSpeakingId(msgId);
      window.speechSynthesis.speak(utt);
    };
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) { doSpeak(); }
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; doSpeak(); }; }
  }, []);

  const toggleListening = useCallback(() => {
    if (!hasSpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognitionAPI();
    rec.lang = 'en-US';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), role: 'student', text, time }]);
    setInput('');
    setLoading(true);

    try {
      const res = await secureApiClient.post('/ai/student/chat/', {
        message: text,
        subject: subject !== 'all' ? subject : undefined,
      }) as any;

      const aiMsg: Message = { id: Date.now() + 1, role: 'ai', text: res.reply, time };
      setMessages(prev => [...prev, aiMsg]);
      setUsed(res.messages_used ?? used + 1);
      if (autoSpeak && hasSpeechSynthesis) speak(res.reply, aiMsg.id);

      // Show suggestions as quick-reply chips
      if (res.suggestions?.length) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 2,
            role: 'ai',
            text: `__suggestions__${JSON.stringify(res.suggestions)}`,
            time,
          },
        ]);
      }
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong. Try again.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: `⚠️ ${msg}`, time }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const useSuggestion = (s: string) => {
    setInput(s);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary rounded-t-2xl">
        <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">AI Tutor</p>
          <p className="text-xs text-white/70">Always here to help</p>
        </div>
        <div className="text-right flex items-center gap-2">
          {hasSpeechSynthesis && (
            <button
              onClick={() => { setAutoSpeak(p => !p); window.speechSynthesis.cancel(); setSpeakingId(null); }}
              title={autoSpeak ? 'Auto-speak on — click to turn off' : 'Auto-speak off — click to turn on'}
              className={`p-1.5 rounded-lg transition-colors ${autoSpeak ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'}`}
            >
              {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          )}
          <div>
            <p className="text-xs text-white/70">Questions today</p>
            <p className={`text-sm font-bold ${used >= limit ? 'text-red-300' : 'text-white'}`}>
              {used}/{limit}
            </p>
          </div>
        </div>
      </div>

      {/* Subject selector */}
      <div className="px-3 py-2 bg-muted/50 border-b border-border">
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="h-8 text-xs bg-background">
            <BookOpen className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Select subject (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">No specific subject</SelectItem>
            {SUBJECTS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-muted/20">
        {messages.map(msg => {
          // Suggestions chip row
          if (msg.text.startsWith('__suggestions__')) {
            const suggestions: string[] = JSON.parse(msg.text.replace('__suggestions__', ''));
            return (
              <div key={msg.id} className="flex flex-wrap gap-2 pl-10">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => useSuggestion(s)}
                    className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 hover:bg-primary/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            );
          }

          const isAI = msg.role === 'ai';
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isAI ? '' : 'flex-row-reverse'}`}>
              {/* Avatar */}
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${isAI ? 'bg-primary/10' : 'bg-emerald-100'}`}>
                {isAI
                  ? <Bot className="h-4 w-4 text-primary" />
                  : <User className="h-4 w-4 text-emerald-600" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm ${
                isAI
                  ? 'bg-card border border-border rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <div className={`flex items-center justify-end gap-2 mt-1`}>
                  {isAI && hasSpeechSynthesis && (
                    <button
                      onClick={() => speak(msg.text, msg.id)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                      title={speakingId === msg.id ? 'Stop reading' : 'Read aloud'}
                    >
                      {speakingId === msg.id
                        ? <VolumeX className="h-3.5 w-3.5" />
                        : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                  <p className={`text-[10px] ${isAI ? 'text-muted-foreground' : 'text-primary-foreground/60'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-end gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 bg-card border-t border-border rounded-b-2xl">
        {used >= limit && (
          <p className="text-xs text-destructive text-center mb-2">Daily limit reached. Come back tomorrow!</p>
        )}
        <div className="flex items-end gap-2">
          {hasSpeechRecognition && (
            <Button
              size="icon"
              variant={listening ? 'destructive' : 'outline'}
              className="h-9 w-9 rounded-xl shrink-0"
              onClick={toggleListening}
              disabled={used >= limit || loading}
              title={listening ? 'Stop listening' : 'Speak your question'}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={listening ? '🎤 Listening…' : 'Ask your AI Tutor…'}
            rows={1}
            disabled={used >= limit || loading}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 max-h-28 overflow-y-auto"
            style={{ minHeight: '42px' }}
          />
          <div className="flex flex-col items-end gap-1">
            <span className="text-[10px] text-muted-foreground">{input.length}/500</span>
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0"
              onClick={send}
              disabled={!input.trim() || loading || used >= limit}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
