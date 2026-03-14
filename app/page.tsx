'use client';

import { useState, useEffect } from 'react';
import { Search, FolderOpen, Plus } from 'lucide-react';
import TemplateEditor from './components/TemplateEditor';

// Define Types (can also be moved to a types.ts file)
interface Variable {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'slider';
  options?: string[];
  value: string;
  isPrivate: boolean;
}

interface Template {
  id: string;
  name: string;
  folder: string;
  content: string;
  variables: Variable[];
}

export default function TypeFillPro() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data from Storage or Backup
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to load the backup file if it exists in public/ folder
        const res = await fetch('/typefill_backup.json');
        if (res.ok) {
          const data = await res.json();
          if (data.templates) {
            setTemplates(data.templates);
            return;
          }
        }
      } catch (e) {
        console.log('No backup file found, loading from localStorage');
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem('typefill-pro-data');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    };
    fetchData();
  }, []);

  // Save to localStorage whenever templates change
  useEffect(() => {
    if(templates.length > 0) {
      localStorage.setItem('typefill-pro-data', JSON.stringify(templates));
    }
  }, [templates]);

  // Update logic passed to the Editor
  const handleUpdateTemplate = (updated: Template) => {
    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
    setActiveTemplate(updated); // Keep active state in sync
  };

  // Delete logic passed to the Editor
  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setActiveTemplate(null);
  };

  // Create a new template
  const createNewTemplate = () => {
    const newT: Template = {
      id: Date.now().toString(),
      name: 'Untitled Template',
      folder: 'General',
      content: 'Hello {{name}}, thank you for contacting us regarding {{topic}}.',
      variables: [
        { id: '1', name: 'name', type: 'text', value: '', isPrivate: false },
        { id: '2', name: 'topic', type: 'text', value: '', isPrivate: false }
      ]
    };
    setTemplates(prev => [...prev, newT]);
    setActiveTemplate(newT);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-indigo-600">TypeFill Pro</h1>
          <button
            onClick={createNewTemplate}
            className="p-2 bg-indigo-100 rounded-full text-indigo-600 hover:bg-indigo-200 transition-colors"
            aria-label="Create new template"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {templates
            .filter(t => 
              t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              t.folder.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(t => (
              <div
                key={t.id}
                onClick={() => setActiveTemplate(t)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  activeTemplate?.id === t.id 
                    ? 'bg-indigo-50 border-indigo-300 border' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 truncate">{t.name}</span>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1 text-gray-600">
                    <FolderOpen size={10} /> {t.folder}
                  </span>
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">
                No templates found. Click + to create one.
              </div>
            )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        {activeTemplate ? (
          <TemplateEditor 
            template={activeTemplate}
            onUpdate={handleUpdateTemplate}
            onDelete={handleDeleteTemplate}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FolderOpen size={64} strokeWidth={1} />
            <p className="mt-4 text-lg">Select a template to begin</p>
            <p className="text-sm mt-1">or create a new one using the + button.</p>
          </div>
        )}
      </main>
    </div>
  );
}
