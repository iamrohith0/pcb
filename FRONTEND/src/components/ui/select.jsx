import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Context to pass select state to nested children
const SelectContext = createContext(null);

const Select = React.forwardRef(({ className, children, value, onValueChange, placeholder, disabled, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    setSelectedValue(val);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(val);
    }
  };

  // Find the display label from SelectItem children (recursively search)
  const findDisplayLabel = (children) => {
    let label = null;
    React.Children.forEach(children, (child) => {
      if (!child) return;
      if (child.type?.displayName === 'SelectItem' && child.props.value === selectedValue) {
        label = child.props.children;
      } else if (child.type?.displayName === 'SelectContent' && child.props.children) {
        const found = findDisplayLabel(child.props.children);
        if (found) label = found;
      }
    });
    return label;
  };

  const displayLabel = findDisplayLabel(children) || placeholder || 'Select...';

  // Find trigger className from SelectTrigger child
  let triggerClassName = '';
  React.Children.forEach(children, (child) => {
    if (child?.type?.displayName === 'SelectTrigger' && child.props.className) {
      triggerClassName = child.props.className;
    }
  });

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, handleSelect, disabled }}>
      <div ref={selectRef} className="relative" {...props}>
        <button
          ref={triggerRef}
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50',
            triggerClassName,
            className
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className={cn("truncate", selectedValue ? "text-gray-900" : "text-gray-500")}>
            {displayLabel}
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && !disabled && (
          <div
            className="absolute top-full left-0 right-0 z-[9999] mt-1 rounded-md border border-gray-200 bg-white shadow-lg"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="py-1 max-h-60 overflow-auto">
              {React.Children.map(children, (child) => {
                // Only render SelectContent's children in the dropdown
                if (child?.type?.displayName === 'SelectContent') {
                  return child.props.children;
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    </SelectContext.Provider>
  );
});
Select.displayName = 'Select';

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  // SelectTrigger is now just a marker component for styling - actual trigger is rendered by Select
  return null;
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef(({ placeholder, ...props }, ref) => {
  // SelectValue is now just a marker component - actual value is rendered by Select
  return null;
});
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  // SelectContent is a marker component - its children are rendered by Select in the dropdown
  return null;
});
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef(({ className, children, value, disabled, ...props }, ref) => {
  const context = useContext(SelectContext);

  if (!context) {
    console.warn('SelectItem must be used within a Select component');
    return null;
  }

  const { selectedValue, handleSelect } = context;
  const isSelected = value === selectedValue;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      handleSelect(value);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isSelected}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center px-3 py-2 text-sm outline-none",
        "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
        "focus:bg-gray-100 focus:text-gray-900",
        isSelected && "bg-blue-50 text-blue-700 font-medium",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      disabled={disabled}
      {...props}
    >
      <span className="flex-1 text-left truncate">{children}</span>
      {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
    </button>
  );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };