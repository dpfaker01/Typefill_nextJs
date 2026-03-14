'use client';

import { useState, useEffect } from 'react';
import { Search, Lock, Unlock, Copy, Check, FolderOpen, Plus, Trash2 } from 'lucide-react';

interface Variable {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'slider';
  options?: string[]; // for dropdown
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load from 'typefill_backup' or LocalStorage
  useEffect(() => {
    const fetchBackup = async () => {
      try {
        // Attempt to load user's backup file logic
        const res = await fetch('/typefill_backup.json'); 
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
          return;
        }
      } catch (e) {
        // Fallback to localStorage if no backup file found
        const saved = localStorage.getItem('typefill-pro-data');
        if (saved) setTemplates(JSON.parse(saved));
      }
    };
    fetchBackup();
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('typefill-pro-data', JSON.stringify(templates));
  }, [templates]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const updateVariable = (varId: string, newValue: string) => {
    if (!activeTemplate) return;
    const updatedVars = activeTemplate.variables.map(v => 
      v.id === varId ? { ...v, value: newValue } : v
    );
    setActiveTemplate({ ...activeTemplate, variables: updatedVars });
  };

  const togglePrivacy = (varId: string) => {
    if (!activeTemplate) return;
    const updatedVars = activeTemplate.variables.map(v => 
      v.id === varId ? { ...v, isPrivate: !v.isPrivate } : v
    );
    setActiveTemplate({ ...activeTemplate, variables: updatedVars });
  };

  const generateOutput = () => {
    if (!activeTemplate) return '';
    let output = activeTemplate.content;
    activeTemplate.variables.forEach(v => {
      const displayValue = v.isPrivate ? '••••••' : v.value;
      output = output.replace(new RegExp(`{{${v.name}}}`, 'g'), displayValue);
    });
    return output;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar / Search & Folder List */}
      <aside className="w-full md:w-80 bg-white border-r border-gray-200 p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-indigo-600">TypeFill Pro</h1>
          <button 
            onClick={() => {
              const newT: Template = {
                id: Date.now().toString(),
                name: 'New Template',
                folder: 'General',
                content: 'Hello {{name}}, your code is {{code}}.',
                variables: [
                  { id: '1', name: 'name', type: 'text', value: '', isPrivate: false },
                  { id: '2', name: 'code', type: 'text', value: '', isPrivate: true }
                ]
              };
              setTemplates([...templates, newT]);
              setActiveTemplate(newT);
            }}
            className="p-2 bg-indigo-100 rounded-full text-indigo-600 hover:bg-indigo-200"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {templates
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.folder.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(t => (
              <div
                key={t.id}
                onClick={() => setActiveTemplate(t)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${activeTemplate?.id === t.id ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-50 hover:bg-gray-100'} border`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{t.name}</span>
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FolderOpen size={12} /> {t.folder}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 bg-gray-50">
        {activeTemplate ? (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <input
                  type="text"
                  className="text-2xl font-bold border-none focus:outline-none bg-transparent"
                  value={activeTemplate.name}
                  onChange={(e) => setActiveTemplate({...activeTemplate, name: e.target.value})}
                />
                <button 
                  onClick={() => setTemplates(templates.filter(t => t.id !== activeTemplate.id))}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              
              {/* Variables List */}
              <div className="space-y-4">
                {activeTemplate.variables.map(v => (
                  <div key={v.id} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        {v.name} 
                        {v.isPrivate && <Lock size={12} className="text-red-400" />}
                      </label>
                      <button onClick={() => togglePrivacy(v.id)} className="text-xs text-gray-400 hover:text-indigo-600">
                        {v.isPrivate ? 'Reveal' : 'Hide'}
                      </button>
                    </div>

                    {v.type === 'text' && (
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-none"
                        value={v.value}
                        onChange={(e) => updateVariable(v.id, e.target.value)}
                        placeholder={`Enter ${v.name}...`}
                      />
                    )}

                    {v.type === 'dropdown' && (
                      <select
                        className="w-full border border-gray-200 rounded-lg p-2 bg-white outline-none"
                        value={v.value}
                        onChange={(e) => updateVariable(v.id, e.target.value)}
                      >
                        <option value="">Select...</option>
                        {v.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}

                    {v.type === 'slider' && (
                      <input
                        type="range"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={v.value}
                        onChange={(e) => updateVariable(v.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Output Preview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-700">Output Preview</h3>
                <button 
                  onClick={() => handleCopy(generateOutput(), 'output')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  {copiedId === 'output' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedId === 'output' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-gray-800 whitespace-pre-wrap min-h-[100px]">
                {generateOutput()}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FolderOpen size={48} strokeWidth={1} />
            <p className="mt-2">Select a template to begin</p>
          </div>
        )}
      </main>
    </div>
  );
}