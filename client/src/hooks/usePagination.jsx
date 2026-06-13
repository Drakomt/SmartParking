export function usePagination({ totalPages, currentPage, siblingCount = 1 }) {
  // פונקציית עזר ליצירת מערך של מספרים מוגדר מראש (למשל מ-1 עד 5)
  const range = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  // חישוב מספר האלמנטים המקסימלי שיוצגו בבת אחת:
  // אחים משמאל + אחים מימין + עמוד ראשון + עמוד אחרון + עמוד נוכחי + 2 מיקומים לשלוש נקודות
  const totalPageNumbers = siblingCount * 2 + 5;

  // מקרה 1: אם סך העמודים קטן מהמקום שיש לנו, נציג את כל העמודים ברצף ללא שלוש נקודות
  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages);
  }

  // חישוב המיקום של ה"אחים" (העמודים השכנים לעמוד הנוכחי)
  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  // בדיקה האם צריך להציג שלוש נקודות בצד שמאל, ימין או בשניהם
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  // מקרה 2: יש שלוש נקודות רק בצד ימין [1, 2, 3, 4, 5, ..., 20]
  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = range(1, 3 + siblingCount * 2);
    return [...leftRange, "ellipsis-right", totalPages];
  }

  // מקרה 3: יש שלוש נקודות רק בצד שמאל [1, ..., 16, 17, 18, 19, 20]
  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = range(totalPages - (3 + siblingCount * 2) + 1, totalPages);
    return [1, "ellipsis-left", ...rightRange];
  }

  // מקרה 4: יש שלוש נקודות בשני הצדדים [1, ..., 4, 5, 6, ..., 20]
  const middleRange = range(leftSibling, rightSibling);
  return [1, "ellipsis-left", ...middleRange, "ellipsis-right", totalPages];
}