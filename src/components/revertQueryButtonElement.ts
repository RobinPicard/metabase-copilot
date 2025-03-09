import './revertQueryButtonElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #revertQueryButtonElement {
    height: 35px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 9px 16px;
    color: #519EE3;
    background-color: transparent;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 60;
    font-size: 14px;
    line-height: 17px;
    display: none;
  }
`;
document.head.appendChild(styles);

const revertQueryButtonElement = document.createElement('div');
revertQueryButtonElement.id = getComponentIdFromVariable({revertQueryButtonElement})
revertQueryButtonElement.innerHTML = 'Revert'

export default revertQueryButtonElement
