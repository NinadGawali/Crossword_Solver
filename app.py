from flask import Flask, render_template, request, jsonify, send_file
import os
import sys
from io import BytesIO
import base64
from crossword import Crossword, Variable
from generate import CrosswordCreator
from PIL import Image, ImageDraw, ImageFont
import time
import threading
from queue import Queue

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure output directory exists
os.makedirs('output', exist_ok=True)

# Store solving progress for each session
solving_sessions = {}

@app.route('/')
def index():
    """Render the main page."""
    # Get available structure and word files
    data_dir = 'data'
    structures = []
    words = []
    
    if os.path.exists(data_dir):
        for file in os.listdir(data_dir):
            if file.startswith('structure') and file.endswith('.txt'):
                structures.append(file)
            elif file.startswith('words') and file.endswith('.txt'):
                words.append(file)
    
    structures.sort()
    words.sort()
    
    return render_template('index.html', structures=structures, words=words)

@app.route('/generate', methods=['POST'])
def generate_crossword():
    """Generate a crossword puzzle with animated solving."""
    try:
        data = request.get_json()
        structure_file = data.get('structure')
        words_file = data.get('words')
        session_id = data.get('session_id', str(time.time()))
        
        if not structure_file or not words_file:
            return jsonify({'error': 'Please select both structure and words files'}), 400
        
        structure_path = os.path.join('data', structure_file)
        words_path = os.path.join('data', words_file)
        
        # Check if files exist
        if not os.path.exists(structure_path) or not os.path.exists(words_path):
            return jsonify({'error': 'Selected files do not exist'}), 400
        
        # Initialize session
        solving_sessions[session_id] = {
            'steps': [],
            'complete': False,
            'error': None
        }
        
        # Generate crossword in background
        def solve_with_tracking():
            try:
                crossword = Crossword(structure_path, words_path)
                creator = AnimatedCrosswordCreator(crossword, session_id, solving_sessions)
                assignment = creator.solve()
                
                if assignment is None:
                    solving_sessions[session_id]['error'] = 'No solution found'
                    solving_sessions[session_id]['complete'] = True
                    return
                
                # Get the letter grid
                letters = creator.letter_grid(assignment)
                
                # Create grid data for frontend
                grid_data = []
                for i in range(crossword.height):
                    row = []
                    for j in range(crossword.width):
                        if crossword.structure[i][j]:
                            row.append({
                                'type': 'cell',
                                'letter': letters[i][j] if letters[i][j] else ''
                            })
                        else:
                            row.append({
                                'type': 'blocked',
                                'letter': ''
                            })
                    grid_data.append(row)
                
                # Generate image
                image_data = generate_image(crossword, letters, assignment)
                
                solving_sessions[session_id]['result'] = {
                    'grid': grid_data,
                    'image': image_data,
                    'width': crossword.width,
                    'height': crossword.height
                }
                solving_sessions[session_id]['complete'] = True
                
            except Exception as e:
                solving_sessions[session_id]['error'] = str(e)
                solving_sessions[session_id]['complete'] = True
        
        # Start solving in background
        thread = threading.Thread(target=solve_with_tracking)
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/solving-progress/<session_id>', methods=['GET'])
def get_solving_progress(session_id):
    """Get the current solving progress."""
    if session_id not in solving_sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    session = solving_sessions[session_id]
    
    response = {
        'complete': session['complete'],
        'steps': session['steps'],
        'error': session.get('error')
    }
    
    if session['complete'] and 'result' in session:
        response['result'] = session['result']
    
    # Clear old steps to prevent memory issues
    session['steps'] = []
    
    return jsonify(response)

def generate_image(crossword, letters, assignment):
    """Generate crossword image and return as base64."""
    cell_size = 100
    cell_border = 2
    interior_size = cell_size - 2 * cell_border
    
    # Create a blank canvas
    img = Image.new(
        "RGBA",
        (crossword.width * cell_size, crossword.height * cell_size),
        "black",
    )
    
    try:
        font = ImageFont.truetype("assets/fonts/OpenSans-Regular.ttf", 80)
    except IOError:
        font = ImageFont.load_default()
    
    draw = ImageDraw.Draw(img)
    
    for i in range(crossword.height):
        for j in range(crossword.width):
            rect = [
                (j * cell_size + cell_border, i * cell_size + cell_border),
                (
                    (j + 1) * cell_size - cell_border,
                    (i + 1) * cell_size - cell_border,
                ),
            ]
            if crossword.structure[i][j]:
                draw.rectangle(rect, fill="white")
                if letters[i][j]:
                    bbox = draw.textbbox((0, 0), letters[i][j], font=font)
                    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
                    draw.text(
                        (
                            rect[0][0] + ((interior_size - w) / 2),
                            rect[0][1] + ((interior_size - h) / 2) - 10,
                        ),
                        letters[i][j],
                        fill="black",
                        font=font,
                    )
    
    # Convert to base64
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return img_str

@app.route('/get-file-preview', methods=['POST'])
def get_file_preview():
    """Get preview of structure or words file."""
    try:
        data = request.get_json()
        file_type = data.get('type')  # 'structure' or 'words'
        filename = data.get('filename')
        
        if not filename:
            return jsonify({'error': 'No filename provided'}), 400
        
        filepath = os.path.join('data', filename)
        
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        if file_type == 'structure':
            # Parse structure to show visual preview
            lines = content.strip().split('\n')
            preview = []
            for line in lines:
                row = []
                for char in line:
                    if char == '_':
                        row.append('cell')
                    else:
                        row.append('blocked')
                preview.append(row)
            return jsonify({'success': True, 'preview': preview, 'raw': content})
        else:
            # For words, just return the list
            words = content.strip().split('\n')
            return jsonify({'success': True, 'words': words, 'raw': content})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

class AnimatedCrosswordCreator(CrosswordCreator):
    """Extended CrosswordCreator that tracks solving steps for animation."""
    
    def __init__(self, crossword, session_id, sessions_dict):
        super().__init__(crossword)
        self.session_id = session_id
        self.sessions = sessions_dict
        self.step_count = 0
    
    def add_step(self, step_type, data):
        """Add a solving step for visualization."""
        self.step_count += 1
        step = {
            'step': self.step_count,
            'type': step_type,
            'data': data,
            'timestamp': time.time()
        }
        self.sessions[self.session_id]['steps'].append(step)
        
        # Add small delay for visualization
        time.sleep(0.05)
    
    def backtrack(self, assignment):
        """Enhanced backtrack with step tracking."""
        if len(assignment) == len(self.domains):
            return assignment
        
        variable = self.select_unassigned_variable(assignment)
        
        # Show which variable we're trying to fill
        self.add_step('select_variable', {
            'variable': {
                'i': variable.i,
                'j': variable.j,
                'direction': variable.direction,
                'length': variable.length
            },
            'assignment_size': len(assignment)
        })
        
        for value in self.domains[variable]:
            assignment_copy = assignment.copy()
            assignment_copy[variable] = value
            
            # Show attempt to place word
            self.add_step('try_word', {
                'variable': {
                    'i': variable.i,
                    'j': variable.j,
                    'direction': variable.direction,
                    'length': variable.length
                },
                'word': value,
                'grid': self.get_current_grid(assignment_copy)
            })
            
            if self.consistent(assignment_copy):
                # Show successful placement
                self.add_step('place_word', {
                    'variable': {
                        'i': variable.i,
                        'j': variable.j,
                        'direction': variable.direction,
                        'length': variable.length
                    },
                    'word': value,
                    'grid': self.get_current_grid(assignment_copy)
                })
                
                result = self.backtrack(assignment_copy)
                
                if result is not None:
                    return result
                
                # Show backtracking
                self.add_step('backtrack', {
                    'variable': {
                        'i': variable.i,
                        'j': variable.j,
                        'direction': variable.direction,
                        'length': variable.length
                    },
                    'word': value,
                    'grid': self.get_current_grid(assignment)
                })
            else:
                # Show failed attempt
                self.add_step('reject_word', {
                    'variable': {
                        'i': variable.i,
                        'j': variable.j,
                        'direction': variable.direction,
                        'length': variable.length
                    },
                    'word': value,
                    'reason': 'inconsistent'
                })
        
        return None
    
    def get_current_grid(self, assignment):
        """Get current grid state as 2D array."""
        letters = self.letter_grid(assignment)
        grid = []
        
        for i in range(self.crossword.height):
            row = []
            for j in range(self.crossword.width):
                if self.crossword.structure[i][j]:
                    row.append({
                        'type': 'cell',
                        'letter': letters[i][j] if letters[i][j] else ''
                    })
                else:
                    row.append({
                        'type': 'blocked',
                        'letter': ''
                    })
            grid.append(row)
        
        return grid

if __name__ == '__main__':
    app.run(debug=True, port=5000)
