// File: apps/web/src/components/ui/ConfirmationModal.tsx
import styles from './ConfirmationModal.module.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  variant = 'danger',
}: Props) => {
  if (!isOpen) return null;

  const iconMap = {
    danger:  { icon: 'bx bx-error-circle',  cls: styles.iconDanger  },
    warning: { icon: 'bx bx-info-circle',    cls: styles.iconWarning },
    primary: { icon: 'bx bx-help-circle',    cls: styles.iconPrimary },
  };

  const { icon, cls } = iconMap[variant];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        {/* Icono */}
        <div className={`${styles.iconWrapper} ${cls}`}>
          <i className={icon}></i>
        </div>

        {/* Contenido */}
        <div className={styles.content}>
          <h3 id="confirm-title" className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          <button
            onClick={onClose}
            className={styles.cancelBtn}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${styles.confirmBtn} ${styles[`confirm${variant.charAt(0).toUpperCase() + variant.slice(1)}`]}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <i className="bx bx-loader-alt bx-spin"></i>
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};