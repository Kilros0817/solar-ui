'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister, $getNearestNodeOfType } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import { $insertList, $removeList, ListNode } from '@lexical/list';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Undo2, Redo2, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Heading1, Heading2, Heading3, Pilcrow } from 'lucide-react';
import { cn } from '../../lib/utils';

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';

const iconSize = 18;

const activeStyle: CSSProperties = {
  background: 'color-mix(in oklch, var(--primary) 15%, transparent)',
  color: 'var(--primary)',
};

export default function ClauseToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      const anchorNode = selection.anchor.getNode();
      const listNode = $getNearestNodeOfType(anchorNode, ListNode);
      if (listNode !== null) {
        setBlockType(listNode.getTag());
      } else {
        const element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
        if ($isHeadingNode(element)) {
          const tag = element.getTag();
          setBlockType(
            tag === 'h1' || tag === 'h2' || tag === 'h3' ? tag : 'paragraph',
          );
        } else {
          setBlockType('paragraph');
        }
      }
    }
  }, []);

  const formatBulletList = useCallback(() => {
    editor.update(() => {
      if (blockType !== 'ul') {
        $insertList('bullet');
      } else {
        $removeList();
      }
    });
  }, [editor, blockType]);

  const formatNumberedList = useCallback(() => {
    editor.update(() => {
      if (blockType !== 'ol') {
        $insertList('number');
      } else {
        $removeList();
      }
    });
  }, [editor, blockType]);

  const formatHeading = useCallback(
    (tag: 'h1' | 'h2' | 'h3') => {
      if (blockType === tag) return;
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode(tag));
        }
      });
    },
    [editor, blockType],
  );

  const formatParagraph = useCallback(() => {
    if (blockType === 'paragraph') return;
    editor.update(() => {
      if (blockType === 'ul' || blockType === 'ol') {
        $removeList();
      } else {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      }
    });
  }, [editor, blockType]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          { editor },
        );
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateToolbar]);

  return (
    <div className="clause-toolbar">
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="clause-toolbar-btn"
        aria-label="Undo"
      >
        <Undo2 size={iconSize} />
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="clause-toolbar-btn"
        aria-label="Redo"
      >
        <Redo2 size={iconSize} />
      </button>
      <div className="clause-toolbar-divider" aria-hidden />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={formatParagraph}
        className={cn('clause-toolbar-btn', blockType === 'paragraph' && 'clause-toolbar-btn-active')}
        style={blockType === 'paragraph' ? activeStyle : undefined}
        aria-label="Paragraph"
      >
        <Pilcrow size={iconSize} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => formatHeading('h1')}
        className={cn('clause-toolbar-btn', blockType === 'h1' && 'clause-toolbar-btn-active')}
        style={blockType === 'h1' ? activeStyle : undefined}
        aria-label="Heading 1"
      >
        <Heading1 size={iconSize} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => formatHeading('h2')}
        className={cn('clause-toolbar-btn', blockType === 'h2' && 'clause-toolbar-btn-active')}
        style={blockType === 'h2' ? activeStyle : undefined}
        aria-label="Heading 2"
      >
        <Heading2 size={iconSize} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => formatHeading('h3')}
        className={cn('clause-toolbar-btn', blockType === 'h3' && 'clause-toolbar-btn-active')}
        style={blockType === 'h3' ? activeStyle : undefined}
        aria-label="Heading 3"
      >
        <Heading3 size={iconSize} />
      </button>
      <div className="clause-toolbar-divider" aria-hidden />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={cn('clause-toolbar-btn', isBold && 'clause-toolbar-btn-active')}
        style={isBold ? activeStyle : undefined}
        aria-label="Bold"
      >
        <Bold size={iconSize} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={cn('clause-toolbar-btn', isItalic && 'clause-toolbar-btn-active')}
        style={isItalic ? activeStyle : undefined}
        aria-label="Italic"
      >
        <Italic size={iconSize} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={cn('clause-toolbar-btn', isUnderline && 'clause-toolbar-btn-active')}
        style={isUnderline ? activeStyle : undefined}
        aria-label="Underline"
      >
        <Underline size={iconSize} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        className={cn('clause-toolbar-btn', isStrikethrough && 'clause-toolbar-btn-active')}
        style={isStrikethrough ? activeStyle : undefined}
        aria-label="Strikethrough"
      >
        <Strikethrough size={iconSize} />
      </button>
      <div className="clause-toolbar-divider" aria-hidden />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={formatBulletList}
        className={cn('clause-toolbar-btn', blockType === 'ul' && 'clause-toolbar-btn-active')}
        style={blockType === 'ul' ? activeStyle : undefined}
        aria-label="Bullet list"
      >
        <List size={iconSize} />
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={formatNumberedList}
        className={cn('clause-toolbar-btn', blockType === 'ol' && 'clause-toolbar-btn-active')}
        style={blockType === 'ol' ? activeStyle : undefined}
        aria-label="Numbered list"
      >
        <ListOrdered size={iconSize} />
      </button>
    </div>
  );
}
