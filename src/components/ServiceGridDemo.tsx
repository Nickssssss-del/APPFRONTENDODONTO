import { useEffect, useState } from 'react';
import { ServiceGrid } from '@/components/ServiceCard';
import type { ServiceItem } from '@/types';

/**
 * Banco de pruebas del catálogo con datos del SQL (v9.0) + casos límite a propósito:
 * título larguísimo, descripción vacía, imagen rota (las URLs del SQL son placeholders),
 * sin imagen y precio con decimales. Móntalo en una ruta temporal para ver cómo aguanta el grid.
 */
export const DEMO_SERVICES: ServiceItem[] = [
  { id: '1', title: 'Consulta odontológica general', description: 'Evaluación clínica completa y orientación del tratamiento.', category: 'Consulta y diagnóstico', priceTotal: 50, durationMin: 30, imageUrl: 'https://cdn.odontosystem.pe/servicios/consulta.jpg' },
  { id: '2', title: 'Instalación de brackets metálicos', description: 'Colocación de aparatología fija metálica.', category: 'Ortodoncia', priceTotal: 2160, durationMin: 90, imageUrl: null },
  { id: '3', title: 'Estudio inicial de ortodoncia invisible con escaneo intraoral 3D y plan digital de alineadores', description: 'Escaneo, fotografías y plan digital de alineadores. Incluye simulación de resultado final y presupuesto detallado por etapas de tratamiento.', category: 'Ortodoncia', priceTotal: 360, durationMin: 60, imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' },
  { id: '4', title: 'Extracción dental simple', description: '', category: 'Cirugía y extracciones', priceTotal: 120, durationMin: 30, imageUrl: 'https://cdn.odontosystem.pe/servicios/extraccion.jpg' },
  { id: '5', title: 'Aplicación de flúor', description: 'Aplicación tópica de flúor para prevención de caries.', category: 'Limpieza y prevención', priceTotal: 49.5, durationMin: 30, imageUrl: null },
  { id: '6', title: 'Endodoncia unirradicular', description: 'Tratamiento de conductos en pieza de un conducto.', category: 'Endodoncia', priceTotal: 405, durationMin: 90, imageUrl: null },
];

export default function ServiceGridDemo() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slatey-50 p-4">
      <h1 className="mb-3 font-display text-lg font-extrabold text-slatey-900">Catálogo de servicios</h1>
      <ServiceGrid items={DEMO_SERVICES} loading={loading} onReserve={(s) => console.log('reservar', s.id)} />
    </div>
  );
}
