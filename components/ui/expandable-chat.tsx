"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, MessageCircle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useDraggable } from "@/components/hooks/use-draggable";
import { useResizable } from "@/components/hooks/use-resizable";

export type ChatPosition = "bottom-right" | "bottom-left";
export type ChatSize = "sm" | "md" | "lg" | "xl" | "full";

const chatConfig = {
  dimensions: {
    sm: "sm:max-w-sm sm:max-h-[500px]",
    md: "sm:max-w-md sm:max-h-[600px]",
    lg: "sm:max-w-lg sm:max-h-[700px]",
    xl: "sm:max-w-xl sm:max-h-[800px]",
    full: "sm:w-full sm:h-full",
  },
  positions: {
    "bottom-right": "bottom-5 right-5",
    "bottom-left": "bottom-5 left-5",
  },
  chatPositions: {
    "bottom-right": "sm:bottom-[calc(100%+10px)] sm:right-0",
    "bottom-left": "sm:bottom-[calc(100%+10px)] sm:left-0",
  },
  states: {
    open: "pointer-events-auto opacity-100 visible scale-100 translate-y-0",
    closed:
      "pointer-events-none opacity-0 invisible scale-100 sm:translate-y-5",
  },
};

interface ExpandableChatProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: ChatPosition;
  size?: ChatSize;
  icon?: React.ReactNode;
}

const ExpandableChat: React.FC<ExpandableChatProps> = ({
  className,
  position = "bottom-right",
  size = "md",
  icon,
  children,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // State for hydration-safe positioning
  const [isClient, setIsClient] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  // Get initial position based on position prop
  const getInitialPosition = () => {
    if (position === "bottom-right") {
      return { x: windowSize.width - 80, y: windowSize.height - 80 };
    } else {
      return { x: 20, y: windowSize.height - 80 };
    }
  };

  // Initialize draggable for the toggle button
  const {
    position: dragPosition,
    isDragging,
    dragHandlers,
    setPosition: setDragPosition,
  } = useDraggable({
    initialPosition: { x: 0, y: 0 }, // Always start with 0,0 for hydration
    bounds: {
      left: 0,
      top: 0,
      right: windowSize.width - 60,
      bottom: windowSize.height - 60,
    },
  });

  // Initialize resizable for the chat window
  const {
    size: chatSize,
    position: chatPosition,
    isResizing,
    getResizeHandlers,
    setPosition: setChatPosition,
  } = useResizable({
    initialSize: { width: 400, height: 600 },
    initialPosition: { x: 0, y: 0 },
    minSize: { width: 300, height: 400 },
    maxSize: { width: 800, height: 800 },
  });

  // Track drag state for click vs drag detection
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const [hasDragged, setHasDragged] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  // Handle client-side hydration and window resize
  useEffect(() => {
    setIsClient(true);
    
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    // Set initial window size and position
    updateWindowSize();
    
    // Set initial position after hydration
    const initialPos = position === "bottom-right" 
      ? { x: window.innerWidth - 80, y: window.innerHeight - 80 }
      : { x: 20, y: window.innerHeight - 80 };
    
    setDragPosition(initialPos);
    
    // Listen for window resize
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, [position, setDragPosition]);

  // Update chat position when toggle button moves
  useEffect(() => {
    if (isClient) {
      setChatPosition({
        x: dragPosition.x - chatSize.width + 60,
        y: dragPosition.y - chatSize.height - 10,
      });
    }
  }, [dragPosition, chatSize, setChatPosition, isClient]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          className="fixed flex flex-col bg-background border rounded-lg shadow-lg overflow-hidden pointer-events-auto"
          style={{
            left: isClient ? chatPosition.x : 0,
            top: isClient ? chatPosition.y : 0,
            width: chatSize.width,
            height: chatSize.height,
            opacity: isClient ? 1 : 0,
            transition: isClient ? 'opacity 0.3s ease-in-out' : 'none',
          }}
        >
          {/* Drag Handle */}
          <div
            className="flex items-center justify-between p-2 bg-muted/50 border-b cursor-move select-none"
            {...dragHandlers}
          >
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Chat</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={toggleChat}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Chat Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
          
          {/* Resize Handles */}
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
            {...getResizeHandlers('nw')}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
            {...getResizeHandlers('ne')}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
            {...getResizeHandlers('sw')}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-muted/50 hover:bg-muted transition-colors"
            {...getResizeHandlers('se')}
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50" />
          </div>
          
          {/* Edge handles */}
          <div
            className="absolute top-0 left-3 right-3 h-2 cursor-n-resize"
            {...getResizeHandlers('n')}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize"
            {...getResizeHandlers('s')}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-2 cursor-w-resize"
            {...getResizeHandlers('w')}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-2 cursor-e-resize"
            {...getResizeHandlers('e')}
          />
        </div>
      )}
      
      {/* Toggle Button */}
      <div
        className="fixed pointer-events-auto"
        style={{
          left: isClient ? dragPosition.x : 0,
          top: isClient ? dragPosition.y : 0,
          opacity: isClient ? 1 : 0, // Hide until hydrated
          transition: isClient ? 'opacity 0.3s ease-in-out' : 'none',
        }}
      >
        <ExpandableChatToggle
          icon={icon}
          isOpen={isOpen}
          toggleChat={toggleChat}
          dragHandlers={dragHandlers}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
};

ExpandableChat.displayName = "ExpandableChat";

const ExpandableChatHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex items-center justify-between p-4 border-b", className)}
    {...props}
  />
);

ExpandableChatHeader.displayName = "ExpandableChatHeader";

const ExpandableChatBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("flex-grow overflow-y-auto", className)} {...props} />;

ExpandableChatBody.displayName = "ExpandableChatBody";

const ExpandableChatFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => <div className={cn("border-t p-4", className)} {...props} />;

ExpandableChatFooter.displayName = "ExpandableChatFooter";

interface ExpandableChatToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  isOpen: boolean;
  toggleChat: () => void;
  dragHandlers?: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  };
  isDragging?: boolean;
}

const ExpandableChatToggle: React.FC<ExpandableChatToggleProps> = ({
  className,
  icon,
  isOpen,
  toggleChat,
  dragHandlers,
  isDragging,
  ...props
}) => {
  const [mouseDownTime, setMouseDownTime] = useState<number>(0);
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownTime(Date.now());
    setMouseDownPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    if (dragHandlers?.onMouseDown) {
      dragHandlers.onMouseDown(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownTime > 0) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - mouseDownPos.x, 2) + Math.pow(e.clientY - mouseDownPos.y, 2)
      );
      if (distance > 5) {
        setHasMoved(true);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const clickDuration = Date.now() - mouseDownTime;
    // Only toggle if it was a quick click (< 200ms) and didn't move much
    if (clickDuration < 200 && !hasMoved && !isDragging) {
      e.preventDefault();
      e.stopPropagation();
      toggleChat();
    }
    setMouseDownTime(0);
    setHasMoved(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setMouseDownTime(Date.now());
    setMouseDownPos({ x: touch.clientX, y: touch.clientY });
    setHasMoved(false);
    if (dragHandlers?.onTouchStart) {
      dragHandlers.onTouchStart(e);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      className={cn(
        "w-14 h-14 rounded-full shadow-md flex items-center justify-center hover:shadow-lg hover:shadow-black/30 transition-all duration-300 cursor-move select-none",
        isDragging && "shadow-lg scale-105",
        className,
      )}
      {...props}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        icon || <MessageCircle className="h-6 w-6" />
      )}
    </Button>
  );
};

ExpandableChatToggle.displayName = "ExpandableChatToggle";

export {
  ExpandableChat,
  ExpandableChatHeader,
  ExpandableChatBody,
  ExpandableChatFooter,
};
