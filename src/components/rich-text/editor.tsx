"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { editorExtensions } from "./extensions";
import { MenuToolbar } from "./menu-toolbar";

interface RichTextEditorProps {
  field?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function RichTextEditor({
  field,
  onChange,
  disabled,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    content: (() => {
      if (!field) return "";

      try {
        return JSON.parse(field);
      } catch {
        return "";
      }
    })(),
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(JSON.stringify(editor.getJSON()));
      }
    },
    extensions: editorExtensions,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "max-w-none min-h-[125px] focus:outline-none p-4 prose dark:prose-invert marker:text-gray-500 prose-p:my-0",
      },
    },
  });

  return (
    <div className="relative w-full border border-input rounded-lg overflow-hidden dark:bg-input/30 flex flex-col">
      <MenuToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="max-h-[200px] overflow-y-auto"
      />
    </div>
  );
}
