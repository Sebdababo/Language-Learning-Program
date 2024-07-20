let currentLibrary = null;
let currentVocabSet = null;
let currentCards = [];
let currentCardIndex = 0;
let forgottenCards = [];
let currentPage = 1;
const itemsPerPage = 20;

function handleFetchError(error) {
    console.error('Fetch error:', error);
    showFeedback('An error occurred. Please try again later.', 'error');
}

function showFeedback(message, type = 'success') {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 3000);
}

function validateInput(input, fieldName) {
    if (!input.trim()) {
        throw new Error(`${fieldName} cannot be empty`);
    }
}

function showLibraries() {
    fetch('/api/libraries')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch libraries');
            return response.json();
        })
        .then(libraries => {
            let html = '<h2>Your Libraries</h2>';
            libraries.forEach(library => {
                html += `
                    <div class="list-item">
                        <span onclick="showVocabSets(${library.id})">${library.name}</span>
                        <button onclick="deleteLibrary(${library.id}, event)">Delete</button>
                    </div>`;
            });
            html += '<button onclick="showNewLibraryForm()">New Library</button>';
            html += '<button onclick="showExportImportOptions()">Export/Import Data</button>';
            document.getElementById('main-content').innerHTML = html;
        })
        .catch(handleFetchError);
}

function showNewLibraryForm() {
    document.getElementById('main-content').innerHTML = `
        <h2>Create New Library</h2>
        <input type="text" id="new-library-name" placeholder="Library Name">
        <button onclick="createNewLibrary()">Create Library</button>
    `;
}

function createNewLibrary() {
    const name = document.getElementById('new-library-name').value;
    try {
        validateInput(name, 'Library name');
        fetch('/api/libraries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to create library');
            return response.json();
        })
        .then(() => {
            showLibraries();
            showFeedback('Library created successfully');
        })
        .catch(handleFetchError);
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

function deleteLibrary(libraryId, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this library?')) {
        fetch(`/api/libraries/${libraryId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete library');
                showLibraries();
                showFeedback('Library deleted successfully');
            })
            .catch(handleFetchError);
    }
}

function showVocabSets(libraryId) {
    currentLibrary = libraryId;
    fetch(`/api/libraries/${libraryId}/vocab_sets`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch vocab sets');
            return response.json();
        })
        .then(vocabSets => {
            let html = '<h2>Vocab Sets</h2>';
            vocabSets.forEach(set => {
                html += `
                    <div class="list-item">
                        <span onclick="showVocabSetOverview(${set.id})">${set.name} (${set.source_language} - ${set.target_language})</span>
                        <button onclick="deleteVocabSet(${set.id}, event)">Delete</button>
                    </div>`;
            });
            html += '<button onclick="showNewVocabSetForm()">New Vocab Set</button>';
            html += '<button onclick="showLibraries()">Back to Libraries</button>';
            document.getElementById('main-content').innerHTML = html;
        })
        .catch(handleFetchError);
}

function showNewVocabSetForm() {
    document.getElementById('main-content').innerHTML = `
        <h2>Create New Vocab Set</h2>
        <input type="text" id="new-set-name" placeholder="Set Name">
        <input type="text" id="source-language" placeholder="Source Language">
        <input type="text" id="target-language" placeholder="Target Language">
        <button onclick="createNewVocabSet()">Create Vocab Set</button>
    `;
}

function createNewVocabSet() {
    const name = document.getElementById('new-set-name').value;
    const source_language = document.getElementById('source-language').value;
    const target_language = document.getElementById('target-language').value;
    try {
        validateInput(name, 'Set name');
        validateInput(source_language, 'Source language');
        validateInput(target_language, 'Target language');
        fetch(`/api/libraries/${currentLibrary}/vocab_sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, source_language, target_language })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to create vocab set');
            return response.json();
        })
        .then(() => {
            showVocabSets(currentLibrary);
            showFeedback('Vocab set created successfully');
        })
        .catch(handleFetchError);
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

function deleteVocabSet(vocabSetId, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this vocab set?')) {
        fetch(`/api/vocab_sets/${vocabSetId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete vocab set');
                showVocabSets(currentLibrary);
                showFeedback('Vocab set deleted successfully');
            })
            .catch(handleFetchError);
    }
}

function showVocabSetOverview(vocabSetId, page = 1) {
    currentVocabSet = vocabSetId;
    currentPage = page;
    fetch(`/api/vocab_sets/${vocabSetId}/cards?page=${page}&per_page=${itemsPerPage}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch cards');
            return response.json();
        })
        .then(data => {
            currentCards = data.cards;
            let html = '<h2>Vocab Set Overview</h2>';
            html += createCardTable(currentCards);
            html += createPagination(data.total_pages);
            html += '<button onclick="showNewCardForm()">Add New Card</button>';
            html += '<button onclick="startReview()">Start Review</button>';
            html += `<button onclick="showVocabSets(${currentLibrary})">Back to Vocab Sets</button>`;
            document.getElementById('main-content').innerHTML = html;
        })
        .catch(handleFetchError);
}

function createCardTable(cards) {
    let html = '<table><tr><th>Word</th><th>Phonetic</th><th>Translation</th><th>Action</th></tr>';
    cards.forEach(card => {
        html += `
            <tr>
                <td>${card.word}</td>
                <td>${card.phonetic}</td>
                <td>${card.translation}</td>
                <td><button onclick="deleteCard(${card.id}, event)">Delete</button></td>
            </tr>`;
    });
    html += '</table>';
    return html;
}

function createPagination(totalPages) {
    let html = '<div class="pagination">';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="showVocabSetOverview(${currentVocabSet}, ${i})">${i}</button>`;
    }
    html += '</div>';
    return html;
}

function showNewCardForm() {
    document.getElementById('main-content').innerHTML = `
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
    try {
        validateInput(word, 'Word');
        validateInput(translation, 'Translation');
        fetch(`/api/vocab_sets/${currentVocabSet}/cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word, phonetic, translation })
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to add card');
            return response.json();
        })
        .then(() => {
            showVocabSetOverview(currentVocabSet);
            showFeedback('Card added successfully');
        })
        .catch(handleFetchError);
    } catch (error) {
        showFeedback(error.message, 'error');
    }
}

function deleteCard(cardId, event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this card?')) {
        fetch(`/api/cards/${cardId}`, { method: 'DELETE' })
            .then(response => {
                if (!response.ok) throw new Error('Failed to delete card');
                showVocabSetOverview(currentVocabSet, currentPage);
                showFeedback('Card deleted successfully');
            })
            .catch(handleFetchError);
    }
}

function startReview() {
    currentCardIndex = 0;
    forgottenCards = [];
    showCard();
}

function showCard() {
    if (currentCardIndex >= currentCards.length) {
        showReviewResults();
        return;
    }
    const card = currentCards[currentCardIndex];
    const progress = Math.round(((currentCardIndex + 1) / currentCards.length) * 100);
    document.getElementById('main-content').innerHTML = `
        <div class="progress-bar">
            <div class="progress" style="width: ${progress}%"></div>
        </div>
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
        <button onclick="cardKnown()">Known</button>
        <button onclick="cardForgotten()">Forgotten</button>
        <button onclick="showVocabSetOverview(${currentVocabSet})">End Review</button>
    `;
}

function flipCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function cardKnown() {
    updateCardDifficulty(currentCards[currentCardIndex].id, true);
    currentCardIndex++;
    showCard();
}

function cardForgotten() {
    updateCardDifficulty(currentCards[currentCardIndex].id, false);
    forgottenCards.push(currentCards[currentCardIndex]);
    currentCardIndex++;
    showCard();
}

function updateCardDifficulty(cardId, known) {
    const difficulty = known ? 'easy' : 'hard';
    fetch(`/api/cards/${cardId}/difficulty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update card difficulty');
        return response.json();
    })
    .then(data => {
    })
    .catch(handleFetchError);
}

function showReviewResults() {
    const knownCount = currentCards.length - forgottenCards.length;
    const forgottenCount = forgottenCards.length;
    document.getElementById('main-content').innerHTML = `
        <h2>Review Complete!</h2>
        <p>Known cards: ${knownCount}</p>
        <p>Forgotten cards: ${forgottenCount}</p>
        <button onclick="reviewForgottenCards()">Review Forgotten Cards</button>
        <button onclick="showVocabSetOverview(${currentVocabSet})">Back to Overview</button>
    `;
}

function reviewForgottenCards() {
    currentCards = forgottenCards;
    startReview();
}

function showExportImportOptions() {
    document.getElementById('main-content').innerHTML = `
        <h2>Export/Import Data</h2>
        <button onclick="exportData()">Export Data</button>
        <input type="file" id="import-file" accept=".json">
        <button onclick="importData()">Import Data</button>
        <button onclick="showLibraries()">Back to Libraries</button>
    `;
}

function exportData() {
    fetch('/api/export')
        .then(response => {
            if (!response.ok) throw new Error('Failed to export data');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'vocab_data.json';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showFeedback('Data exported successfully');
        })
        .catch(handleFetchError);
}

function importData() {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];
    if (!file) {
        showFeedback('Please select a file to import', 'error');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/import', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to import data');
        return response.json();
    })
    .then(data => {
        showFeedback('Data imported successfully');
        showLibraries();
    })
    .catch(handleFetchError);
}

showLibraries();

document.addEventListener('DOMContentLoaded', showLibraries);