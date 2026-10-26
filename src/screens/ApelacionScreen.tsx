import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/storeHooks';
import { Button } from '@/components/ui';
import { apelarInasistencia } from '@/api/panel';
import { ApiError } from '@/api/http';

export default function ApelacionScreen() {
  const { setScreen, appealCitaId } = useApp();
  const [motivo, setMotivo] = useState('');
  const [explicacion, setExplicacion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo supera los 5 MB.');
        return;
      }
      setArchivo(file);
      setError(null);
    }
  };

  const enviar = async () => {
    if (!appealCitaId || !archivo || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      await apelarInasistencia(appealCitaId, archivo);
      setExito(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo enviar la apelación.');
    } finally {
      setEnviando(false);
    }
  };

  const volver = () => setScreen('patientDashboard');

  return (
    <div className="min-h-screen bg-slatey-50 pb-24">
      <div className="sticky top-0 z-30 border-b border-slatey-100 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center gap-3">
          <button onClick={volver} aria-label="Volver" className="p-2 -ml-2 rounded-xl hover:bg-slatey-100">
            <ArrowLeft className="w-5 h-5 text-slatey-700" />
          </button>
          <h2 className="text-lg font-bold text-slatey-900 font-display">Apelar inasistencia</h2>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-5 space-y-5">
        {!exito ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-amber-800">Adjunta tu certificado o descanso médico (PDF, JPG o PNG, máx. 5 MB). Solo puedes apelar una vez por cita y dentro de los 7 días siguientes.</p>
            </div>

            <div>
              <label htmlFor="motivo" className="block text-sm font-semibold text-slatey-700 mb-1">Motivo de la apelación</label>
              <select id="motivo" value={motivo} onChange={e => setMotivo(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-white text-sm focus:border-primary-400 focus:outline-none">
                <option value="">Selecciona un motivo</option>
                <option value="imprevisto_medico">Imprevisto médico</option>
                <option value="emergencia_familiar">Emergencia familiar</option>
                <option value="transporte">Problemas de transporte</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="explicacion" className="block text-sm font-semibold text-slatey-700 mb-1">Explicación detallada</label>
              <textarea id="explicacion" value={explicacion} onChange={e => setExplicacion(e.target.value)} rows={4} placeholder="Describe brevemente lo ocurrido…" className="w-full px-4 py-3 rounded-2xl border-2 border-slatey-200 bg-white text-sm focus:border-primary-400 focus:outline-none resize-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slatey-700 mb-1">Evidencia médica</label>
              <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" id="archivo" onChange={handleFileChange} />
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slatey-200 text-slatey-500 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm font-medium">
                <Upload className="w-5 h-5" />
                {archivo ? archivo.name : 'Adjuntar certificado (PDF, JPG o PNG · máx. 5 MB)'}
              </button>
            </div>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-2xl bg-error-50 border border-error-100 px-3.5 py-3 text-xs font-medium text-error-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

            <Button fullWidth loading={enviando} disabled={!motivo || !explicacion.trim() || !archivo} onClick={enviar}>
              Enviar apelación
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-9 h-9 text-success-500" />
            </div>
            <h3 className="text-lg font-bold text-slatey-900 mb-1">Apelación enviada</h3>
            <p className="text-sm text-slatey-500 mb-6">El odontólogo revisará tu certificado. Si la aprueba, se te quita el strike y se te devuelve el depósito.</p>
            <Button onClick={volver}>Volver al inicio</Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}