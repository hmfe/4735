const elementStore = new Map();
window.onload = () => {
  // Selectors
  const searchBar = document.getElementById('searchBar');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const searchHistory = document.getElementById('searchHistory')
  const assignmentOneButton = document.getElementById('assignmentOneButton');
  elementStore.set('searchBar', searchBar);
  elementStore.set('searchSuggestions', searchSuggestions);
  elementStore.set('searchHistory', searchHistory);

  // Listeners
  searchBar.addEventListener('keyup', searchBarUpdate);
  searchBar.addEventListener('keyup', navigateAutoComplete);
  searchBar.addEventListener('keyup', checkIfEmpty)
  searchBar.addEventListener('blur', clearItems);
  assignmentOneButton.addEventListener('click', clearItems)
};


/**
 * @description IIFE for handling scope and current active autoComplete
 */

const autoCompleteItems = (function autoCompleteItemsIIFE() {
  let activeItems = [];
  let currentActive = -1;
  return {
    getAutoCompleteItems() {
      return activeItems;
    },
    setAutoCompleteItems(items) {
      activeItems = items;
    },
    increaseCurrentActive() {
      if (currentActive <= activeItems.length) currentActive++;
    },
    decreaseCurrentActive() {
      if (currentActive >= 0) currentActive--;
    },
    getActiveValue() {
      return currentActive;
    },
    getActiveItem() {
      return activeItems[currentActive];
    },
    clear() {
      activeItems = [];
      currentActive = -1;
    },
  }
})();


/**
 * @description This is used as a searchBar listener callback to handle the normal keys
 * @returns void
 * @param event
 */

function searchBarUpdate(event) {
  clearTimeout(this.timer);
  const searchBarValue = event.target.value;
  this.timer = setTimeout(() => {
    if (searchBarValue.length > 1 && (event.key.length === 1 || event.key === 'Backspace')) {
      searchData({
        searchString: searchBarValue.replace(/ /g, '+'),
      }).then(parsedResponse => {
        return updateSuggestionsList({ searchString: searchBarValue, parsedResponse });
      }).then(items => {
        clearItems();
        autoCompleteItems.setAutoCompleteItems(items);
      });
    }
  }, 120);

}

/**
 * @description Check if searchBar is empty
 * @returns void
 */

function checkIfEmpty(event) {
  if (event.target.value.length <= 1) clearItems();
}


/**
 * @description This is used for showing data for the user with autoComplete navigation
 * @returns void
 * @param indexToActivate
 */

function addActiveAutoCompleteItem(indexToActivate) {
  const elements = document.getElementsByClassName('liAutoComplete');
  for (element of elements) {
    element.classList.remove('autoCompleteActive')
  }
  if (indexToActivate >= 0 && indexToActivate < elements.length) {
    elements[indexToActivate].classList.add('autoCompleteActive')
    const searchBar = elementStore.get('searchBar');
    searchBar.value = elements[indexToActivate].innerText;
  }
}

/**
 * @description Add the element to the search history
 * @param element 
 */
function addToSearchHistory(element) {
  const searchHistoryUL = elementStore.get('searchHistory');
  const createTDElement = () => document.createElement('td');
  const trElement = document.createElement('tr');
  trElement.innerHTML = `<td>${element.innerText}</td>`;

  const dateTD = createTDElement();
  dateTD.innerText = new Date().toLocaleString('en-US');

  const buttonTD = createTDElement();
  const buttonElement = document.createElement('button');
  buttonElement.innerText = 'X';
  buttonTD.appendChild(buttonElement);

  trElement.appendChild(dateTD);
  trElement.appendChild(buttonTD);
  buttonElement.addEventListener('click', e => e.target.parentElement.parentElement.remove());

  searchHistoryUL.appendChild(trElement)
}

/**
 * @description eventListener callback Router for navigating the autoCompleteList
 * @returns void
 * @param event
 */

function navigateAutoComplete(event) {
  switch (event.key) {
    case 'ArrowDown':
    case 'Down':
      autoCompleteItems.increaseCurrentActive();
      addActiveAutoCompleteItem(autoCompleteItems.getActiveValue());
      break;
    case 'ArrowUp':
    case 'Up':
      autoCompleteItems.decreaseCurrentActive();
      addActiveAutoCompleteItem(autoCompleteItems.getActiveValue());
      break;
    case 'Enter':
      addToSearchHistory(autoCompleteItems.getActiveItem());
      break;

    default:
      break;
  }
}


/**
 * @description Create autoComplete list items
 * @returns The list item thats been created
 * @param content
 */

function createListItemWithContent({ content }) {
  const liElement = document.createElement('li');
  const spanElement = document.createElement('span');
  liElement.setAttribute('role', 'option');
  liElement.appendChild(spanElement);
  liElement.classList.add('liAutoComplete');
  spanElement.innerHTML = content;
  return liElement;
}


/**
 * @description Clear autocomplete items
 * @returns void
 */

function clearItems(event) {
  if (event !== undefined && (event.explicitOriginalTarget.className === 'liAutoComplete' || event.explicitOriginalTarget.nodeName === '#text')) {
    return;
  }
  const items = autoCompleteItems.getAutoCompleteItems()
  if (items.length > 0) {
    autoCompleteItems.clear()
    items.forEach(item => {
      item.remove();
    })
  }
}


/**
 * @description Update the autoComplete list 
 * @returns A list with with the autoComplete items
 * @params searchString, parsedResponse
 */

function updateSuggestionsList({ searchString, parsedResponse }) {

  const searchSuggestionElement = elementStore.get('searchSuggestions');

  const responseTexts = parsedResponse.map(response => {
    const finalText = response.hasOwnProperty('Topics') ? response.Topics[0].Text : response.Text

    const rx = new RegExp(searchString, 'i', 'g');
    return finalText.replace(rx, '<b>$&</b>');
  })


  return responseTexts.map((text, index) => {
    const item = createListItemWithContent({ content: text, index })
    searchSuggestionElement.appendChild(item);
    item.addEventListener('click', event => addToSearchHistory(event.target));
    return item;
  })
}

/**
 * @description Get data from api
 * @returns Returns relatedTopics array
 * @param searchString
 */
function searchData({ searchString }) {
  const xhttp = new XMLHttpRequest();
  return new Promise(resolve => {
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        resolve(JSON.parse(xhttp.response).RelatedTopics);
      }
    };
    xhttp.open(
      'GET',
      `https://api.duckduckgo.com/?q=${searchString}&format=json`,
      true
    );
    xhttp.send();
  });
}
