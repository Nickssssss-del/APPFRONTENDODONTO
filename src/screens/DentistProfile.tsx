import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Star, Lock, FileText, AlertCircle, MessageCircle,
  Settings, Calendar, Upload, ArrowRight, CheckCircle2, Sofa,
  Navigation, X, BadgeCheck, Stethoscope, Phone, Mail,
  User as UserIcon, Clock, RotateCcw,
} from 'lucide-react';
import { useApp } from '@/store';
import { Button, Badge } from '@/components/ui';
import type { DentistProfile } from '@/types';

export default function DentistProfile() {
  const { setScreen, selectedDentistId } = useApp();
  
  // Mock dentist profile data - in a real app this would come from an API
  const dentistProfiles: Record<string, DentistProfile> = {
    '1': {
      fullName: 'Dr. Carlos Mendoza',
      specialty: 'Odontólogo General',
      cop: 'COP 34512',
      ruc: '10123456789',
      email: 'carlos.mendoza@odontosystem.com',
      phone: '999 888 777',
      photo: 'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      clinicPhotos: [
        'https://images.pexels.com/photos/37458046/pexels-photo-37458046.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        'https://images.pexels.com/photos/614765/pexels-photo-614765.jpeg?auto=compress&cs=tinysrgb&h=120&w=120',
        'https://images.pexels.com/photos/414622/pexels-photo-414622.jpeg?auto=compress&cs=tinysrgb&h=120&w=120'
      ],
      workDays: {
        'Lun': { active: true, start: '08:00', end: '17:00' },
        'Mar': { active: true, start: '08:00', end: '17:00' },
        'Mié': { active: true, start: '08:00', end: '17:00' },
        'Jue': { active: true, start: '08:00', end: '17:00' },
        'Vie': { active: true, start: '08:00', end: '17:00' },
        'Sáb': { active: true, start: '09:00', end: '14:00' },
        'Dom': { active: false, start: '', end: '' }
      }
    },
    '2': {
      fullName: 'Dra. Patricia Ruiz',
      specialty: 'Ortodoncista',
      cop: 'COP 28765',
      ruc: '10123456790',
      email: 'patricia.ruiz@odontosystem.com',
      phone: '998 777 666',
      photo: 'https://images.pexels.com/photos/6812464/pexels-photo-6812464.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      clinicPhotos: [
        'https://images.pexels.com/photos/6812464/pexels-photo-6812464.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        'https://images.pexels.com/photos/414622/pexels-photo-414622.jpeg?auto=compress&cs=tinysrgb&h=120&w=120'
      ],
      workDays: {
        'Lun': { active: true, start: '09:00', end: '18:00' },
        'Mar': { active: true, start: '09:00', end: '18:00' },
        'Mié': { active: true, start: '09:00', end: '18:00' },
        'Jue': { active: true, start: '09:00', end: '18:00' },
        'Vie': { active: true, start: '09:00', end: '18:00' },
        'Sáb': { active: false, start: '', end: '' },
        'Dom': { active: false, start: '', end: '' }
      }
    },
    '3': {
      fullName: 'Dr. Miguel Torres',
      specialty: 'Endodoncista',
      cop: 'COP 45123',
      ruc: '10123456791',
      email: 'miguel.torres@odontosystem.com',
      phone: '997 666 555',
      photo: 'https://images.pexels.com/photos/37458054/pexels-photo-37458054.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      clinicPhotos: [
        'https://images.pexels.com/photos/37458054/pexels-photo-37458054.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        'https://images.pexels.com/photos/297405/pexels-photo-297405.jpeg?auto=compress&cs=tinysrgb&h=120&w=120'
      ],
      workDays: {
        'Lun': { active: true, start: '10:00', end: '19:00' },
        'Mar': { active: true, start: '10:00', end: '19:00' },
        'Mié': { active: true, start: '10:00', end: '19:00' },
        'Jue': { active: true, start: '10:00', end: '19:00' },
        'Vie': { active: true, start: '10:00', end: '19:00' },
        'Sáb': { active: true, start: '10:00', end: '15:00' },
        'Dom': { active: false, start: '', end: '' }
      }
    },
    '4': {
      fullName: 'Dra. Lucía Vargas',
      specialty: 'Odontopediatra',
      cop: 'COP 31234',
      ruc: '10123456792',
      email: 'lucia.vargas@odontosystem.com',
      phone: '984 666 777',
      photo: 'https://images.pexels.com/photos/32205053/pexels-photo-32205053.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
      clinicPhotos: [
        'https://images.pexels.com/photos/32205053/pexels-photo-32205053.jpeg?auto=compress&cs=tinysrgb&h=200&w=200',
        'https://images.pexels.com/photos/302579/pexels-photo-302579.jpeg?auto=compress&cs=tinysrgb&h=120&w=120'
      ],
      workDays: {
        'Lun': { active: true, start: '08:00', end: '17:00' },
        'Mar': { active: true, start: '08:00', end: '17:00' },
        'Mié': { active: true, start: '08:00', end: '17:00' },
        'Jue': { active: true, start: '08:00', end: '17:00' },
        'Vie': { active: true, start: '08:00', end: '17:00' },
        'Sáb': { active: true, start: '08:00', end: '13:00' },
        'Dom': { active: false, start: '', end: '' }
      }
    }
  };

  const getDentistProfile = (id: string): DentistProfile | null => {
    return dentistProfiles[id] || null;
  };

  const handleBack = () => {
    setScreen('patientDashboard');
    // Clear the selected dentist when going back
    // Note: We don't have a setter for selectedDentistId here, but we could add it if needed
  };

  const handleReserve = () => {
    // Navigate to marketplace to book appointment
    setScreen('marketplace');
    // Clear the selected dentist ID as we're moving to a different flow
    // In a real app, we might pass this as a parameter to the marketplace
  };

  const dentist = selectedDentistId ? getDentistProfile(selectedDentistId) : null;

  return (
    <div className="min-h-screen bg-slatey-50">
      {/* Header */}
      <div className="sticky top-0 z-30 glass border-b border-slatey-100">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            {dentist && (
              <>
                <img src={dentist.photo} alt={dentist.fullName} className="w-10 h-10 rounded-xl object-cover" />
                <div>
                  <h2 className="text-lg font-bold text-slatey-900 font-display leading-tight">{dentist.fullName}</h2>
                  <p className="text-sm font-semibold text-slatey-600">{dentist.specialty}</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center hover:bg-primary-100 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-primary-600" rotate={180} />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        {!dentist ? (
          <div className="text-center py-12">
            <p className="text-sm text-slatey-500">Cargando perfil del dentista...</p>
          </div>
        ) : (
          <>
            {/* About Me / Description Section */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slatey-900 mb-2">Sobre mí</h3>
              <p className="text-slatey-600 leading-relaxed">
                Soy un odontólogo apasionado por brindar la mejor atención dental a mis pacientes.
                Con años de experiencia en el campo, me especializo en {dentist.specialty.toLowerCase()} 
                y me esfuerzo por mantenerme actualizado con las últimas técnicas y tecnologías 
                en odontología. Mi enfoque es siempre preventivo y personalizado para cada paciente.
              </p>
            </div>

            {/* Clinic Photos */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slatey-900 mb-2">Fotos del Consultorio</h3>
              <div className="grid grid-cols-2 gap-4">
                {dentist.clinicPhotos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Consultorio ${index + 1}`}
                    className="w-full h-48 rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>

            {/* Work Hours */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slatey-900 mb-2">Horario de Atención</h3>
              <div className="space-y-3">
                {Object.entries(dentist.workDays).map(([day, schedule]) => (
                  <div key={day} className="flex justify-between px-3 py-2 rounded-xl bg-slatey-50">
                    <span className="font-medium text-slatey-700">{day}</span>
                    {schedule.active ? (
                      <span className="text-sm font-semibold text-slatey-900">
                        {schedule.start} - {schedule.end}
                      </span>
                    ) : (
                      <span className="text-sm text-slatey-500">Cerrado</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slatey-900 mb-2">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slatey-500" />
                  <span className="text-sm font-semibold text-slatey-900">{dentist.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slatey-500" />
                  <span className="text-sm font-semibold text-slatey-900">{dentist.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-slatey-500" />
                  <span className="text-sm font-semibold text-slatey-900">{dentist.cop}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button fullWidth onClick={handleReserve}>
                Reservar Cita
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button fullWidth variant="outline" onClick={handleBack}>
                Regresar al Listado
                <ArrowRight className="w-4 h-4" rotate={180} />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}