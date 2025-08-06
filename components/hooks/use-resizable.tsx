import { useCallback, useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseResizableOptions {
  initialSize?: Size;
  initialPosition?: Position;
  minSize?: Size;
  maxSize?: Size;
  disabled?: boolean;
}

export function useResizable(options: UseResizableOptions = {}) {
  const {
    initialSize = { width: 400, height: 600 },
    initialPosition = { x: 0, y: 0 },
    minSize = { width: 300, height: 400 },
    maxSize = { width: 800, height: 800 },
    disabled = false
  } = options;

  const [size, setSize] = useState<Size>(initialSize);
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const startPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startSize = useRef<Size>({ width: 0, height: 0 });
  const startPosition = useRef<Position>({ x: 0, y: 0 });

  const constrainSizeAndPosition = useCallback((newSize: Size, newPosition: Position): { size: Size; position: Position } => {
    let { width, height } = newSize;
    let { x, y } = newPosition;

    // Apply min constraints
    width = Math.max(minSize.width, width);
    height = Math.max(minSize.height, height);

    // Apply max constraints
    width = Math.min(maxSize.width, width);
    height = Math.min(maxSize.height, height);

    return { size: { width, height }, position: { x, y } };
  }, [minSize, maxSize]);

  const createResizeHandler = useCallback((direction: ResizeDirection) => {
    return (e: React.MouseEvent) => {
      if (disabled) return;
      
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeDirection(direction);
      
      startPos.current = { x: e.clientX, y: e.clientY };
      startSize.current = size;
      startPosition.current = position;
    };
  }, [disabled, size, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeDirection) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;

    let newWidth = startSize.current.width;
    let newHeight = startSize.current.height;
    let newX = startPosition.current.x;
    let newY = startPosition.current.y;

    // Handle horizontal resizing
    if (resizeDirection.includes('e')) {
      newWidth = startSize.current.width + deltaX;
    } else if (resizeDirection.includes('w')) {
      newWidth = startSize.current.width - deltaX;
      newX = startPosition.current.x + deltaX;
    }

    // Handle vertical resizing
    if (resizeDirection.includes('s')) {
      newHeight = startSize.current.height + deltaY;
    } else if (resizeDirection.includes('n')) {
      newHeight = startSize.current.height - deltaY;
      newY = startPosition.current.y + deltaY;
    }

    const constrained = constrainSizeAndPosition(
      { width: newWidth, height: newHeight },
      { x: newX, y: newY }
    );

    setSize(constrained.size);
    setPosition(constrained.position);
  }, [isResizing, resizeDirection, constrainSizeAndPosition]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  const createTouchResizeHandler = useCallback((direction: ResizeDirection) => {
    return (e: React.TouchEvent) => {
      if (disabled) return;
      
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      setIsResizing(true);
      setResizeDirection(direction);
      
      startPos.current = { x: touch.clientX, y: touch.clientY };
      startSize.current = size;
      startPosition.current = position;
    };
  }, [disabled, size, position]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing || !resizeDirection) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;

    let newWidth = startSize.current.width;
    let newHeight = startSize.current.height;
    let newX = startPosition.current.x;
    let newY = startPosition.current.y;

    // Handle horizontal resizing
    if (resizeDirection.includes('e')) {
      newWidth = startSize.current.width + deltaX;
    } else if (resizeDirection.includes('w')) {
      newWidth = startSize.current.width - deltaX;
      newX = startPosition.current.x + deltaX;
    }

    // Handle vertical resizing
    if (resizeDirection.includes('s')) {
      newHeight = startSize.current.height + deltaY;
    } else if (resizeDirection.includes('n')) {
      newHeight = startSize.current.height - deltaY;
      newY = startPosition.current.y + deltaY;
    }

    const constrained = constrainSizeAndPosition(
      { width: newWidth, height: newHeight },
      { x: newX, y: newY }
    );

    setSize(constrained.size);
    setPosition(constrained.position);
  }, [isResizing, resizeDirection, constrainSizeAndPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const resetSize = useCallback(() => {
    setSize(initialSize);
    setPosition(initialPosition);
  }, [initialSize, initialPosition]);

  const getResizeHandlers = useCallback((direction: ResizeDirection) => ({
    onMouseDown: createResizeHandler(direction),
    onTouchStart: createTouchResizeHandler(direction),
  }), [createResizeHandler, createTouchResizeHandler]);

  return {
    size,
    position,
    isResizing,
    resizeDirection,
    resizeRef,
    getResizeHandlers,
    resetSize,
    setSize,
    setPosition,
  };
}
