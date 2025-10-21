# AI MCQ Solver Chrome Extension

A beautiful, modern Chrome extension that uses AI to solve multiple-choice questions instantly. Built with React, Tailwind CSS, and ShadCN UI components.

## ✨ Features

- **Smart Text Selection**: Select text on any webpage and get instant AI solutions
- **Beautiful UI**: Modern, clean design with dark/light mode toggle
- **Fast Performance**: Optimized for instant popup loading (<300ms)
- **Professional Design**: Premium SaaS-level UI inspired by ChatGPT
- **Responsive**: Works perfectly in the Chrome extension popup
- **Confidence Scoring**: Shows AI confidence level for each answer

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Chrome browser

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build
```

## 🏗️ Project Structure

```
ai-mcq-solver-extension/
├── public/
│   ├── icons/           # Extension icons (16, 48, 128px)
│   └── manifest.json    # Chrome extension manifest
├── src/
│   ├── popup/           # Popup UI components
│   ├── content/         # Content script for text selection
│   ├── background/      # Background service worker
│   ├── components/      # Reusable UI components
│   ├── lib/            # API and utilities
│   └── index.css       # Global styles
├── package.json
└── vite.config.ts
```

## 🎨 UI Components

- **Header**: Logo, title, and dark mode toggle
- **Question Input**: Textarea for pasting questions
- **AI Solver Button**: Triggers AI analysis
- **Answer Box**: Beautiful card displaying AI response
- **Loader**: Animated loading state
- **Copy Button**: Copy answers to clipboard

## 🔧 Configuration

### Backend API

Update the API endpoint in `src/lib/api.ts`:

```typescript
const response = await fetch('https://your-backend.com/api/solve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question }),
});
```

### Manifest Permissions

The extension requires these permissions:
- `storage`: For theme preferences
- `activeTab`: For text selection
- `scripting`: For content script injection
- `<all_urls>`: For cross-site text selection

## 🎯 Usage

1. **Text Selection**: Select any text on a webpage
2. **Open Extension**: Click the extension icon
3. **Auto-fill**: Selected text automatically appears in the input
4. **Solve**: Click "Solve with AI" button
5. **Copy**: Copy the answer to clipboard

## 🛠️ Customization

### Styling
- Modify `src/index.css` for global styles
- Update `tailwind.config.js` for theme customization
- ShadCN components in `src/components/ui/`

### Functionality
- Update `src/lib/api.ts` for backend integration
- Modify `src/content/contentScript.ts` for text selection behavior
- Customize `src/background/background.ts` for extension lifecycle

## 📦 Build Output

After running `npm run build`, the `dist` folder contains:
- `popup.html` - Extension popup
- `background.js` - Service worker
- `contentScript.js` - Content script
- `manifest.json` - Extension manifest
- `icons/` - Extension icons
- CSS and JS bundles

## 🔒 Security

- Manifest v3 compliant
- Minimal permissions
- No external dependencies in production
- Secure API communication

## 📱 Browser Support

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use in your projects!

---

Built with ❤️ using React, Tailwind CSS, and ShadCN UI
