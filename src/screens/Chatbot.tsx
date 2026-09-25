import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Bot, Calendar, ShieldCheck, Clock } from 'lucide-react';
import { useApp } from '../store';
import type { ChatMessage } from '../types';

const QUICK_REPLIES = [
  { label: '¿Cómo reprogramar?', icon: Calendar },
  { label: 'Política de reembolso 24h', icon: ShieldCheck },
  { label: 'Tolerancia 15 min', icon: Clock },
];

const BOT_RESPONSES: Record<string, string> = {
  '¿Cómo reprogramar?':
    'Para reprogramar tu cita: 1) Ve a "Mis Citas" en tu dashboard. 2) Selecciona la cita que quieres cambiar. 3) Elige nueva fecha y hora. 4) Confirma. Recuerda: si lo haces con más de 24h de anticipación, no pierdes tu garantía. ¿Te ayudo con algo más?',
  'Política de reembolso 24h':
    'Nuestra política de reembolso: Si cancelas con 24+ horas de anticipación, tu garantía de S/ 20.00 es 100% reembolsable. Si cancelas con menos de 24h, la garantía se retiene como compensación al odontólogo. En caso de fuerza mayor (descanso médico), puedes apelar la inasistencia desde tu dashboard.',
  'Tolerancia 15 min':
    'El sistema de tolerancia funciona así: Tienes 15 minutos de gracia desde la hora de tu cita. Pasado ese tiempo, el odontólogo puede marcar inasistencia, lo que aplica 1 strike a tu récord. Con 3 strikes, tu cuenta puede ser restringida temporalmente. Siempre puedes apelar con un descanso médico válido.',
};

export default function Chatbot() {
  const { setScreen } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: '¡Hola! Soy OdontoBot, tu asistente de orientación dental. ¿En qué puedo ayudarte hoy?',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const response =
        BOT_RESPONSES[text] ||
        `Entiendo tu consulta sobre "${text}". Estoy aquí para orientarte. Para asistencia más específica, puedes contactar directamente a tu odontólogo desde el dashboard o escribirnos a soporte@odontosystem.pe. ¿Hay algo más en lo que pueda ayudarte?`;
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), sender: 'bot', text: response, timestamp: Date.now() },
      ]);
      setTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4.5rem)] sm:h-screen bg-slatey-50 max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-slatey-100 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setScreen('patientDashboard')}
            className="p-2 -ml-2 rounded-xl hover:bg-slatey-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slatey-700" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-500 border-2 border-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold text-slatey-900 font-display leading-tight">OdontoBot</h2>
            <p className="text-xs text-success-600 font-medium">En línea</p>
          </div>
        </div>
      </div>

      {/* Area de Mensajes */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 w-full"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 80%, rgba(13, 148, 136, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)`,
        }}
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-primary-500 text-white rounded-br-xs'
                    : 'bg-white text-slatey-800 rounded-bl-xs border border-slatey-100'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-xs font-bold text-primary-600">OdontoBot</span>
                  </div>
                )}
                <p>{msg.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-xs border border-slatey-100 shadow-sm">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-slatey-300"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Replies */}
      {messages.length <= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-2 w-full bg-transparent shrink-0"
        >
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_REPLIES.map((qr) => {
              const Icon = qr.icon;
              return (
                <button
                  key={qr.label}
                  onClick={() => sendMessage(qr.label)}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-primary-200 text-primary-700 text-xs font-medium hover:bg-primary-50 active:scale-95 transition-all shadow-xs"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {qr.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Input Flotante / Inferior */}
      <div className="bg-white border-t border-slatey-100 px-4 py-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slatey-100 text-slatey-900 placeholder:text-slatey-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-400 transition-all text-sm"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-2xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-40 active:scale-95 transition-all shrink-0 shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}