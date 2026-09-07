# Frontend Developer Guide

## Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── contexts/         # React context providers
│   ├── assets/           # Images, fonts, etc.
│   │   └── images/       # Image assets
│   ├── App.jsx           # Main App component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles (Tailwind)
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies and scripts
```

## Getting Started

### Prerequisites
- Node.js (v20.11.1 or later)
- npm (v10.2.4 or later)

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
This starts the development server at `http://localhost:5173`

### Build
```bash
npm run build
```
Creates production build in `dist/` directory

### Preview
```bash
npm run preview
```
Preview the production build locally

## Adding New Routes

This project uses client-side routing. To add new routes:

1. **Install React Router** (if not already installed):
   ```bash
   npm install react-router-dom
   ```

2. **Set up routing in App.jsx**:
   ```jsx
   import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
   import Home from './pages/Home';
   import About from './pages/About';

   function App() {
     return (
       <Router>
         <Routes>
           <Route path="/" element={<Home />} />
           <Route path="/about" element={<About />} />
         </Routes>
       </Router>
     );
   }
   ```

3. **Create page components** in `src/pages/`:
   ```jsx
   // src/pages/About.jsx
   import React from 'react';

   const About = () => {
     return (
       <div className="min-h-screen bg-gray-50">
         <h1 className="text-4xl font-bold text-center pt-12">About Us</h1>
       </div>
     );
   };

   export default About;
   ```

## Working with Tailwind CSS

### Basic Usage
Tailwind CSS is configured and ready to use. Apply classes directly to your JSX elements:

```jsx
<div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold mb-2">Card Title</h2>
  <p className="text-blue-100">Card content goes here.</p>
</div>
```

### Common Patterns

#### Responsive Design
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

#### Flexbox Layout
```jsx
<div className="flex flex-col md:flex-row items-center justify-between">
  {/* Content */}
</div>
```

#### Hover Effects
```jsx
<button className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200">
  Click me
</button>
```

### Custom Configuration
Edit `tailwind.config.js` to customize:
- Colors
- Fonts
- Spacing
- Breakpoints
- Plugins

```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#1e40af',
        'brand-green': '#16a34a',
      },
      fontFamily: {
        'custom': ['YourFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

## Adding New Pages

1. **Create the page component** in `src/pages/`:
   ```jsx
   // src/pages/NewPage.jsx
   import React from 'react';

   const NewPage = () => {
     return (
       <div className="min-h-screen bg-gray-50">
         {/* Page content */}
       </div>
     );
   };

   export default NewPage;
   ```

2. **Add route** (if using React Router):
   ```jsx
   <Route path="/new-page" element={<NewPage />} />
   ```

3. **Add navigation link**:
   ```jsx
   <Link to="/new-page" className="text-gray-700 hover:text-gray-900">
     New Page
   </Link>
   ```

## Creating Components

### Component Structure
```jsx
// src/components/Button.jsx
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-md transition-colors duration-200';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${
    disabled ? 'opacity-50 cursor-not-allowed' : ''
  }`;

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
```

### Usage
```jsx
import Button from '../components/Button';

<Button variant="primary" size="lg" onClick={() => console.log('Clicked!')}>
  Click Me
</Button>
```

## State Management

### Local State (useState)
```jsx
import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};
```

### Context API for Global State
```jsx
// src/contexts/AppContext.jsx
import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  user: null,
  cart: [],
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'ADD_TO_CART':
      return { ...state, cart: [...state.cart, action.payload] };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

## Custom Hooks

Create reusable logic with custom hooks in `src/hooks/`:

```jsx
// src/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
};
```

## Git Workflow Guidelines

### Branch Naming
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes
- `chore/task-description` - Maintenance tasks

### Commit Messages
Follow conventional commits format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```bash
git commit -m "feat(auth): add user login functionality"
git commit -m "fix(cart): resolve item duplication issue"
git commit -m "docs(readme): update installation instructions"
```

### Workflow
1. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push branch**:
   ```bash
   git push origin feature/new-feature
   ```

4. **Create Pull Request** on GitHub

5. **After approval, merge and delete branch**:
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/new-feature
   ```

### Pre-commit Checks
Before committing, ensure:
- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No console.log statements in production code
- [ ] Code is properly formatted
- [ ] No sensitive data (API keys, passwords) in code

## Useful Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint (if configured)
npm run test         # Run tests (if configured)
```

### Package Management
```bash
npm install package-name          # Install package
npm install -D package-name       # Install dev dependency
npm uninstall package-name        # Remove package
npm update                        # Update all packages
npm outdated                      # Check for outdated packages
```

### Troubleshooting
```bash
rm -rf node_modules package-lock.json
npm install                       # Reset dependencies

npm cache clean --force           # Clear npm cache
```

## Best Practices

### Component Organization
- Keep components small and focused
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Follow consistent naming conventions

### Performance
- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images and assets
- Use code splitting for large bundles

### Security
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS in production
- Keep dependencies updated
- Never commit sensitive information

### Accessibility
- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Maintain good color contrast ratios

## Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vite.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [MDN Web Docs](https://developer.mozilla.org/)