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

### 🤖 AI-Powered Planning
- Auto-generate intermediate research steps
- Bridge gaps between research milestones
- Context-aware suggestions based on your existing plan
- Powered by OpenAI's GPT-4

### 📝 Rich Content Support
- Markdown descriptions for nodes and edges
- File attachments support
- Obsolescence tracking with downstream effects
- Auto-scaling text labels

### 💾 Data Management
- Automatic local saving
- File export/import functionality
- Undo/redo support
- State persistence across sessions

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or later
- npm or yarn
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/research-graph.git
cd research-graph
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Set up your environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`
Edit \`.env.local\` and add your OpenAI API key:
\`\`\`
OPENAI_API_KEY=your_api_key_here
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Visit http://localhost:3000 to start using ResearchGraph!

## 🎮 Usage

### Creating Nodes
1. Enter a title in the toolbar
2. Click "Add Node" or press Enter
3. Double-click nodes to edit details
4. Drag nodes to reposition

### Creating Connections
1. Click "Create Edge" in the toolbar
2. Select source node
3. Select target node
4. Edge is created with directional arrow

### Using AI Assistance
1. Click "Autocomplete" in the toolbar
2. Select a start node
3. Select a goal node
4. AI will generate intermediate steps

### Multi-Select Operations
1. Hold Ctrl and drag to select multiple nodes
2. Use Delete key to remove selected nodes
3. Selection state persists for bulk operations

## 🛠 Configuration

### OpenAI Settings
Modify \`app/api/autocomplete/route.ts\` to adjust:
- Model selection (GPT-4, GPT-3.5-turbo)
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
