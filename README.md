# ResearchGraph 🔬

[![Next.js](https://img.shields.io/badge/Next.js-13.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green)](https://openai.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

ResearchGraph is an interactive research planning tool that helps researchers visualize, organize, and expand their research plans using a graph-based interface and AI assistance.

![ResearchGraph Demo](demo.gif)

## ✨ Features

### 📊 Interactive Graph Interface
- Create and connect research nodes with directional relationships
- Drag-and-drop node positioning
- Zoom, pan, and navigate large research plans
- Multi-node selection with Ctrl+drag
- Bulk operations (delete, mark obsolete)
- Nested subgraph support with expand/collapse
- Smart node positioning and spacing

### 🤖 AI-Powered Planning
- Auto-generate intermediate research steps
- Bridge gaps between research milestones
- Context-aware suggestions based on your existing plan
- Full graph structure analysis for better suggestions
- Smart node positioning for generated steps
- Powered by OpenAI's GPT-4

### 📝 Rich Content Support
- Markdown descriptions for nodes and edges
- File attachments support
- Obsolescence tracking with downstream effects
- Auto-scaling text labels
- Nested node hierarchies
- ESC key for quick subgraph collapse

### 💾 Data Management
- Automatic local saving
- File export/import functionality
- Undo/redo support
- State persistence across sessions
- Reliable ID generation
- Error handling for invalid states

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or later
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/murnanedaniel/ResearchPlanner.git
cd ResearchPlanner
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```
Edit \`.env.local\` and add your OpenAI API key:
```bash
OPENAI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Visit http://localhost:3000 to start using ResearchGraph!

## 🎮 Usage

### Quick Start Guide

ResearchGraph follows intuitive web-standard interactions. Press **?** anytime to see all keyboard shortcuts!

### Creating & Editing Nodes
- **Double-click canvas** → Create new node at cursor position
- **Double-click node** → Edit node details in side panel
- **Right-click node** → Quick actions menu (Edit, Create Edge, Mark Obsolete, Delete)
- **Single click node** → Select for editing
- **Drag node** → Move to new position
- **Del key** → Delete selected node(s)

### Working with Multiple Nodes
- **Ctrl + Click** → Add/remove nodes from selection
- **Ctrl + Drag canvas** → Box select multiple nodes
- **Drag selected node** → Move all selected nodes together
- **ESC key** → Clear selection or collapse expanded node

### Creating Connections
- **Alt + Click node** → Start edge creation mode
- **Click target node** → Complete the edge
- **Right-click node** → "Create Edge" from context menu
- **Edge toolbar toggle** → Enable/disable edge creation mode
- **ESC key** → Cancel edge creation

### Using AI Assistance
1. Toggle "AI Autocomplete" in the left toolbar
2. Click a start node (highlighted in emerald)
3. Click a goal node (highlighted in blue)
4. AI generates intermediate research steps
5. Edit generated steps as needed

### Managing Subgraphs
1. Select multiple nodes (**Ctrl + Drag**)
2. Enter a parent node title in toolbar
3. Click "Collapse to Node" to group them
4. Click expand button or **ESC** to collapse
5. **Ctrl + Drag onto node** to nest as child

### Navigation
- **Drag canvas** → Pan the view
- **Mouse wheel** → Zoom in/out
- **Zoom controls** → Bottom right corner buttons

## 🛠 Configuration

### OpenAI Settings
Modify \`app/api/autocomplete/route.ts\` to adjust:
- Model selection (GPT-4o-mini)
- Temperature and other parameters
- Prompt engineering

### Graph Settings
Adjust \`components/ResearchPlanner/constants.ts\` for:
- Node sizes and spacing
- Edge appearance
- Animation timings
- Layout parameters

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [OpenAI](https://openai.com/)
- Graph visualization inspired by [react-flow](https://reactflow.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

## 📞 Support

- Open an issue for bugs or feature requests
- Join our [Discord community](https://discord.gg/researchgraph)
- Follow us on [Twitter](https://twitter.com/researchgraph)

---

Made with ❤️ for researchers everywhere
