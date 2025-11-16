/**
 * Drag and drop utilities
 */

export interface DragDropHandlers {
  onDragEnter?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

/**
 * Setup drag and drop for file uploads
 */
export function setupFileDragDrop(
  element: HTMLElement,
  onFilesDropped: (files: FileList) => void,
  options: {
    accept?: string[];
    multiple?: boolean;
    maxSize?: number;
  } = {}
): () => void {
  const { accept = [], multiple = true, maxSize } = options;

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.add('drag-over');
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    element.classList.remove('drag-over');

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    // Filter files by type
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file type
      if (accept.length > 0) {
        const fileType = file.type;
        const isValid = accept.some(type => {
          if (type.endsWith('/*')) {
            return fileType.startsWith(type.replace('/*', '/'));
          }
          return fileType === type;
        });

        if (!isValid) {
          continue;
        }
      }

      // Check file size
      if (maxSize && file.size > maxSize) {
        continue;
      }

      validFiles.push(file);

      if (!multiple) {
        break;
      }
    }

    if (validFiles.length > 0) {
      const dt = new DataTransfer();
      validFiles.forEach(file => dt.items.add(file));
      onFilesDropped(dt.files);
    }
  };

  element.addEventListener('dragover', handleDragOver as EventListener);
  element.addEventListener('dragleave', handleDragLeave as EventListener);
  element.addEventListener('drop', handleDrop as EventListener);

  return () => {
    element.removeEventListener('dragover', handleDragOver as EventListener);
    element.removeEventListener('dragleave', handleDragLeave as EventListener);
    element.removeEventListener('drop', handleDrop as EventListener);
  };
}

/**
 * Setup drag and drop for reordering items
 */
export function setupReorderDragDrop<T>(
  containerElement: HTMLElement,
  items: T[],
  onReorder: (newItems: T[]) => void,
  getItemId: (item: T) => string
): () => void {
  let draggedElement: HTMLElement | null = null;
  let draggedIndex: number = -1;

  const handleDragStart = (e: DragEvent) => {
    draggedElement = e.target as HTMLElement;
    const itemId = draggedElement.dataset.itemId;
    if (itemId) {
      draggedIndex = items.findIndex(item => getItemId(item) === itemId);
      draggedElement.classList.add('dragging');
      e.dataTransfer!.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';

    const target = (e.target as HTMLElement).closest('[draggable="true"]') as HTMLElement;
    if (!target || target === draggedElement) {
      return;
    }

    const targetItemId = target.dataset.itemId;
    if (!targetItemId) {
      return;
    }

    const targetIndex = items.findIndex(item => getItemId(item) === targetItemId);
    if (targetIndex === -1 || targetIndex === draggedIndex) {
      return;
    }

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    draggedIndex = targetIndex;
    onReorder(newItems);
  };

  const handleDragEnd = (e: DragEvent) => {
    e.preventDefault();
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
    }
    draggedElement = null;
    draggedIndex = -1;
  };

  containerElement.addEventListener('dragstart', handleDragStart as EventListener);
  containerElement.addEventListener('dragover', handleDragOver as EventListener);
  containerElement.addEventListener('dragend', handleDragEnd as EventListener);

  return () => {
    containerElement.removeEventListener('dragstart', handleDragStart as EventListener);
    containerElement.removeEventListener('dragover', handleDragOver as EventListener);
    containerElement.removeEventListener('dragend', handleDragEnd as EventListener);
  };
}

/**
 * CSS for drag and drop
 */
export const DRAG_DROP_STYLES = `
  .drag-over {
    border: 2px dashed #2196F3;
    background-color: rgba(33, 150, 243, 0.1);
  }

  .dragging {
    opacity: 0.5;
    cursor: move;
  }

  [draggable="true"] {
    cursor: move;
  }

  [draggable="true"]:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;
