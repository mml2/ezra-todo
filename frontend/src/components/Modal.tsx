import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current?.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-8 animate-fade-in"
      style={{ background: 'rgba(28, 27, 24, 0.6)', backdropFilter: 'blur(3px)' }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 sm:p-12 animate-scale-in"
        style={{
          background: 'white',
          borderRadius: 'var(--radius)',
          boxShadow: '0 30px 70px -15px rgba(28, 27, 24, 0.45)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
