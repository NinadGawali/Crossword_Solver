# 🧩 Crossword Puzzle Generator - Web Application

A beautiful, modern web interface for generating crossword puzzles using Flask backend with stunning animations and interactive UI.

## ✨ Features

- **🎨 Beautiful Modern UI** - Gradient backgrounds, smooth animations, and responsive design
- **⚡ Interactive Preview** - Live preview of structure and word lists before generation
- **🔄 Dual View Modes** - Switch between interactive grid view and downloadable image view
- **📱 Fully Responsive** - Works perfectly on desktop, tablet, and mobile devices
- **💾 Easy Download** - Download your crossword puzzles as PNG images
- **🎯 Real-time Feedback** - Loading states, error messages, and success notifications
- **⌨️ Keyboard Shortcuts** - Ctrl/Cmd + Enter to generate, Escape to dismiss errors

## 🚀 Getting Started

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Install Dependencies**

   ```powershell
   pip install -r requirements_web.txt
   ```

   This will install:
   - Flask 3.0.0 (Web framework)
   - Pillow 10.1.0 (Image generation)
   - Werkzeug 3.0.1 (Flask dependency)

### Running the Application

1. **Start the Flask Server**

   ```powershell
   python app.py
   ```

2. **Open Your Browser**

   Navigate to: `http://localhost:5000`

3. **Generate Crosswords!**
   - Select a crossword structure from the dropdown
   - Choose a word list
   - Click "Generate Crossword" or press Ctrl+Enter
   - View your puzzle in interactive grid or download as image

## 📁 Project Structure

```
crossword/
├── app.py                    # Flask backend application
├── crossword.py             # Original crossword logic (unchanged)
├── generate.py              # Original generator (unchanged)
├── requirements_web.txt     # Web app dependencies
├── templates/
│   └── index.html          # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css       # Beautiful CSS with animations
│   └── js/
│       └── script.js       # Interactive JavaScript
├── data/
│   ├── structure0.txt      # Crossword structures
│   ├── structure1.txt
│   ├── structure2.txt
│   ├── words0.txt          # Word lists
│   ├── words1.txt
│   └── words2.txt
└── output/                  # Generated images (auto-created)
```

## 🎨 UI Features

### Animations
- **Floating Background Circles** - Smooth gradient animations
- **Fade In Effects** - Elegant entry animations for all elements
- **Hover Effects** - Interactive button and cell hover states
- **Loading Spinner** - Professional loading overlay during generation
- **Success Toasts** - Smooth slide-in notifications

### Design Elements
- **Modern Color Scheme** - Dark theme with vibrant purple/blue gradients
- **Custom Scrollbars** - Styled to match the color theme
- **Responsive Grid** - Adapts to different screen sizes
- **Professional Typography** - Poppins font family
- **Smooth Transitions** - All interactions are animated

## 🔧 API Endpoints

### `GET /`
Returns the main application page with available structures and word lists.

### `POST /generate`
Generates a crossword puzzle.

**Request Body:**
```json
{
  "structure": "structure0.txt",
  "words": "words0.txt"
}
```

**Response:**
```json
{
  "success": true,
  "grid": [[{"type": "cell", "letter": "S"}, ...]],
  "image": "base64_encoded_image_data",
  "width": 5,
  "height": 5
}
```

### `POST /get-file-preview`
Gets a preview of structure or word file.

**Request Body:**
```json
{
  "type": "structure",
  "filename": "structure0.txt"
}
```

## 🎯 Usage Tips

1. **Preview Before Generate** - Click on structure/word list dropdowns to see previews
2. **Keyboard Shortcuts** - Use Ctrl+Enter (Cmd+Enter on Mac) to quickly generate
3. **View Switching** - Toggle between grid and image views for different perspectives
4. **Download** - Click download button to save high-quality PNG images
5. **Error Handling** - If generation fails, the system provides helpful error messages

## 🛠️ Customization

### Adding New Structures
Place `.txt` files in the `data/` directory with the format:
- `_` for empty cells
- `#` for blocked cells

Example:
```
#___#
#_##_
#_##_
```

### Adding New Word Lists
Create `.txt` files in `data/` with one word per line:
```
word1
word2
word3
```

### Styling
Modify `static/css/style.css` to customize:
- Colors (CSS variables at the top)
- Animations
- Layout
- Responsive breakpoints

## 📝 Original Terminal Usage

The original terminal functionality remains unchanged:

```powershell
python generate.py data/structure0.txt data/words0.txt output/puzzle.png
```

## 🐛 Troubleshooting

### Port Already in Use
If port 5000 is in use, modify `app.py`:
```python
app.run(debug=True, port=5001)  # Use different port
```

### Module Not Found
Ensure all dependencies are installed:
```powershell
pip install -r requirements_web.txt
```

### Images Not Generating
Check that the `assets/fonts/` directory exists with OpenSans-Regular.ttf, or the system will fall back to default font.

## 🌟 Features Comparison

| Feature | Terminal | Web App |
|---------|----------|---------|
| Generate Crosswords | ✅ | ✅ |
| Interactive Preview | ❌ | ✅ |
| Live Grid View | ❌ | ✅ |
| Download Images | ✅ | ✅ |
| Beautiful UI | ❌ | ✅ |
| Animations | ❌ | ✅ |
| Responsive Design | ❌ | ✅ |
| File Preview | ❌ | ✅ |

## 📄 License

See LICENSE.txt for details.

## 🎉 Enjoy!

Create beautiful crossword puzzles with this modern, interactive web application!
