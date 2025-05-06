import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Tag as TagIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTags } from '@/hooks/useTags'; // Import our new hook

interface TagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value?: string) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TagAutocomplete({
  value,
  onChange,
  onSelect,
  className = '',
  placeholder = 'Add a tag...',
  autoFocus = false
}: TagAutocompleteProps) {
  const { user } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionBoxRef = useRef<HTMLDivElement>(null);
  
  // Use our custom hook instead of direct database calls
  const { suggestions, isLoading, debugInfo } = useTags(value, user?.uid);

  // Close suggestion box when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionBoxRef.current && 
        !suggestionBoxRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (e.target.value.trim()) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: { id: string; display: string }) => {
    onChange(suggestion.display); // Set the complete tag name from the suggestion
    setShowSuggestions(false);
    // Don't automatically call onSelect here to allow manual confirmation with Add button
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        // Select the highlighted suggestion
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        // Use the current input value
        onSelect();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prevIndex) => 
        prevIndex < suggestions.length - 1 ? prevIndex + 1 : prevIndex
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Show suggestions immediately when focusing if there's text
            if (value.trim()) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`flex-1 ${className}`}
          autoFocus={autoFocus}
        />
        {isLoading && (
          <div className="absolute right-14 flex items-center justify-center">
            <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          </div>
        )}
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-14 h-full px-2"
            onClick={() => onChange('')}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>

      {/* Show debug info in dev mode */}
      {process.env.NODE_ENV === 'development' && value && (
        <div className="mt-1 text-xs text-gray-500 border border-gray-200 p-1 rounded">
          <details>
            <summary>Debug Info</summary>
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </details>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionBoxRef} 
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
        >
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li 
                key={suggestion.id}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                  index === selectedIndex
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <TagIcon className="h-3.5 w-3.5 text-gray-500" />
                <span>{suggestion.display}</span>
                {index === selectedIndex && (
                  <Check className="h-4 w-4 ml-auto text-green-500" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TagAutocomplete;