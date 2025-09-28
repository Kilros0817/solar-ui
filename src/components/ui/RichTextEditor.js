"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { useCallback, useEffect } from 'react';

export default function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = "Enter clause content...",
  className = ""
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3 min-h-[120px] prose-headings:font-semibold prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-gray-500',
      },
    },
  });

  const setContent = useCallback((newContent) => {
    if (editor) {
      editor.commands.setContent(newContent);
    }
  }, [editor]);

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      setContent(content);
    }
  }, [content, editor, setContent]);

  if (!editor) {
    return (
      <div className={`border border-[var(--border)] rounded-md bg-white ${className}`}>
        <div className="p-3 text-sm text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`border border-[var(--border)] rounded-md bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-[var(--border)] p-2 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive('bold') ? 'bg-gray-200' : ''
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive('italic') ? 'bg-gray-200' : ''
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive('strike') ? 'bg-gray-200' : ''
          }`}
        >
          <s>S</s>
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => {
            console.log('Bullet list clicked');
            editor.chain().focus().toggleBulletList().run();
          }}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive('bulletList') ? 'bg-gray-200' : ''
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => {
            console.log('Ordered list clicked');
            editor.chain().focus().toggleOrderedList().run();
          }}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive('orderedList') ? 'bg-gray-200' : ''
          }`}
        >
          1. List
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => {
            console.log('H2 clicked');
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => {
            console.log('H3 clicked');
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
          }`}
        >
          H3
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        >
          —
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''
          }`}
          title="Align Left"
        >
          ⬅️
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''
          }`}
          title="Align Center"
        >
          ↔️
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-2 py-1 text-xs rounded hover:bg-gray-100 ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''
          }`}
          title="Align Right"
        >
          ➡️
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="px-2 py-1 text-xs rounded hover:bg-gray-100"
        >
          ↷
        </button>
      </div>
      
      {/* Editor */}
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>
      
      <style jsx>{`
        .tiptap-editor :global(.ProseMirror) {
          outline: none;
          min-height: 120px;
          padding: 12px;
        }
        
        .tiptap-editor :global(.ProseMirror h2) {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 1rem 0 0.5rem 0;
          color: #111827;
        }
        
        .tiptap-editor :global(.ProseMirror h3) {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem 0;
          color: #111827;
        }
        
        .tiptap-editor :global(.ProseMirror ul) {
          list-style-type: disc;
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .tiptap-editor :global(.ProseMirror ol) {
          list-style-type: decimal;
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .tiptap-editor :global(.ProseMirror li) {
          margin: 0.25rem 0;
        }
        
        .tiptap-editor :global(.ProseMirror strong) {
          font-weight: 600;
          color: #111827;
        }
        
        .tiptap-editor :global(.ProseMirror em) {
          font-style: italic;
        }
        
        .tiptap-editor :global(.ProseMirror s) {
          text-decoration: line-through;
        }
        
        .tiptap-editor :global(.ProseMirror hr) {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 1rem 0;
        }
        
        .tiptap-editor :global(.ProseMirror p) {
          margin: 0.5rem 0;
          color: #374151;
        }
        
        .tiptap-editor :global(.ProseMirror p.is-editor-empty:first-child::before) {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        .tiptap-editor :global(.ProseMirror [style*="text-align: left"]) {
          text-align: left;
        }
        
        .tiptap-editor :global(.ProseMirror [style*="text-align: center"]) {
          text-align: center;
        }
        
        .tiptap-editor :global(.ProseMirror [style*="text-align: right"]) {
          text-align: right;
        }
        
        .tiptap-editor :global(.ProseMirror .has-focus) {
          outline: none;
        }
      `}</style>
    </div>
  );
}
