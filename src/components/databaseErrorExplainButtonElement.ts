import './databaseErrorExplainButtonElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";

// Create and append styles
const styles = document.createElement('style');
styles.textContent = `
  #databaseErrorExplainButtonElement {
    position: absolute;
    top: 0px;
    right: 76px;
    height: 36px;
    line-height: 36px;
    padding: 0px 16px;
    color: #509ee3;
    background-color: #509ee333;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 60;
  }

  #databaseErrorExplainButtonElement .tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    bottom: -85px;
    right: -32px;
    width: 150px;
    font-size: 12px;
    padding: 12px;
    color: white;
    font-weight: bold;
    background-color: #2e353b;
    border: none;
    pointer-events: none;
    line-height: 1.26;
    font-size: 12px;
    border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.13);
    word-wrap: break-word;
    z-index: 10;
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s;
  }

  #databaseErrorExplainButtonElement .tooltip::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 60px;
    border-width: 0 8px 8px 8px;
    border-style: solid;
    border-color: transparent transparent #2e353b transparent;
  }

  #databaseErrorExplainButtonElement:hover:not(.clicked) .tooltip {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.3s ease-in-out, visibility 0s linear;
  }

  #databaseErrorExplainButtonElement.clicked .tooltip {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s ease-in-out, visibility 0s linear 0.3s;
  }
`;
document.head.appendChild(styles);

const databaseErrorExplainButtonElement = document.createElement('div');
databaseErrorExplainButtonElement.id = getComponentIdFromVariable({databaseErrorExplainButtonElement})
databaseErrorExplainButtonElement.innerHTML = 'Explain'

const tooltipElement = document.createElement('div');
tooltipElement.className = 'tooltip'
tooltipElement.innerHTML = 'Explain why the query caused an error<br>(⌘ + ⇧ + e)'

databaseErrorExplainButtonElement.appendChild(tooltipElement);

databaseErrorExplainButtonElement.addEventListener('click', () => {
  databaseErrorExplainButtonElement.classList.add('clicked');
});

databaseErrorExplainButtonElement.addEventListener('mouseleave', () => {
  databaseErrorExplainButtonElement.classList.remove('clicked');
});


export default databaseErrorExplainButtonElement
