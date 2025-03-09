import './updateQueryContainerElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #updateQueryContainerElement {
    display: flex;
    flex-direction: row;
    gap: 16px;
  }
`;
document.head.appendChild(styles);

const updateQueryContainerElement = document.createElement('div');
updateQueryContainerElement.id = getComponentIdFromVariable({updateQueryContainerElement})

export default updateQueryContainerElement
