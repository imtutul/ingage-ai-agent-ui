# Ingage AI Agent UI

A modern, responsive conversational agent interface built with Angular 19.

## Features

✨ **Modern Chat Interface**
- Clean, iOS-inspired design with message bubbles
- Real-time typing indicators
- Smooth animations and transitions
- Professional status indicators

📱 **Fully Responsive**
- Mobile-first design approach
- Optimized for tablets and desktop
- Touch-friendly interface elements
- Adaptive layouts for all screen sizes

🎨 **Beautiful UI/UX**
- Custom scrollbars and focus states
- Gradient message bubbles for user messages
- Subtle shadows and rounded corners
- Dark mode support (system preference)

🚀 **Modern Architecture**
- Built with Angular 19 and standalone components
- Reactive state management with RxJS
- Service-based architecture for easy backend integration
- TypeScript for type safety

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

3. **Open your browser**
   Navigate to `http://localhost:4200/` (or the port shown in terminal)

## Project Structure

```
src/app/
├── components/
│   ├── chat/                 # Main chat container component
│   ├── message/              # Individual message component
│   └── message-input/        # Message input with send button
├── models/
│   └── chat.models.ts        # TypeScript interfaces for chat data
├── services/
│   └── chat.service.ts       # Chat state management and business logic
└── app.component.*           # Root application component
```

## Components

### ChatComponent
- Main container managing the overall chat interface
- Handles message display, typing indicators, and status
- Responsive design with proper scroll management
- Auto-scrolls to show new messages

### MessageComponent
- Displays individual messages with proper styling
- Supports both user and agent message types
- Includes timestamps and responsive design
- Animations for smooth message appearance

### MessageInputComponent
- Multi-line textarea with auto-resize
- Send button with hover and disabled states
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Mobile-optimized touch targets

### ChatService
- Manages chat state using RxJS BehaviorSubject
- Handles message sending and response simulation
- Provides connection status management
- Ready for backend integration

## Customization

### Styling
- Global styles in `src/styles.css`
- Component-specific styles in each component file
- CSS custom properties for easy theming
- Dark mode support via `prefers-color-scheme`

### Backend Integration
The `ChatService` includes a placeholder method for backend integration:

```typescript
async sendToBackend(message: string): Promise<string> {
  // Replace with your actual HTTP call to AI backend
  // Example:
  // return this.http.post<{response: string}>('/api/chat', { message })
  //   .toPromise()
  //   .then(result => result.response);
}
```

## Development Commands

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run lint` - Run linting

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Built With

- [Angular 19](https://angular.dev/) - Web framework
- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [RxJS](https://rxjs.dev/) - Reactive programming library
- CSS3 with modern features (Grid, Flexbox, Custom Properties)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different devices
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Ready to chat with your AI agent!** 🤖💬