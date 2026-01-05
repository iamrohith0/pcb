import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = React.forwardRef(({ className, children, value, onValueChange, placeholder, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef(null);

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

  const handleSelect = (value) => {
    setSelectedValue(value);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(value);
    }
  };

  const displayValue = React.Children.toArray(children).find(
    child => child.props.value === selectedValue
  )?.props.children || placeholder || 'Select...';

  return (
    <div ref={selectRef} className="relative" {...props}>
      <button
        type="button"
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={props.disabled}
      >
        <span className="text-gray-700">{displayValue}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-gray-300 bg-white shadow-lg">
          <div className="py-1 max-h-60 overflow-auto">
            {React.Children.map(children, (child) => {
              if (!child) return null;
              return React.cloneElement(child, {
                onSelect: handleSelect,
                isSelected: child.props.value === selectedValue
              });
            })}
          </div>
        </div>
      )}
    </div>
  );
});
Select.displayName = 'Select';

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef(({ placeholder, ...props }, ref) => {
  return <span ref={ref} {...props}>{placeholder || 'Select...'}</span>;
});
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-gray-300 bg-white shadow-lg",
        className
      )}
      {...props}
    >
      <div className="py-1 max-h-60 overflow-auto">
        {children}
      </div>
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef(({ className, children, value, onSelect, isSelected, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex w-full items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100",
        isSelected && "bg-gray-100",
        className
      )}
      onClick={() => onSelect(value)}
      {...props}
    >
      <span className="flex-1 text-left">{children}</span>
      {isSelected && <Check className="h-4 w-4 text-gray-500" />}
    </button>
  );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };