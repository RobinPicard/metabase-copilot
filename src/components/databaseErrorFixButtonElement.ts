import './databaseErrorFixButtonElement.css';

import getComponentIdFromVariable from "../utils/getComponentIdFromVariable";


const databaseErrorFixButtonElement = document.createElement('div');
databaseErrorFixButtonElement.id = getComponentIdFromVariable({databaseErrorFixButtonElement})
databaseErrorFixButtonElement.innerHTML = 'Fix'

const tooltipElement = document.createElement('div');
tooltipElement.className = 'tooltip'
tooltipElement.innerHTML = 'Fix the query in the editor<br>(⌘ + ⇧ + f)'

databaseErrorFixButtonElement.appendChild(tooltipElement);

databaseErrorFixButtonElement.addEventListener('click', () => {
  databaseErrorFixButtonElement.classList.add('clicked');
});
  
databaseErrorFixButtonElement.addEventListener('mouseleave', () => {
  databaseErrorFixButtonElement.classList.remove('clicked');
});


export default databaseErrorFixButtonElement
