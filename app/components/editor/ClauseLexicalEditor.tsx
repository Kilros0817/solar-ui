'use client';

import { useCallback, useMemo } from 'react';
import { LexicalComposer, type InitialConfigType } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ParagraphNode, TextNode } from 'lexical';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';

import Theme from './theme';
import ClauseToolbarPlugin from './ClauseToolbarPlugin';

const CLAUSE_EDITOR_NAMESPACE = 'ClauseLexicalEditor';

function isLexicalJsonString(value: string): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  const trimmed = value.trim();
  if (trimmed[0] !== '{') return false;
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && 'root' in parsed;
  } catch {
    return false;
  }
}

function plainTextToEditorStateFn(plainText: string) {
  return (editor: LexicalEditor) => {
    editor.update(
      () => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        const textNode = $createTextNode(plainText);
        paragraph.append(textNode);
        root.append(paragraph);
      },
      { tag: 'history-merge' },
    );
  };
}

type ClauseLexicalEditorProps = {
  /** Initial content: Lexical JSON string, or plain text (legacy). */
  initialContent: string;
  readOnly?: boolean;
  /** Called when content changes (editable mode only). Passes Lexical JSON object. */
  onChange?: (json: SerializedEditorState) => void;
  placeholder?: string;
  className?: string;
  'data-testid'?: string;
};

export function ClauseLexicalEditor({
  initialContent,
  readOnly = false,
  onChange,
  placeholder,
  className = '',
  'data-testid': dataTestId,
}: ClauseLexicalEditorProps) {
  const initialConfig = useMemo(() => {
    let editorState: null | string | ((editor: LexicalEditor) => void) = null;
    if (initialContent) {
      if (isLexicalJsonString(initialContent)) {
        editorState = initialContent;
      } else {
        editorState = plainTextToEditorStateFn(initialContent);
      }
    }
    return {
      namespace: CLAUSE_EDITOR_NAMESPACE,
      theme: Theme,
      nodes: [ParagraphNode, TextNode, ListNode, ListItemNode, HeadingNode],
      onError: (error: Error) => {
        console.error('[ClauseLexicalEditor]', error?.message ?? error);
        console.error('[ClauseLexicalEditor] stack:', error.stack);
      },
      editable: !readOnly,
      editorState: editorState ?? undefined,
    } as unknown as InitialConfigType;
  }, [initialContent, readOnly]);

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor, _tags: Set<string>) => {
      if (readOnly || !onChange) return;
      onChange(editorState.toJSON());
    },
    [onChange, readOnly],
  );

  const placeholderText = placeholder ?? 'Enter clause content...';

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div
        className={`clause-editor-container rounded-md border border-input ${readOnly ? 'clause-editor-readonly' : ''} ${className}`}
        data-testid={dataTestId}
      >
        {!readOnly && <ClauseToolbarPlugin />}
        <div className="clause-editor-inner rounded-b-md">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="clause-editor-input w-full rounded-b-md border-0 bg-background text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-placeholder={placeholderText}
                placeholder={
                  <div className="clause-editor-placeholder">
                    {placeholderText}
                  </div>
                }
              />
            }
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {!readOnly && <ListPlugin />}
          {!readOnly && <HistoryPlugin />}
          {!readOnly && <AutoFocusPlugin />}
          {!readOnly && (
            <OnChangePlugin
              ignoreSelectionChange
              onChange={handleChange as any}
            />
          )}
        </div>
      </div>
    </LexicalComposer>
  );
}

/** Serialize current Lexical state to a JSON string for storage. */
export function serializeClauseContentToJson(
  editorState: SerializedEditorState,
): string {
  return JSON.stringify(editorState);
}

/** Parse stored clause content: Lexical JSON string or plain text. Returns string for initialContent. */
export function parseClauseContentFromStorage(
  stored: string | null | undefined,
): string {
  if (stored == null || stored === '') return '';
  const trimmed = stored.trim();
  if (!trimmed) return '';
  return trimmed;
}
