# LuckyDay - Lottery Number Generator

A modern, gamified lottery number generator built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Multiple Generation Methods**: Random, birthday-based, zodiac-based, frequency analysis, pattern recognition, and more
- **Historical Data Integration**: Uses real lottery data for statistical analysis
- **Gamified UI**: Duolingo-inspired design with animations, streaks, and confetti
- **Responsive Design**: Works perfectly on desktop and mobile
- **Performance Optimized**: Virtualized lists, memoized calculations, and efficient caching
- **Multi-language Support**: Korean and English

## 📊 Generation Methods

### Basic Methods
- **Random**: Pure random number generation
- **Birthday**: Numbers derived from your birthday
- **Zodiac**: Numbers based on your zodiac sign

### Advanced Methods
- **Frequency Analysis**: Hot/cold numbers, window-based analysis
- **Pattern Recognition**: Gap analysis, pair/triplet frequency
- **Constraint Filters**: Odd/even balance, sum ranges, zone balancing
- **Machine Learning**: Markov chains, gradient boosting (placeholder)

## 🛠️ Technical Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Performance**: React Window, useMemo, intersection observers
- **Caching**: Local storage, API response caching
- **Deployment**: Vercel with cron jobs for data updates

## 🎯 Performance Optimizations

### Phase 1: Component Architecture ✅
- Reusable UI components (Button, NumberBall, Card)
- Custom hooks for state management
- Generator service with caching
- Performance monitoring utilities

### Phase 2: Bundle Optimization ✅
- Dynamic imports for heavy components
- Lazy loading with error boundaries
- Turbopack and webpack optimizations
- Tree shaking and compression

### Phase 3: API Optimization ✅
- Request batching and caching
- Rate limiting and error handling
- Service worker for offline support
- Optimized API routes

### Phase 4: UI & Performance Sprint ✅
- **Virtualized ticket history** with react-window
- **Memoized heavy stats** with useMemo
- **Intersection observer animations** for smooth UX
- **Enhanced delete functionality** with confirm modals
- **Responsive layout** with mobile drawer
- **Modern button components** with gradients and animations
- **Removed unused components** (streak widget)
- **CSS purging** for optimal bundle size

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd luckyday
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Usage

1. **Choose a generation method** from the available options
2. **Configure inputs** (birthday, zodiac sign, etc.) if required
3. **Click Generate** to create your lucky numbers
4. **Save combinations** to your history for future reference
5. **View statistics** and patterns in the sidebar

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   └── page.tsx        # Main page
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── lazy/           # Lazy-loaded components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
└── styles/             # Global styles
```

## 🎨 Design System

### Colors
- **Primary**: Indigo (#4F5DFF)
- **Secondary**: Lime (#00CC66)
- **Accent**: Gold (#FFCC33)
- **Background**: Off-white (#FAFAFA)

### Components
- **Cards**: Rounded corners, subtle shadows
- **Buttons**: Gradients, hover animations
- **Animations**: Smooth transitions, confetti effects

## 📈 Performance Metrics

- **Bundle Size**: Optimized with tree shaking
- **Load Time**: < 2s on 3G connection
- **Interactions**: 60fps animations
- **Memory**: Efficient virtualization for large lists

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational and entertainment purposes only. Please gamble responsibly.

## 🙏 Acknowledgments

- Inspired by Duolingo's gamification design
- Built with modern web technologies
- Optimized for performance and user experience

---

**Disclaimer**: This application is for entertainment purposes only. Lottery games are games of chance and should be played responsibly. Please set a budget and never spend more than you can afford to lose.
