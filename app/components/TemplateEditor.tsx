'use client';

import { useState } from 'react';
import { Lock, Unlock, Copy, Check, Trash2 } from 'lucide-react';

// Define the shape of a Variable
interface Variable {
  id: string;
  name: string;
  type: 'text' | 'dropdown' | 'slider';
  options?: string[]; // used for dropdown
  value: string;
  isPrivate: boolean;
}

// Define the shape of a Template
interface Template {
  id: string;
  name: string;
  folder: string;
  content: string;
  variables: Variable[];
}

// Define the props this component expects
interface TemplateEditorProps {
  template: Template;
  onUpdate: (updatedTemplate: Template) => void;
  onDelete: (id: string) => void;
}

export default function TemplateEditor({ template, onUpdate, onDelete }: TemplateEditorProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Handle copying text to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Update a specific variable's value
  const updateVariable = (varId: string, newValue: string) => {
    const updatedVars = template.variables.map(v =>
      v.id === varId ? { ...v, value: newValue } : v
    );
    onUpdate({ ...template, variables: updatedVars });
  };

  // Toggle privacy mask for a variable
  const togglePrivacy = (varId: string) => {
    const updatedVars = template.variables.map(v =>
      v.id === varId ? { ...v, isPrivate: !v.isPrivate } : v
    );
    onUpdate({ ...template, variables: updatedVars });
  };

  // Generate the final text output
  const generateOutput = () => {
    let output = template.content;
    template.variables.forEach(v => {
      const displayValue = v.isPrivate ? '••••••' : v.value;
      // Replace placeholders like {{name}} with actual values
      output = output.replace(new RegExp(`{{${v.name}}}`, 'g'), displayValue);
    });
    return output;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Template Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            className="text-2xl font-bold border-none focus:outline-none bg-transparent w-full"
            value={template.name}
            onChange={(e) => onUpdate({ ...template, name: e.target.value })}
          />
          <button
            onClick={() => onDelete(template.id)}
            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
            aria-label="Delete template"
          >
            <Trash2 size={20} />
          </button>
        </div>

        {/* Variables List */}
        <div className="space-y-4">
          {template.variables.map(v => (
            <div key={v.id} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  {v.name}
                  {v.isPrivate && <Lock size={12} className="text-red-400" />}
                </label>
                <button
                  onClick={() => togglePrivacy(v.id)}
                  className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                >
                  {v.isPrivate ? <Unlock size={12} /> : <Lock size={12} />}
                  {v.isPrivate ? 'Unmask' : 'Mask'}
                </button>
              </div>

              {/* Input Types Logic */}
              {v.type === 'text' && (
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-200 outline-none transition-shadow"
                  value={v.value}
                  onChange={(e) => updateVariable(v.id, e.target.value)}
                  placeholder={`Enter ${v.name}...`}
                />
              )}

              {v.type === 'dropdown' && (
                <select
                  className="w-full border border-gray-200 rounded-lg p-2 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
                  value={v.value}
                  onChange={(e) => updateVariable(v.id, e.target.value)}
                >
                  <option value="">Select...</option>
                  {v.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              )}

              {v.type === 'slider' && (
                <div className="flex items-center gap-4">
                   <input
                    type="range"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    value={v.value}
                    onChange={(e) => updateVariable(v.id, e.target.value)}
                  />
                  <span className="text-sm text-gray-600 font-medium w-8 text-right">{v.value}</span>
                </div>
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            {copiedId === 'output' ? <Check size={16} /> : <Copy size={16} />}
            {copiedId === 'output' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-gray-800 whitespace-pre-wrap min-h-[100px] font-mono text-sm">
          {generateOutput()}
        </div>
      </div>
    </div>
  );
}
