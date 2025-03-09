import './promptQueryPopupElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #promptQueryPopupElement {
    color: rgb(76, 87, 115);
    position: absolute;
    left: 50%;
    top: 120px;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 150px;
    padding: 20px;
    background-color: white;
    z-index: 1000;
    resize: none;
    outline: none;
    border: 1px solid rgb(80, 158, 227);
    border-radius: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-family: Monaco, Menlo, "Ubuntu Mono", Consolas, "Source Code Pro", source-code-pro, monospace;
    pointer-events: none;
  }
`;
document.head.appendChild(styles);

const promptQueryPopupElement = document.createElement('textarea');
promptQueryPopupElement.id = getComponentIdFromVariable({promptQueryPopupElement});


export default promptQueryPopupElement;
