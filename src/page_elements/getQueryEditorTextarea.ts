function getQueryEditorTextarea(version : [number, number]) : Element | null {
  return document.querySelector('textarea.ace_text-input');
}

export default getQueryEditorTextarea;
