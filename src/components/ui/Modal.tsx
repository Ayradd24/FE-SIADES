import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open (lock both html & body)
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden animate-fade-in !m-0"
      onClick={onClose}
    >
      {/* Overlay background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Scroll container — this is the layer that scrolls when modal is very tall */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain">
        {/* Centering wrapper with min-height so short modals stay centered */}
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Dialog card */}
          <div
            className={`
              relative bg-white rounded-2xl shadow-2xl w-full ${maxWidthClasses[maxWidth]}
              max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden
              animate-slide-up
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — fixed at top of modal */}
            <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#1e3a5f]">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body — scrollable when content overflows */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
