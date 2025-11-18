// src/components/TagManager.tsx

'use client';

import React, { useState } from 'react';
import { Package, Plus, X, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { tagManagementService, TagCategory } from '@/services/tagManagementService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TagManagerProps {
  tags: string[];
  onTagClick: (tag: string) => void;
  category: TagCategory;
  onTagsUpdate: (tags: string[]) => void;
  disabled?: boolean;
  label?: string;
  colorScheme?: 'blue' | 'amber' | 'teal' | 'purple' | 'green';
}

export function TagManager({
  tags,
  onTagClick,
  category,
  onTagsUpdate,
  disabled = false,
  label = 'Quick Tags - Click to add',
  colorScheme = 'blue'
}: TagManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // Color scheme mappings
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100',
      icon: 'text-blue-600',
      tagBg: 'bg-blue-100',
      tagText: 'text-blue-800',
      tagHoverBg: 'hover:bg-blue-200',
      tagHoverText: 'hover:text-blue-900',
      tagBorder: 'border-blue-200',
      tagHoverBorder: 'hover:border-blue-300',
    },
    amber: {
      bg: 'bg-amber-100',
      icon: 'text-amber-600',
      tagBg: 'bg-amber-100',
      tagText: 'text-amber-800',
      tagHoverBg: 'hover:bg-amber-200',
      tagHoverText: 'hover:text-amber-900',
      tagBorder: 'border-amber-200',
      tagHoverBorder: 'hover:border-amber-300',
    },
    teal: {
      bg: 'bg-teal-100',
      icon: 'text-teal-600',
      tagBg: 'bg-teal-100',
      tagText: 'text-teal-800',
      tagHoverBg: 'hover:bg-teal-200',
      tagHoverText: 'hover:text-teal-900',
      tagBorder: 'border-teal-200',
      tagHoverBorder: 'hover:border-teal-300',
    },
    purple: {
      bg: 'bg-purple-100',
      icon: 'text-purple-600',
      tagBg: 'bg-purple-100',
      tagText: 'text-purple-800',
      tagHoverBg: 'hover:bg-purple-200',
      tagHoverText: 'hover:text-purple-900',
      tagBorder: 'border-purple-200',
      tagHoverBorder: 'hover:border-purple-300',
    },
    green: {
      bg: 'bg-green-100',
      icon: 'text-green-600',
      tagBg: 'bg-green-100',
      tagText: 'text-green-800',
      tagHoverBg: 'hover:bg-green-200',
      tagHoverText: 'hover:text-green-900',
      tagBorder: 'border-green-200',
      tagHoverBorder: 'hover:border-green-300',
    },
  };

  const colors = colorClasses[colorScheme];

  const handleAddNewTag = async () => {
    if (!newTagText.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setIsAdding(true);
    try {
      await tagManagementService.addTag(category, newTagText.trim());
      const updatedTags = await tagManagementService.getTagsByCategory(category);
      onTagsUpdate(updatedTags);
      toast.success(`Tag "${newTagText.trim()}" added successfully`);
      setNewTagText('');
      setShowAddDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add tag');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await tagManagementService.removeTag(category, tagToDelete);
      const updatedTags = await tagManagementService.getTagsByCategory(category);
      onTagsUpdate(updatedTags);
      toast.success(`Tag "${tagToDelete}" deleted successfully`);
      setTagToDelete(null);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tag');
    }
  };

  const initiateDeleteTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTagToDelete(tag);
    setShowDeleteConfirm(true);
  };

  return (
    <>
      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={`p-1 ${colors.bg} rounded`}>
              <Package className={`h-3 w-3 ${colors.icon}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
          
          {!disabled && (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                onClick={() => setShowAddDialog(true)}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs hover:bg-gray-100"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              <Button
                type="button"
                onClick={() => setShowManageDialog(true)}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs hover:bg-gray-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onTagClick(tag)}
              disabled={disabled}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${colors.tagBg} ${colors.tagText} ${colors.tagHoverBg} ${colors.tagHoverText} transition-colors duration-200 border ${colors.tagBorder} ${colors.tagHoverBorder} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Tag</DialogTitle>
            <DialogDescription>
              Create a new tag for quick access in future prescriptions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                placeholder="Enter tag name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewTag();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  setNewTagText('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddNewTag}
                disabled={isAdding || !newTagText.trim()}
              >
                {isAdding ? (
                  <>
                    <Plus className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Tags Dialog */}
      <Dialog open={showManageDialog} onOpenChange={setShowManageDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <span>Manage Tags</span>
            </DialogTitle>
            <DialogDescription>
              View and delete tags. Click the delete button next to a tag to remove it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {tags.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No tags available</p>
                <p className="text-xs mt-1">Click &quot;Add&quot; to create your first tag</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {tags.map((tag, index) => (
                    <div
                      key={tag}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500 w-8">
                          {index + 1}.
                        </span>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${colors.tagBg} ${colors.tagText} border ${colors.tagBorder}`}>
                          {tag}
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => initiateDeleteTag(tag, { stopPropagation: () => {} } as React.MouseEvent)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                Total: <span className="font-semibold">{tags.length}</span> tag{tags.length !== 1 ? 's' : ''}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowManageDialog(false)}
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowManageDialog(false);
                    setShowAddDialog(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Tag
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              <span>Delete Tag?</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tag <strong>&quot;{tagToDelete}&quot;</strong>? 
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setTagToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteTag}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}



