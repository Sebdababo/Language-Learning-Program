## Language Learning Program

### Overview
This Language Learning Program is a web application designed to help users learn new languages through vocabulary sets and flashcards. It allows users to create libraries, add vocabulary sets to these libraries, and use interactive flashcards for effective learning.

### Features
- **Library Management**: Create, view, and delete libraries.
- **Vocabulary Sets**: Add, view, and delete vocabulary sets within libraries.
- **Flashcards**: Interactive flashcards for reviewing vocabulary.
- **Progress Tracking**: Monitor your progress and review forgotten cards.
- **Data Export/Import**: Export and import vocabulary data in JSON format.

### Technologies Used
- **Backend**: Python (Flask)
- **Frontend**: HTML, CSS, JavaScript

### Installation

1. **Clone the repository:**
    ```
    git clone https://github.com/Sebdababo/Language-Learning-Program.git
    cd Language-Learning-Program
    ```

2. **Install dependencies:**
    ```
    pip install -r requirements.txt
    ```

3. **Run the application:**
    ```
    python app.py
    ```

4. **Access the application:**
    Open your web browser and go to `http://localhost:5000`.
   
### API Endpoints
- **GET /api/libraries**: Fetch all libraries.
- **POST /api/libraries**: Create a new library.
- **DELETE /api/libraries/:id**: Delete a library by ID.
- **GET /api/libraries/:library_id/vocab_sets**: Fetch vocab sets for a library.
- **POST /api/libraries/:library_id/vocab_sets**: Create a new vocab set in a library.
- **DELETE /api/vocab_sets/:id**: Delete a vocab set by ID.
- **GET /api/vocab_sets/:vocab_set_id/cards**: Fetch cards for a vocab set.
- **POST /api/vocab_sets/:vocab_set_id/cards**: Add a new card to a vocab set.
- **DELETE /api/cards/:id**: Delete a card by ID.
- **POST /api/cards/:card_id/difficulty**: Update the difficulty of a card.
- **GET /api/export**: Export data.
- **POST /api/import**: Import data.

### Usage

1. **Create a Library:**
    - Go to the "Libraries" section.
    - Click "New Library" and enter a name for your library.
    - Click "Create Library".

2. **Add a Vocabulary Set:**
    - Select a library to view its vocabulary sets.
    - Click "New Vocab Set" and enter the set details (name, source language, target language).
    - Click "Create Vocab Set".

3. **Add Flashcards:**
    - Select a vocab set to view its cards.
    - Click "Add New Card" and enter the card details (word, phonetic, translation).
    - Click "Add Card".

4. **Review Vocabulary:**
    - Select a vocab set and click "Start Review".
    - Use the flashcards to review and track your progress.

5. **Export/Import Data:**
    - Go to the "Export/Import Data" section.
    - Click "Export Data" to download your data.
    - Click "Import Data" to upload data from a JSON file.

### Customization
- **Styling**: Modify `styles.css` to change the appearance of the application.
- **Functionality**: Update `script.js` to enhance or change the behavior of the application.
