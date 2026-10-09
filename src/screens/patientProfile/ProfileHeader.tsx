import { useRef } from 'react';
import { Camera, CheckCircle2, Mail, Phone, Shield } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import type { UserProfile } from '@/types';

interface Props {
  user: UserProfile;
  avatarUrl: string | null;
  onAvatarChange: (file: File) => void;
}

/** Masks DNI: shows only last 3 digits — e.g. "12345678" → "·····678" */
function maskDni(dni: string): string {
  if (!dni || dni.length < 3) return '—';
  return '·'.repeat(Math.max(0, dni.length - 3)) + dni.slice(-3);
}

export function ProfileHeader({ user, avatarUrl, onAvatarChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarChange(file);
    // Reset input so same file can trigger again
    e.target.value = '';
  };

  const initials = user.fullName
    ? user.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'P';

  return (
    <div className="bg-white border-b border-slatey-100">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          {/* Avatar with change button */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary-100">
              {avatarUrl ? (
                <SmartImage
                  src={avatarUrl}
                  alt={user.fullName || 'Paciente'}
                  ratio="1/1"
                  fallback="avatar"
                  gravity="face"
                  fit="cover"
                  priority
                  className="rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-display font-bold text-2xl">{initials}</span>
                </div>
              )}
            </div>
            {/* Camera button */}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center shadow-md hover:bg-primary-600 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            {/* Hidden file input — accepts images for circular crop */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-hidden="true"
              onChange={handleFileChange}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2
              className="font-display font-bold text-slatey-900 leading-tight"
              style={{ fontSize: 'clamp(1rem, 5vw, 1.25rem)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {user.fullName || 'Paciente'}
            </h2>

            {/* DNI masked */}
            <div className="flex items-center gap-1.5 mt-1">
              <Shield className="w-3.5 h-3.5 text-slatey-400 flex-shrink-0" />
              <span className="text-xs text-slatey-500 font-mono">
                DNI {maskDni(user.dni)}
              </span>
            </div>

            {/* Verified badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.phone && (
                <VerifiedBadge icon={<Phone className="w-3 h-3" />} label="Teléfono verificado" />
              )}
              {user.email && (
                <VerifiedBadge icon={<Mail className="w-3 h-3" />} label="Correo verificado" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifiedBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-50 border border-success-100 text-success-700 text-[10px] font-semibold">
      <CheckCircle2 className="w-2.5 h-2.5" />
      {icon}
      {label}
    </span>
  );
}

