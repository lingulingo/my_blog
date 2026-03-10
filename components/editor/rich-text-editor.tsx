"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Heading2, List, Quote, Link2 } from "lucide-react";

type RichTextEditorProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
};

export function RichTextEditor({ name, value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "在这里写下正文、观点、清单和故事..." }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "editor-content min-h-[380px] max-w-none px-5 py-4 focus:outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "<p></p>");
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="panel-surface rounded-[1.75rem]">
      <div className="flex flex-wrap gap-2 p-3" style={{ borderBottom: "1px solid var(--color-line)" }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className="editor-toolbar-btn"><Bold size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className="editor-toolbar-btn"><Italic size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="editor-toolbar-btn"><Heading2 size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="editor-toolbar-btn"><List size={16} /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className="editor-toolbar-btn"><Quote size={16} /></button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("输入链接地址");
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className="editor-toolbar-btn"
        >
          <Link2 size={16} />
        </button>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
