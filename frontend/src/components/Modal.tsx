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
      style={{ background: 'rgba(28, 27, 24, 0.55)', backdropFilter: 'blur(3px)' }}
    >
      <div
        ref={panelRef}
        className="editorial-card accent-border w-full max-w-2xl max-h-[88vh] overflow-y-auto p-8 sm:p-10 animate-scale-in"
        style={{ boxShadow: '0 24px 60px -12px rgba(28, 27, 24, 0.35)' }}
      >
        {children}
      </div>
    </div>
  );
}
