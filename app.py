from flask import Flask, request, jsonify, send_file, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.exceptions import BadRequest
import json
import io
from datetime import datetime, timedelta

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vocab_app.db'
db = SQLAlchemy(app)

class Library(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    vocab_sets = db.relationship('VocabSet', backref='library', lazy=True, cascade='all, delete-orphan')

class VocabSet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    source_language = db.Column(db.String(50), nullable=False)
    target_language = db.Column(db.String(50), nullable=False)
    library_id = db.Column(db.Integer, db.ForeignKey('library.id'), nullable=False)
    cards = db.relationship('VocabCard', backref='vocab_set', lazy=True, cascade='all, delete-orphan')

class VocabCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    phonetic = db.Column(db.String(100))
    translation = db.Column(db.String(100), nullable=False)
    vocab_set_id = db.Column(db.Integer, db.ForeignKey('vocab_set.id'), nullable=False)
    difficulty = db.Column(db.String(20), default='normal')
    next_review = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/libraries', methods=['GET', 'POST'])
def handle_libraries():
    if request.method == 'GET':
        libraries = Library.query.all()
        return jsonify([{'id': lib.id, 'name': lib.name} for lib in libraries])
    elif request.method == 'POST':
        data = request.json
        if not data or 'name' not in data or not data['name'].strip():
            raise BadRequest('Library name is required')
        new_library = Library(name=data['name'].strip())
        db.session.add(new_library)
        db.session.commit()
        return jsonify({'id': new_library.id, 'name': new_library.name}), 201

@app.route('/api/libraries/<int:library_id>', methods=['DELETE'])
def delete_library(library_id):
    library = Library.query.get(library_id)
    if library:
        db.session.delete(library)
        db.session.commit()
        return '', 204
    return jsonify({'error': 'Library not found'}), 404

@app.route('/api/libraries/<int:library_id>/vocab_sets', methods=['GET', 'POST'])
def handle_vocab_sets(library_id):
    if request.method == 'GET':
        vocab_sets = VocabSet.query.filter_by(library_id=library_id).all()
        return jsonify([{'id': vs.id, 'name': vs.name, 'source_language': vs.source_language, 'target_language': vs.target_language} for vs in vocab_sets])
    elif request.method == 'POST':
        data = request.json
        if not data or 'name' not in data or not data['name'].strip():
            raise BadRequest('Vocab set name is required')
        new_vocab_set = VocabSet(name=data['name'].strip(), source_language=data['source_language'], target_language=data['target_language'], library_id=library_id)
        db.session.add(new_vocab_set)
        db.session.commit()
        return jsonify({'id': new_vocab_set.id, 'name': new_vocab_set.name, 'source_language': new_vocab_set.source_language, 'target_language': new_vocab_set.target_language}), 201

@app.route('/api/vocab_sets/<int:vocab_set_id>', methods=['DELETE'])
def delete_vocab_set(vocab_set_id):
    vocab_set = VocabSet.query.get(vocab_set_id)
    if vocab_set:
        db.session.delete(vocab_set)
        db.session.commit()
        return '', 204
    return jsonify({'error': 'Vocab set not found'}), 404

@app.route('/api/vocab_sets/<int:vocab_set_id>/cards', methods=['GET', 'POST'])
def handle_cards(vocab_set_id):
    if request.method == 'GET':
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        cards = VocabCard.query.filter_by(vocab_set_id=vocab_set_id).paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'cards': [{'id': card.id, 'word': card.word, 'phonetic': card.phonetic, 'translation': card.translation} for card in cards.items],
            'total_pages': cards.pages,
            'current_page': page
        })
    elif request.method == 'POST':
        data = request.json
        if not data or 'word' not in data or not data['word'].strip():
            raise BadRequest('Word is required')
        new_card = VocabCard(word=data['word'].strip(), phonetic=data['phonetic'], translation=data['translation'], vocab_set_id=vocab_set_id)
        db.session.add(new_card)
        db.session.commit()
        return jsonify({'id': new_card.id, 'word': new_card.word, 'phonetic': new_card.phonetic, 'translation': new_card.translation}), 201

@app.route('/api/cards/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    card = VocabCard.query.get(card_id)
    if card:
        db.session.delete(card)
        db.session.commit()
        return '', 204
    return jsonify({'error': 'Card not found'}), 404

@app.route('/api/cards/<int:card_id>/difficulty', methods=['POST'])
def update_card_difficulty(card_id):
    card = VocabCard.query.get(card_id)
    if not card:
        return jsonify({'error': 'Card not found'}), 404
    
    data = request.json
    difficulty = data.get('difficulty')
    if difficulty not in ['easy', 'normal', 'hard']:
        return jsonify({'error': 'Invalid difficulty level'}), 400
    
    card.difficulty = difficulty
    if difficulty == 'easy':
        card.next_review = datetime.utcnow() + timedelta(days=7)
    elif difficulty == 'normal':
        card.next_review = datetime.utcnow() + timedelta(days=3)
    else:
        card.next_review = datetime.utcnow() + timedelta(days=1)
    
    db.session.commit()
    return jsonify({'message': 'Card difficulty updated successfully'}), 200

@app.route('/api/export', methods=['GET'])
def export_data():
    libraries = Library.query.all()
    data = []
    for library in libraries:
        lib_data = {
            'name': library.name,
            'vocab_sets': []
        }
        for vocab_set in library.vocab_sets:
            set_data = {
                'name': vocab_set.name,
                'source_language': vocab_set.source_language,
                'target_language': vocab_set.target_language,
                'cards': []
            }
            for card in vocab_set.cards:
                set_data['cards'].append({
                    'word': card.word,
                    'phonetic': card.phonetic,
                    'translation': card.translation,
                    'difficulty': card.difficulty
                })
            lib_data['vocab_sets'].append(set_data)
        data.append(lib_data)
    
    return send_file(
        io.BytesIO(json.dumps(data).encode()),
        mimetype='application/json',
        as_attachment=True,
        attachment_filename='vocab_data.json'
    )

@app.route('/api/import', methods=['POST'])
def import_data():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        data = json.loads(file.read())
        for lib_data in data:
            library = Library(name=lib_data['name'])
            db.session.add(library)
            for set_data in lib_data['vocab_sets']:
                vocab_set = VocabSet(name=set_data['name'], source_language=set_data['source_language'], target_language=set_data['target_language'], library=library)
                db.session.add(vocab_set)
                for card_data in set_data['cards']:
                    card = VocabCard(word=card_data['word'], phonetic=card_data['phonetic'], translation=card_data['translation'], difficulty=card_data['difficulty'], vocab_set=vocab_set)
                    db.session.add(card)
        db.session.commit()
        return jsonify({'message': 'Data imported successfully'}), 200

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)