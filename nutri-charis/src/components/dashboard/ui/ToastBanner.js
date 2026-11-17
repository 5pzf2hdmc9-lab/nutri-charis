import { usePlatform } from '../platformContext';

export default function ToastBanner() {
  const { toastMsg } = usePlatform();
  return (
toastMsg && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #065f46, #0f766e)',
            color: '#ecfdf5',
            padding: '9px 18px',
            borderRadius: '99px',
            fontSize: '12px',
            fontWeight: '800',
            boxShadow: '0 14px 32px rgba(0,0,0,0.55)',
            border: '1px solid rgba(110, 231, 183, 0.45)',
            zIndex: 500,
            whiteSpace: 'nowrap',
            animation: 'fadeInSlide 0.2s ease'
          }}
        >
          {toastMsg}
        </div>
      )
  );
}
