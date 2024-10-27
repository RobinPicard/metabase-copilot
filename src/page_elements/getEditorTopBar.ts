function getEditorTopBar(version : [number, number]) : Element | null {
  const element = document.querySelector('[data-testid="native-query-top-bar"]');
  if (element && element.children.length > 2) {
    return element.children[2];
  }
  return null;
}

export default getEditorTopBar;
