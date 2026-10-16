import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarCheck, Check, MapPin, ShieldCheck } from 'lucide-react';
import { useApp } from '@/store';

/* ───────────────────────── persistencia ───────────────────────── */

export const TUTORIAL_KEY = 'tutorial_bienvenida_visto';

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {
    /* modo privado: simplemente se mostrará de nuevo */
  }
}

/* ───────────────────────── ilustraciones ───────────────────────── */

/** Slide 1 · Mapa con pines que caen y radar "estás aquí". */
function MapIllustration({ reduce }: { reduce: boolean }) {
  const pins = [
    { x: '22%', y: '28%', d: 0.25 },
    { x: '68%', y: '22%', d: 0.4 },
    { x: '80%', y: '52%', d: 0.55 },
  ];
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-primary-50">
      {/* calles */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 280 240" preserveAspectRatio="none" aria-hidden>
        <path d="M0 150 C70 120 120 170 280 110" stroke="#fff" strokeWidth="14" fill="none" />
        <path d="M90 0 C110 80 80 150 120 240" stroke="#fff" strokeWidth="10" fill="none" />
        <path d="M200 0 C190 60 230 140 210 240" stroke="#fff" strokeWidth="8" fill="none" />
        <circle cx="40" cy="40" r="26" fill="#CCFBF1" />
        <rect x="150" y="170" width="70" height="40" rx="10" fill="#CCFBF1" />
      </svg>

      {/* tú */}
      <div className="absolute left-[44%] top-[50%] -translate-x-1/2 -translate-y-1/2">
        {!reduce && (
          <motion.span
            className="absolute -inset-5 rounded-full bg-primary-400/30"
            animate={{ scale: [0.6, 1.5], opacity: [0.7, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className="relative block h-4 w-4 rounded-full border-[3px] border-white bg-primary-500 shadow-md" />
      </div>

      {/* pines */}
      {pins.map((p, i) => (
        <motion.div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: p.x, top: p.y }}
          initial={reduce ? false : { y: -40, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 16, delay: p.d }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 shadow-lg shadow-primary-500/40 ring-4 ring-white">
            <MapPin className="h-4 w-4 text-white" aria-hidden />
          </div>
        </motion.div>
      ))}

      {/* tarjeta flotante */}
      <motion.div
        className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-xl shadow-slatey-900/10"
        initial={reduce ? false : { y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-display text-sm font-extrabold text-primary-700">
          LV
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-xs font-bold text-slatey-900">Dra. Lucía Vargas</p>
          <p className="truncate text-[11px] text-slatey-500">Odontopediatría · 1.2 km</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-success-50 px-2 py-1 text-[10px] font-bold text-success-700">
          <BadgeCheck className="h-3 w-3" aria-hidden /> COP
        </span>
      </motion.div>
    </div>
  );
}

/** Slide 2 · Calendario: los horarios se "eligen solos" en bucle. */
function BookingIllustration({ reduce }: { reduce: boolean }) {
  const slots = ['09:00', '09:45', '10:30', '11:15', '15:00', '15:45'];
  const taken = new Set([1, 4]);
  const [sel, setSel] = useState(2);

  useEffect(() => {
    if (reduce) return;
    const order = [2, 3, 5, 0];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % order.length;
      setSel(order[i]);
    }, 1500);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 rounded-[2rem] bg-slatey-100 p-4">
      <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((d, i) => (
          <div
            key={d}
            className={`flex w-10 flex-col items-center rounded-xl py-1.5 ${i === 1 ? 'bg-primary-500 text-white' : 'text-slatey-500'}`}
          >
            <span className="text-[10px] font-semibold">{d}</span>
            <span className="text-sm font-extrabold">{13 + i}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {slots.map((t, i) => {
          const isSel = sel === i;
          const isTaken = taken.has(i);
          return (
            <motion.div
              key={t}
              animate={{ scale: isSel ? 1.06 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className={`rounded-xl py-2.5 text-center text-xs font-bold ${
                isTaken
                  ? 'bg-slatey-200 text-slatey-400 line-through'
                  : isSel
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'bg-white text-slatey-700'
              }`}
            >
              {t}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        key={sel}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 rounded-2xl bg-slatey-900 py-3 text-xs font-bold text-white"
      >
        <CalendarCheck className="h-4 w-4 text-primary-300" aria-hidden />
        Confirmar cita · {slots[sel]}
      </motion.div>
    </div>
  );
}

/** Slide 3 · Odontograma: las piezas cambian de estado en secuencia. */
type ToothState = 'ok' | 'caries' | 'restored' | 'crown';
const TOOTH_COLORS: Record<ToothState, { fill: string; stroke: string }> = {
  ok: { fill: '#FFFFFF', stroke: '#CBD5E1' },
  caries: { fill: '#FCA5A5', stroke: '#DC2626' },
  restored: { fill: '#99F6E4', stroke: '#0E9488' },
  crown: { fill: '#FDE68A', stroke: '#D97706' },
};
const TOOTH_PATH =
  'M6 4 C10 1 18 1 22 4 C26 8 24 16 22 24 C21 30 19 33 17 33 C15 33 15 26 14 26 C13 26 13 33 11 33 C9 33 7 30 6 24 C4 16 2 8 6 4 Z';

function OdontogramIllustration({ reduce }: { reduce: boolean }) {
  const upper: ToothState[] = ['ok', 'ok', 'restored', 'caries', 'ok', 'crown', 'ok', 'ok'];
  const lower: ToothState[] = ['ok', 'restored', 'ok', 'ok', 'ok', 'ok', 'caries', 'ok'];

  // <g> exterior = posición (atributo transform). <motion.g> interior = animación de escala.
  // Si se mezclan en el mismo nodo, Framer sobrescribe el translate y todas las piezas se apilan.
  const arch = (states: ToothState[], y: number, flip: boolean, offset: number) =>
    states.map((st, i) => (
      <g
        key={`${y}-${i}`}
        transform={`translate(${6 + i * 32} ${y})${flip ? ' translate(0 34) scale(1 -1)' : ''}`}
      >
        <motion.g
          initial={reduce ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: offset + i * 0.06, type: 'spring', stiffness: 400, damping: 16 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <motion.path
            d={TOOTH_PATH}
            strokeWidth={1.6}
            initial={reduce ? false : { fill: '#FFFFFF', stroke: '#CBD5E1' }}
            animate={{ fill: TOOTH_COLORS[st].fill, stroke: TOOTH_COLORS[st].stroke }}
            transition={{ delay: 0.9 + offset + i * 0.12, duration: 0.4 }}
          />
        </motion.g>
      </g>
    ));

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[2rem] bg-white p-4 shadow-inner ring-1 ring-slatey-100">
      <svg viewBox="0 0 262 100" className="w-full" role="img" aria-label="Odontograma de ejemplo">
        {arch(upper, 4, false, 0)}
        <line x1="0" y1="50" x2="262" y2="50" stroke="#E2E8F0" strokeDasharray="3 4" />
        {arch(lower, 62, true, 0.3)}
      </svg>

      <div className="flex flex-wrap justify-center gap-1.5">
        {[
          ['Sana', '#FFFFFF', '#CBD5E1'],
          ['Caries', '#FCA5A5', '#DC2626'],
          ['Restaurada', '#99F6E4', '#0E9488'],
          ['Corona', '#FDE68A', '#D97706'],
        ].map(([label, fill, stroke]) => (
          <span key={label} className="flex items-center gap-1.5 rounded-full bg-slatey-50 px-2.5 py-1 text-[10px] font-semibold text-slatey-600">
            <span className="h-2.5 w-2.5 rounded-full border" style={{ background: fill, borderColor: stroke }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Slide 4 · Pago: escudo que se "dibuja" + métodos de pago. */
function PaymentIllustration({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-[2rem] bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {!reduce && (
          <motion.span
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <ShieldCheck className="h-20 w-20 text-white/25" strokeWidth={1.2} aria-hidden />
        <svg viewBox="0 0 24 24" className="absolute h-10 w-10" fill="none" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-[11px] font-medium text-primary-200">Depósito de garantía</p>
        <p className="font-display text-2xl font-extrabold">S/ 18.00</p>
      </div>

      <div className="flex gap-2">
        {[
          { l: 'Yape', c: 'bg-[#742284]' },
          { l: 'Plin', c: 'bg-[#00A9E0]' },
          { l: 'Tarjeta', c: 'bg-slatey-900' },
        ].map((m, i) => (
          <motion.span
            key={m.l}
            initial={reduce ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.1, type: 'spring', stiffness: 320, damping: 20 }}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold ${m.c}`}
          >
            <Check className="h-3 w-3" aria-hidden /> {m.l}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── slides ───────────────────────── */

type Slide = {
  id: string;
  title: string;
  text: string;
  Illustration: (props: { reduce: boolean }) => JSX.Element;
};

const SLIDES: Slide[] = [
  {
    id: 'buscar',
    title: 'Odontólogos verificados, cerca de ti',
    text: 'Busca por distrito en Ica y mira solo profesionales con colegiatura COP validada.',
    Illustration: MapIllustration,
  },
  {
    id: 'reservar',
    title: 'Reserva en menos de un minuto',
    text: 'Elige especialidad, día y hora disponible en tiempo real. Tu horario se bloquea mientras confirmas.',
    Illustration: BookingIllustration,
  },
  {
    id: 'historial',
    title: 'Tu odontograma, siempre contigo',
    text: 'Consulta el estado de cada pieza, tus radiografías y tratamientos en un solo lugar.',
    Illustration: OdontogramIllustration,
  },
  {
    id: 'pago',
    title: 'Paga seguro y sin sorpresas',
    text: 'Un depósito de garantía asegura tu cita. Paga con Yape, Plin o tarjeta.',
    Illustration: PaymentIllustration,
  },
];

const SWIPE_PX = 60;
const SWIPE_VELOCITY = 400;

/* ───────────────────────── pantalla ───────────────────────── */

export default function WelcomeTutorial() {
  const { setScreen } = useApp();
  const reduce = !!useReducedMotion();
  const [[index, direction], setPage] = useState<[number, number]>([0, 1]);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const finish = useCallback(() => {
    markTutorialSeen();
    setScreen('onboarding');
  }, [setScreen]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setPage(([i]) => {
        const next = i + dir;
        if (next < 0 || next >= SLIDES.length) return [i, dir];
        navigator.vibrate?.(8);
        return [next, dir];
      });
    },
    [],
  );

  const next = () => (isLast ? finish() : go(1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (isLast) finish();
        else go(1);
      }
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, isLast, finish]);

  const onDragEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX || info.velocity.x < -SWIPE_VELOCITY) {
      if (isLast) finish();
      else go(1);
    } else if (info.offset.x > SWIPE_PX || info.velocity.x > SWIPE_VELOCITY) {
      go(-1);
    }
  };

  const variants = {
    enter: (d: number) => ({ x: reduce ? 0 : d * 70, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: reduce ? 0 : d * -70, opacity: 0 }),
  };

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden bg-slatey-50 px-5 pb-6 pt-4"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Tutorial de bienvenida"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-primary-100/70 to-transparent" />

      {/* barra superior */}
      <div className="flex h-10 items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/System_(3).png" alt="" className="h-7 w-7 object-contain" />
          <span className="font-display text-sm font-extrabold text-slatey-900">OdontoSystem</span>
        </div>
        {!isLast && (
          <button
            type="button"
            onClick={finish}
            className="rounded-lg px-3 py-2 text-xs font-bold text-slatey-500 transition-colors hover:bg-slatey-100 hover:text-slatey-800"
          >
            Omitir
          </button>
        )}
      </div>

      {/* contenido deslizable */}
      <div className="relative flex flex-1 flex-col justify-center">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: reduce ? 0.01 : 0.28, ease: [0.4, 0, 0.2, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            className="touch-pan-y select-none"
          >
            <div className="mx-auto h-[280px] w-full max-w-[320px]">
              <slide.Illustration reduce={reduce} />
            </div>

            <div className="mx-auto mt-8 max-w-xs text-center" aria-live="polite">
              <h1 className="font-display text-2xl font-extrabold leading-tight text-slatey-900">{slide.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-slatey-500">{slide.text}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* indicadores */}
      <div className="mb-5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Pasos del tutorial">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Paso ${i + 1} de ${SLIDES.length}`}
            onClick={() => setPage([i, i > index ? 1 : -1])}
            className="flex h-6 items-center"
          >
            <motion.span
              animate={{ width: i === index ? 24 : 8, backgroundColor: i === index ? '#0E9488' : '#CBD5E1' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="block h-2 rounded-full"
            />
          </button>
        ))}
      </div>

      {/* acción principal */}
      <motion.button
        type="button"
        onClick={next}
        whileTap={{ scale: 0.97 }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-4 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-colors hover:bg-primary-600"
      >
        {isLast ? 'Comenzar' : 'Siguiente'}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </motion.button>
    </div>
  );
}
