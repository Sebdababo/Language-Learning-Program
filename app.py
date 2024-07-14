from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vocab_app.db'
db = SQLAlchemy(app)

class Library(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

class VocabSet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    source_language = db.Column(db.String(50), nullable=False)
    target_language = db.Column(db.String(50), nullable=False)
    library_id = db.Column(db.Integer, db.ForeignKey('library.id'), nullable=False)

class VocabCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    phonetic = db.Column(db.String(100))
    translation = db.Column(db.String(100), nullable=False)
    vocab_set_id = db.Column(db.Integer, db.ForeignKey('vocab_set.id'), nullable=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/libraries', methods=['GET', 'POST'])
def handle_libraries():
    if request.method == 'GET':
        libraries = Library.query.all()
        return jsonify([{'id': lib.id, 'name': lib.name} for lib in libraries])
    elif request.method == 'POST':
        data = request.json
        new_library = Library(name=data['name'])
        db.session.add(new_library)
        db.session.commit()
        return jsonify({'id': new_library.id, 'name': new_library.name}), 201

@app.route('/api/libraries/<int:library_id>/vocab_sets', methods=['GET', 'POST'])
def handle_vocab_sets(library_id):
    if request.method == 'GET':
        vocab_sets = VocabSet.query.filter_by(library_id=library_id).all()
        return jsonify([{'id': vs.id, 'name': vs.name, 'source_language': vs.source_language, 'target_language': vs.target_language} for vs in vocab_sets])
    elif request.method == 'POST':
        data = request.json
        new_vocab_set = VocabSet(name=data['name'], source_language=data['source_language'], target_language=data['target_language'], library_id=library_id)
        db.session.add(new_vocab_set)
        db.session.commit()
        return jsonify({'id': new_vocab_set.id, 'name': new_vocab_set.name, 'source_language': new_vocab_set.source_language, 'target_language': new_vocab_set.target_language}), 201

@app.route('/api/vocab_sets/<int:vocab_set_id>/cards', methods=['GET', 'POST'])
def handle_cards(vocab_set_id):
    if request.method == 'GET':
        cards = VocabCard.query.filter_by(vocab_set_id=vocab_set_id).all()
        return jsonify([{'id': card.id, 'word': card.word, 'phonetic': card.phonetic, 'translation': card.translation} for card in cards])
    elif request.method == 'POST':
        data = request.json
        new_card = VocabCard(word=data['word'], phonetic=data['phonetic'], translation=data['translation'], vocab_set_id=vocab_set_id)
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)

@app.route('/api/libraries/<int:library_id>', methods=['DELETE'])
def delete_library(library_id):
    library = Library.query.get(library_id)
    if library:
        db.session.delete(library)
        db.session.commit()
        return '', 204
    return jsonify({'error': 'Library not found'}), 404

@app.route('/api/vocab_sets/<int:vocab_set_id>', methods=['DELETE'])
def delete_vocab_set(vocab_set_id):
    vocab_set = VocabSet.query.get(vocab_set_id)
    if vocab_set:
        db.session.delete(vocab_set)
        db.session.commit()
        return '', 204
    return jsonify({'error': 'Vocab set not found'}), 404