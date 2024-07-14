from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vocab_cards.db'
db = SQLAlchemy(app)

class VocabCard(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    phonetic = db.Column(db.String(100))
    translation = db.Column(db.String(100), nullable=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cards', methods=['GET'])
def get_cards():
    cards = VocabCard.query.all()
    return jsonify([
        {'id': card.id, 'word': card.word, 'phonetic': card.phonetic, 'translation': card.translation}
        for card in cards
    ])

@app.route('/api/cards', methods=['POST'])
def add_card():
    data = request.json
    new_card = VocabCard(word=data['word'], phonetic=data['phonetic'], translation=data['translation'])
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