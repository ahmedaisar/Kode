'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizablePaneProps {
  children: [ReactNode, ReactNode];
  direction?: 'horizontal' | 'vertical';
  initialSize?: number; // Percentage (0-100)
  minSize?: number; // Percentage
  maxSize?: number; // Percentage
}

export default function ResizablePane({
  children,
  direction = 'horizontal',
  initialSize = 50,
  minSize = 20,
  maxSize = 80,
}: ResizablePaneProps) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newSize: number;

      if (direction === 'horizontal') {
        const x = e.clientX - rect.left;
        newSize = (x / rect.width) * 100;
      } else {
        const y = e.clientY - rect.top;
        newSize = (y / rect.height) * 100;
      }

      // Clamp to min/max
      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minSize, maxSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div
      ref={containerRef}
      className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} h-full w-full`}
    >
      {/* First pane */}
      <div
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${size}%`,
        }}
        className="overflow-hidden"
      >
        {children[0]}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`${
          direction === 'horizontal'
            ? 'w-1 cursor-col-resize hover:w-1.5'
            : 'h-1 cursor-row-resize hover:h-1.5'
        } bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-emerald-600 transition-all ${
          isDragging ? 'bg-blue-500 dark:bg-emerald-600' : ''
        } flex-shrink-0 z-10`}
      />

      {/* Second pane */}
      <div
        style={{
          [direction === 'horizontal' ? 'width' : 'height']: `${100 - size}%`,
        }}
        className="overflow-hidden"
      >
        {children[1]}
      </div>
    </div>
  );
}
