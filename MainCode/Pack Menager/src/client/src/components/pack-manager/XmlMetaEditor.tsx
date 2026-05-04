import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { xml } from '@codemirror/lang-xml';
import { oneDark } from '@codemirror/theme-one-dark';

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

export function XmlMetaEditor({ value, onChange, placeholder }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden [&_.cm-editor]:min-h-[400px]">
      <CodeMirror
        value={value}
        height="400px"
        theme={oneDark}
        extensions={[xml()]}
        placeholder={placeholder}
        onChange={onChange}
        basicSetup={{
          foldGutter: true,
          lineNumbers: true,
          highlightActiveLine: true,
        }}
      />
    </div>
  );
}
