# React Quick Reference - NotThisDate

## File Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.jsx
│   ├── DatePicker.jsx
│   └── Modal.jsx
├── pages/              # Route pages
│   ├── LandingPage.jsx
│   └── CalendarPage.jsx
├── context/            # Global state
│   ├── AuthContext.jsx
│   └── LanguageContext.jsx
├── hooks/              # Custom hooks
│   └── useCalendar.js
├── utils/              # Helper functions
│   └── dateUtils.js
├── styles/             # CSS
│   └── index.css
├── App.jsx             # Main app + routing
└── index.jsx           # Entry point
```

## Component Cheat Sheet

### Basic Component
```jsx
import React from 'react';

function ComponentName({ prop1, prop2 }) {
  return (
    <div className="component-name">
      <h1>{prop1}</h1>
      <p>{prop2}</p>
    </div>
  );
}

export default ComponentName;
```

### Component with State
```jsx
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### Component with Effect
```jsx
import React, { useState, useEffect } from 'react';

function DataLoader({ id }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch(`/api/data/${id}`)
      .then(res => res.json())
      .then(setData);
  }, [id]); // Re-run when id changes
  
  return <div>{data?.name}</div>;
}
```

### Form Handling
```jsx
function Form() {
  const [value, setValue] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', value);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Conditional Rendering
```jsx
function User({ user, loading }) {
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>No user</div>;
  return <div>Hello {user.name}!</div>;
}
```

### List Rendering
```jsx
function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### Custom Hook
```jsx
// hooks/useWindowSize.js
import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}

// Usage
function MyComponent() {
  const { width } = useWindowSize();
  return <div>Window width: {width}px</div>;
}
```

### Context Provider
```jsx
// context/ThemeContext.jsx
import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Usage in index.jsx
<ThemeProvider>
  <App />
</ThemeProvider>

// Usage in component
function MyComponent() {
  const { theme, setTheme } = useTheme();
  return <button onClick={() => setTheme('dark')}>Toggle</button>;
}
```

## Common Patterns

### Loading States
```jsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

### Debounced Input
```jsx
import { useState, useEffect } from 'react';

function SearchInput() {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [value]);
  
  useEffect(() => {
    if (debouncedValue) {
      // Perform search
      console.log('Searching for:', debouncedValue);
    }
  }, [debouncedValue]);
  
  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

### Modal Pattern
```jsx
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}
```

### Tabs Pattern
```jsx
function Tabs() {
  const [active, setActive] = useState('tab1');
  
  return (
    <>
      <div className="tabs">
        <button 
          className={active === 'tab1' ? 'active' : ''}
          onClick={() => setActive('tab1')}
        >
          Tab 1
        </button>
        <button 
          className={active === 'tab2' ? 'active' : ''}
          onClick={() => setActive('tab2')}
        >
          Tab 2
        </button>
      </div>
      
      <div className="tab-content">
        {active === 'tab1' && <Tab1 />}
        {active === 'tab2' && <Tab2 />}
      </div>
    </>
  );
}
```

## React Router

### Setup (index.jsx)
```jsx
import { BrowserRouter } from 'react-router-dom';

<BrowserRouter>
  <App />
</BrowserRouter>
```

### Routes (App.jsx)
```jsx
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/c/:id" element={<Calendar />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

### Navigation
```jsx
import { Link, useNavigate } from 'react-router-dom';

function Nav() {
  const navigate = useNavigate();
  
  return (
    <nav>
      <Link to="/">Home</Link>
      <button onClick={() => navigate('/about')}>About</button>
    </nav>
  );
}
```

### URL Parameters
```jsx
import { useParams } from 'react-router-dom';

function CalendarPage() {
  const { id } = useParams(); // From /c/:id
  return <div>Calendar ID: {id}</div>;
}
```

## Styling

### CSS Classes
```jsx
// Static class
<div className="card">Content</div>

// Dynamic class
<div className={`btn ${isActive ? 'active' : ''}`}>Button</div>

// Multiple conditions
<div className={`
  card 
  ${isActive ? 'active' : ''} 
  ${isLarge ? 'large' : 'small'}
`}>
  Content
</div>
```

### Inline Styles
```jsx
<div style={{ 
  color: 'blue', 
  fontSize: '16px',
  backgroundColor: isActive ? 'green' : 'gray'
}}>
  Content
</div>
```

## API Calls

### GET Request
```jsx
useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .catch(setError);
}, []);
```

### POST Request
```jsx
const handleSubmit = async () => {
  try {
    const response = await fetch('/api/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### With Auth Headers
```jsx
const { getAuthHeaders } = useAuth();

const fetchData = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/protected', { headers });
  return response.json();
};
```

## Common Hooks

| Hook | Purpose | Example |
|------|---------|---------|
| `useState` | Local state | `const [count, setCount] = useState(0)` |
| `useEffect` | Side effects | `useEffect(() => { ... }, [deps])` |
| `useContext` | Access context | `const value = useContext(MyContext)` |
| `useRef` | DOM reference | `const ref = useRef(null)` |
| `useMemo` | Memoize value | `const value = useMemo(() => compute(), [dep])` |
| `useCallback` | Memoize function | `const fn = useCallback(() => { ... }, [dep])` |
| `useParams` | URL params | `const { id } = useParams()` |
| `useNavigate` | Programmatic nav | `const navigate = useNavigate()` |

## Tips

1. **Always use keys** in lists: `<li key={item.id}>`
2. **Destructure props**: `function Card({ title, body })` not `function Card(props)`
3. **Use fragments**: `<>...</>` instead of `<div>` when not needed
4. **Extract logic**: Move complex logic to custom hooks
5. **Clean up effects**: Return cleanup function from `useEffect`
6. **Avoid inline functions**: Use `useCallback` for event handlers passed as props
7. **Name components**: Use PascalCase (e.g., `UserProfile`, not `userProfile`)
8. **One component per file**: Keep files focused and small

## Dev Commands

```bash
npm run dev          # Start dev server (port 8888)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
```

## File Naming

- Components: `PascalCase.jsx` (e.g., `DatePicker.jsx`)
- Hooks: `camelCase.js` with `use` prefix (e.g., `useCalendar.js`)
- Utils: `camelCase.js` (e.g., `dateUtils.js`)
- Context: `PascalCase Context.jsx` (e.g., `AuthContext.jsx`)
- Pages: `PascalCase Page.jsx` (e.g., `CalendarPage.jsx`)

