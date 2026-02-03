import { useState, useEffect } from 'react';
import { ContentType } from '@/types';
import type { ContentItem, SiteSettings } from '@/types';

interface CMSProps {
  items: ContentItem[];
  settings: SiteSettings;
  isGitHubConfigured: boolean;
  onSaveItem: (item: ContentItem) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<boolean>;
  onSaveSettings: (settings: SiteSettings) => Promise<boolean>;
  onLogout: () => void;
}

export default function CMS({ 
  items, 
  settings, 
  isGitHubConfigured,
  onSaveItem, 
  onDeleteItem, 
  onSaveSettings,
  onLogout 
}: CMSProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ContentItem>>({
    type: ContentType.STORY,
    title: '',
    body: '',
    excerpt: '',
    date: ''
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);

  // Reset form when editing item changes
  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else if (isCreating) {
      setFormData({
        type: ContentType.STORY,
        title: '',
        body: '',
        excerpt: '',
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
  }, [editingItem, isCreating]);

  // Update settings form when settings prop changes
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const handleSaveItem = async () => {
    if (!formData.body) return;
    
    setSaveStatus('saving');
    setErrorMessage(null);
    
    const newItem: ContentItem = {
      id: editingItem?.id || Date.now().toString(),
      type: formData.type || ContentType.STORY,
      title: formData.title,
      body: formData.body,
      excerpt: formData.excerpt,
      date: formData.date
    };

    const success = await onSaveItem(newItem);
    
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        setEditingItem(null);
        setIsCreating(false);
      }, 1000);
    } else {
      setSaveStatus('error');
      setErrorMessage(isGitHubConfigured 
        ? 'Failed to save to GitHub. Check your token permissions.' 
        : 'Saved locally. Configure GitHub to persist changes.'
      );
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    setErrorMessage(null);
    
    const success = await onSaveSettings(settingsForm);
    
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1000);
    } else {
      setSaveStatus('error');
      setErrorMessage(isGitHubConfigured 
        ? 'Failed to save settings to GitHub.' 
        : 'Settings saved locally.'
      );
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    const success = await onDeleteItem(id);
    setShowDeleteConfirm(null);
    
    if (!success) {
      setErrorMessage('Failed to delete item. Please try again.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setIsCreating(false);
    setActiveTab('content');
    setErrorMessage(null);
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsCreating(true);
    setActiveTab('content');
    setErrorMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setIsCreating(false);
    setErrorMessage(null);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case ContentType.STORY: return 'bg-blue-100 text-blue-700';
      case ContentType.POEM: return 'bg-purple-100 text-purple-700';
      case ContentType.QUOTE: return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Editor View
  if (editingItem || isCreating) {
    return (
      <div className="min-h-screen bg-paper pt-32 pb-32 px-6 md:px-24 max-w-5xl mx-auto animate-fade-in">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <span className="font-sans text-xs tracking-widest text-muted uppercase">
              {isCreating ? 'Create New' : 'Edit Content'}
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-dark tracking-tight mt-2">
              {isCreating ? 'New Piece' : (formData.title || 'Untitled')}
            </h1>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleCancelEdit}
              className="font-sans text-xs font-bold uppercase tracking-widest border border-gray-300 px-6 py-3 hover:border-black transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveItem}
              disabled={saveStatus === 'saving'}
              className={`font-sans text-xs font-bold uppercase tracking-widest px-8 py-3 transition-all ${
                saveStatus === 'saved' 
                  ? 'bg-green-600 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {errorMessage}
          </div>
        )}

        {!isGitHubConfigured && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm">
            <strong>Local Mode:</strong> Changes are saved locally only. 
            Configure GitHub environment variables to persist changes to the repository.
          </div>
        )}

        <div className="space-y-8">
          {/* Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
                Content Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof ContentType[keyof typeof ContentType] })}
                className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif text-lg"
              >
                <option value={ContentType.STORY}>Story</option>
                <option value={ContentType.POEM}>Poetry</option>
                <option value={ContentType.QUOTE}>Quote</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
                Date
              </label>
              <input
                type="text"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                placeholder="Oct 24, 2024"
                className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif text-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
                Content ID
              </label>
              <div className="p-4 bg-gray-50 border border-gray-100 text-muted font-mono text-sm">
                {editingItem?.id || 'Auto-generated'}
              </div>
            </div>
          </div>

          {/* Title (hidden for quotes) */}
          {formData.type !== ContentType.QUOTE && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title..."
                className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif text-2xl"
              />
            </div>
          )}

          {/* Excerpt */}
          {formData.type !== ContentType.QUOTE && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
                Excerpt / Preview
              </label>
              <textarea
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short preview text..."
                rows={3}
                className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif resize-none"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
              Body Content
            </label>
            <textarea
              value={formData.body || ''}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder={formData.type === ContentType.QUOTE ? 'Enter quote...' : 'Enter content...'}
              rows={16}
              className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif leading-relaxed resize-none"
            />
            <p className="text-[10px] text-muted mt-2">
              Use line breaks for new paragraphs. For poetry, use line breaks for each line.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="min-h-screen bg-paper pt-32 pb-32 px-6 md:px-24 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <header className="mb-12 border-b border-black pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="font-sans text-xs tracking-widest text-muted uppercase">Dashboard</span>
          <h1 className="font-serif text-5xl md:text-6xl text-dark tracking-tight">Content Management</h1>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleCreateNew}
            className="font-sans text-xs font-bold uppercase tracking-widest bg-black text-white px-6 py-3 hover:bg-gray-800 transition-all"
          >
            + New Post
          </button>
          <button 
            onClick={onLogout}
            className="font-sans text-xs font-bold uppercase tracking-widest text-red-500 border border-red-500 px-6 py-3 hover:bg-red-500 hover:text-white transition-all"
          >
            Logout
          </button>
        </div>
      </header>

      {/* GitHub Status */}
      <div className={`mb-8 p-4 border ${isGitHubConfigured ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isGitHubConfigured ? 'bg-green-500' : 'bg-amber-500'}`}></div>
          <span className="text-sm font-medium">
            {isGitHubConfigured 
              ? 'GitHub Integration: Active - Changes will be saved to repository' 
              : 'Local Mode - Configure GitHub environment variables to enable cloud sync'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'content' 
              ? 'bg-black text-white' 
              : 'text-muted hover:text-dark'
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-sans text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'settings' 
              ? 'bg-black text-white' 
              : 'text-muted hover:text-dark'
          }`}
        >
          Site Settings
        </button>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="font-serif text-4xl mb-2">
                {items.filter(i => i.type === ContentType.STORY).length}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">Stories</div>
            </div>
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="font-serif text-4xl mb-2">
                {items.filter(i => i.type === ContentType.POEM).length}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">Poems</div>
            </div>
            <div className="bg-white border border-gray-200 p-6 text-center">
              <div className="font-serif text-4xl mb-2">
                {items.filter(i => i.type === ContentType.QUOTE).length}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-muted">Quotes</div>
            </div>
          </div>

          {/* Content List */}
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted mb-6">
            All Content ({items.length} items)
          </h3>
          
          {items.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-gray-200 font-serif italic text-muted">
              The archive is empty. Create your first post.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div 
                  key={item.id} 
                  className="group flex items-center justify-between p-5 border border-gray-200 hover:border-black transition-all bg-white"
                >
                  <div className="flex items-center space-x-6 flex-1">
                    <span className="font-sans text-xs text-muted w-8">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-1 ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-lg leading-none mb-1 truncate">
                        {item.title || (item.body.substring(0, 40) + '...')}
                      </h4>
                      <p className="text-[10px] text-muted uppercase tracking-widest">
                        {item.date || 'No Date'} • ID: {item.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="text-[10px] uppercase font-bold tracking-widest hover:text-accent px-3 py-2"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setShowDeleteConfirm(item.id)}
                      className="text-[10px] uppercase font-bold tracking-widest text-red-400 hover:text-red-600 px-3 py-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
              Site Title
            </label>
            <input
              type="text"
              value={settingsForm.siteTitle}
              onChange={(e) => setSettingsForm({ ...settingsForm, siteTitle: e.target.value })}
              className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif text-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
              Site Description
            </label>
            <textarea
              value={settingsForm.siteDescription}
              onChange={(e) => setSettingsForm({ ...settingsForm, siteDescription: e.target.value })}
              rows={2}
              className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
              Author Name
            </label>
            <input
              type="text"
              value={settingsForm.authorName}
              onChange={(e) => setSettingsForm({ ...settingsForm, authorName: e.target.value })}
              className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif text-xl"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
              Author Bio
            </label>
            <textarea
              value={settingsForm.authorBio}
              onChange={(e) => setSettingsForm({ ...settingsForm, authorBio: e.target.value })}
              rows={3}
              className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-2">
              Author Roles (comma separated)
            </label>
            <input
              type="text"
              value={settingsForm.authorRoles.join(', ')}
              onChange={(e) => setSettingsForm({ 
                ...settingsForm, 
                authorRoles: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
              })}
              placeholder="Author, Curator, Dreamer"
              className="w-full bg-white border border-gray-200 p-4 outline-none focus:border-black font-serif"
            />
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSaveSettings}
              disabled={saveStatus === 'saving'}
              className={`font-sans text-xs font-bold uppercase tracking-widest px-8 py-3 transition-all ${
                saveStatus === 'saved' 
                  ? 'bg-green-600 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4">
            <h3 className="font-serif text-2xl mb-4">Delete Content?</h3>
            <p className="text-muted mb-6">
              This action cannot be undone. The content will be permanently removed.
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 font-sans text-xs font-bold uppercase tracking-widest border border-gray-300 px-6 py-3 hover:border-black transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 font-sans text-xs font-bold uppercase tracking-widest bg-red-500 text-white px-6 py-3 hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
