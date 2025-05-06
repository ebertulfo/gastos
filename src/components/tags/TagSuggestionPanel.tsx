import React, { useState } from 'react';
import { PlusCircle, Tag, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TagAutocomplete from './TagAutocomplete';

interface TagSuggestionPanelProps {
  expenseId: string;
  tags?: { id: string; name: string; display: string }[];
  options?: string[];
  onSelect: (expenseId: string, tag: string) => Promise<void>;
  onRemove?: (expenseId: string, tagId: string) => Promise<void>;
}

export function TagSuggestionPanel({
  expenseId,
  tags = [],
  options = [],
  onSelect,
  onRemove,
}: TagSuggestionPanelProps) {
  const [customTag, setCustomTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out suggestions that are already added as tags
  const filteredOptions = options.filter(
    (option) => !tags.some((tag) => tag.name.toLowerCase() === option.toLowerCase())
  );

  const handleSelectTag = async (tag: string) => {
    try {
      setIsLoading(true);
      await onSelect(expenseId, tag);
    } catch (error) {
      console.error('Error adding tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!onRemove) return;
    
    try {
      setIsLoading(true);
      await onRemove(expenseId, tagId);
    } catch (error) {
      console.error('Error removing tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomTag = async () => {
    if (!customTag.trim()) return;
    
    try {
      setIsLoading(true);
      await onSelect(expenseId, customTag.trim());
      setCustomTag('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding custom tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Existing tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="secondary"
              className="flex items-center gap-1 py-1"
            >
              <Tag className="h-3 w-3" />
              {tag.display}
              {onRemove && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag.id);
                  }}
                  className="ml-1 hover:text-destructive"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Tag suggestions */}
      {filteredOptions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Suggested tags:</p>
          <div className="flex flex-wrap gap-2">
            {filteredOptions.map((option) => (
              <Badge 
                key={option} 
                variant="outline" 
                className="cursor-pointer px-2 py-1 hover:bg-secondary"
                onClick={() => handleSelectTag(option)}
              >
                <PlusCircle className="h-3 w-3 mr-1" /> 
                {option}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Custom tag input */}
      <div>
        {isAdding ? (
          <div className="flex gap-2 mt-2">
            <TagAutocomplete
              value={customTag}
              onChange={setCustomTag}
              onSelect={handleAddCustomTag} // Only called when user hits Enter, not when selecting from dropdown
              placeholder="Enter tag..."
              className="h-8 text-sm"
              autoFocus={true}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddCustomTag}
              disabled={!customTag.trim() || isLoading}
            >
              Add
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setIsAdding(false);
                setCustomTag('');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => setIsAdding(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add custom tag
          </Button>
        )}
      </div>
    </div>
  );
}

export default TagSuggestionPanel;