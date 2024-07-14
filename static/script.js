let cards = [];
let currentCardIndex = 0;

const wordElement = document.getElementById('word');
const phoneticElement = document.getElementById('phonetic');
const translationElement = document.getElementById('translation');
const cardElement = document.getElementById('card');

function loadCards() {
    fetch('/api/cards')
        .then(response => response.json())
        .then(data => {
            cards = data;
            if (cards.length > 0) {
                displayCard(currentCardIndex);
            } else {
                displayNoCards();
            }
        });
}

function displayCard(index) {
    if (cards.length === 0) {
        displayNoCards();
        return;
    }
    const card = cards[index];
    wordElement.textContent = card.word;
    phoneticElement.textContent = card.phonetic;
    translationElement.textContent = card.translation;
}

function displayNoCards() {
    wordElement.textContent = 'No cards available';
    phoneticElement.textContent = '';
    translationElement.textContent = '';
}

function flipCard() {
    cardElement.classList.toggle('flipped');
}

function nextCard() {
    if (cards.length === 0) return;
    currentCardIndex = (currentCardIndex + 1) % cards.length;
    displayCard(currentCardIndex);
    cardElement.classList.remove('flipped');
}

function prevCard() {
    if (cards.length === 0) return;
    currentCardIndex = (currentCardIndex - 1 + cards.length) % cards.length;
    displayCard(currentCardIndex);
    cardElement.classList.remove('flipped');
}

function addCard() {
    const word = document.getElementById('new-word').value;
    const phonetic = document.getElementById('new-phonetic').value;
    const translation = document.getElementById('new-translation').value;

    fetch('/api/cards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word, phonetic, translation }),
    })
    .then(response => response.json())
    .then(newCard => {
        cards.push(newCard);
        document.getElementById('new-word').value = '';
        document.getElementById('new-phonetic').value = '';
        document.getElementById('new-translation').value = '';
        if (cards.length === 1) {
            displayCard(0);
        }
    });
}

function deleteCard() {
    if (cards.length === 0) return;

    const cardId = cards[currentCardIndex].id;
    fetch(`/api/cards/${cardId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            cards.splice(currentCardIndex, 1);
            if (cards.length === 0) {
                displayNoCards();
            } else {
                currentCardIndex = currentCardIndex % cards.length;
                displayCard(currentCardIndex);
            }
        } else {
            console.error('Failed to delete card');
        }
    });
}

document.getElementById('flip-btn').addEventListener('click', flipCard);
document.getElementById('next-btn').addEventListener('click', nextCard);
document.getElementById('prev-btn').addEventListener('click', prevCard);
document.getElementById('add-btn').addEventListener('click', addCard);
document.getElementById('delete-btn').addEventListener('click', deleteCard);

loadCards();