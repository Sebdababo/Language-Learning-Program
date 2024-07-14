let currentLibrary = null;
let currentVocabSet = null;
let currentCards = [];
let currentCardIndex = 0;

const mainContent = document.getElementById('main-content');

function showLibraries() {
    fetch('/api/libraries')
        .then(response => response.json())
        .then(libraries => {
            let html = '<h2>Your Libraries</h2>';
            libraries.forEach(library => {
                html += `<div class="list-item" onclick="showVocabSets(${library.id})">${library.name}</div>`;
            });
            html += '<button onclick="showNewLibraryForm()">New Library</button>';
            mainContent.innerHTML = html;
        });
}

function showNewLibraryForm() {
    mainContent.innerHTML = `
        <h2>Create New Library</h2>
        <input type="text" id="new-library-name" placeholder="Library Name">
        <button onclick="createNewLibrary()">Create Library</button>
    `;
}

function createNewLibrary() {
    const name = document.getElementById('new-library-name').value;
    fetch('/api/libraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
    .then(() => showLibraries());
}

function showVocabSets(libraryId) {
    currentLibrary = libraryId;
    fetch(`/api/libraries/${libraryId}/vocab_sets`)
        .then(response => response.json())
        .then(vocabSets => {
            let html = '<h2>Vocab Sets</h2>';
            vocabSets.forEach(set => {
                html += `<div class="list-item" onclick="showVocabSetOverview(${set.id})">${set.name} (${set.source_language} - ${set.translation_language})</div>`;
            });
            html += '<button onclick="showNewVocabSetForm()">New Vocab Set</button>';
            html += '<button onclick="showLibraries()">Back to Libraries</button>';
            mainContent.innerHTML = html;
        });
}

function showNewVocabSetForm() {
    mainContent.innerHTML = `
        <h2>Create New Vocab Set</h2>
        <input type="text" id="new-set-name" placeholder="Set Name">
        <input type="text" id="source-language" placeholder="Source Language">
        <input type="text" id="translation-language" placeholder="Translation Language">
        <button onclick="createNewVocabSet()">Create Vocab Set</button>
    `;
}

function createNewVocabSet() {
    const name = document.getElementById('new-set-name').value;
    const source_language = document.getElementById('source-language').value;
    const translation_language = document.getElementById('translation-language').value;
    fetch(`/api/libraries/${currentLibrary}/vocab_sets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, source_language, translation_language })
    })
    .then(() => showVocabSets(currentLibrary));
}

function showVocabSetOverview(vocabSetId) {
    currentVocabSet = vocabSetId;
    fetch(`/api/vocab_sets/${vocabSetId}/cards`)
        .then(response => response.json())
        .then(cards => {
            currentCards = cards;
            let html = '<h2>Vocab Set Overview</h2>';
            html += '<table><tr><th>Word</th><th>Phonetic</th><th>Translation</th></tr>';
            cards.forEach(card => {
                html += `<tr><td>${card.word}</td><td>${card.phonetic}</td><td>${card.translation}</td></tr>`;
            });
            html += '</table>';
            html += '<button onclick="showNewCardForm()">Add New Card</button>';
            html += '<button onclick="startReview()">Start Review</button>';
            html += `<button onclick="showVocabSets(${currentLibrary})">Back to Vocab Sets</button>`;
            mainContent.innerHTML = html;
        });
}

function showNewCardForm() {
    mainContent.innerHTML = `
        <h2>Add New Card</h2>
        <input type="text" id="new-word" placeholder="Word">
        <input type="text" id="new-phonetic" placeholder="Phonetic">
        <input type="text" id="new-translation" placeholder="Translation">
        <button onclick="addNewCard()">Add Card</button>
    `;
}

function addNewCard() {
    const word = document.getElementById('new-word').value;
    const phonetic = document.getElementById('new-phonetic').value;
    const translation = document.getElementById('new-translation').value;
    fetch(`/api/vocab_sets/${currentVocabSet}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, phonetic, translation })
    })
    .then(() => showVocabSetOverview(currentVocabSet));
}

function startReview() {
    currentCardIndex = 0;
    showCard();
}

function showCard() {
    if (currentCardIndex >= currentCards.length) {
        mainContent.innerHTML = '<h2>Review Complete!</h2><button onclick="showVocabSetOverview(' + currentVocabSet + ')">Back to Overview</button>';
        return;
    }
    const card = currentCards[currentCardIndex];
    mainContent.innerHTML = `
        <div class="card" onclick="flipCard(this)">
            <div class="card-inner">
                <div class="card-front">
                    <h2 id="word">${card.word}</h2>
                    <p id="phonetic">${card.phonetic}</p>
                </div>
                <div class="card-back">
                    <h2 id="translation">${card.translation}</h2>
                </div>
            </div>
        </div>
        <button onclick="nextCard()">Next Card</button>
        <button onclick="showVocabSetOverview(${currentVocabSet})">End Review</button>
    `;
}

function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function nextCard() {
    currentCardIndex++;
    showCard();
}

showLibraries();