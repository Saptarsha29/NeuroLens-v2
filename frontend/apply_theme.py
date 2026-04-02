import os
import glob

replacements = {
    'bg-white': '', 
    'text-gray-900': 'text-slate-100',
    'text-gray-800': 'text-slate-200',
    'text-gray-700': 'text-slate-300',
    'text-gray-600': 'text-slate-300',
    'text-gray-500': 'text-slate-400',
    'text-gray-400': 'text-slate-500',
    'text-gray-300': 'text-slate-500',
    'bg-gray-50': 'bg-slate-900/50',
    'bg-gray-100': 'bg-[rgba(30,41,59,0.5)]',
    'border-gray-200': 'border-slate-700/50',
    'border-gray-300': 'border-slate-600/50',
    'border-gray-100': 'border-slate-700/50',
    'bg-green-50': 'bg-emerald-900/30',
    'border-green-200': 'border-emerald-500/20',
    'text-green-700': 'text-emerald-400',
    'text-green-600': 'text-emerald-400',
    'text-red-600': 'text-rose-400',
    'bg-red-50': 'bg-rose-900/30',
    'border-red-200': 'border-rose-500/20',
    'text-blue-600': 'text-cyan-400',
    'bg-blue-50': 'bg-cyan-900/30',
    'text-secondary': 'text-slate-100',
}

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for filepath in glob.glob('src/**/*.jsx', recursive=True):
    update_file(filepath)

print("Theme migration complete.")
