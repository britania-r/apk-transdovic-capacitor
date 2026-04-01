// File: apps/web/src/components/ui/Pagination.tsx
import styles from './Pagination.module.css';

interface Props {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  /** Ref del contenedor al que hacer scroll al cambiar de página */
  scrollRef?: React.RefObject<HTMLElement>;
}

export const Pagination = ({
  currentPage,
  totalItems,
  itemsPerPage = 50,
  onPageChange,
  scrollRef,
}: Props) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    onPageChange(page);
    if (scrollRef?.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generar rango de páginas visibles
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push('...');

    pages.push(totalPages);

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={styles.pagination}>
      <span className={styles.info}>
        {startItem}–{endItem} de {totalItems}
      </span>

      <div className={styles.controls}>
        <button
          className={styles.navBtn}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Anterior"
        >
          <i className="bx bx-chevron-left"></i>
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className={styles.dots}>…</span>
          ) : (
            <button
              key={page}
              className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
              onClick={() => handlePageChange(page as number)}
            >
              {page}
            </button>
          )
        )}

        <button
          className={styles.navBtn}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Siguiente"
        >
          <i className="bx bx-chevron-right"></i>
        </button>
      </div>
    </div>
  );
};