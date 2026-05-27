# Building React Components - Complete Guide

## Setup Complete ✅

Your React migration is now set up with:

1. **Vite Build Tool** - Modern, fast build system
2. **React Router** - Client-side routing 
3. **Flatpickr** - Date picker library
4. **Context Providers** - For authentication and i18n
5. **Component Structure** - Reusable React components

## Running the Project

### Development Mode
```bash
npm run dev
```
This starts Vite dev server at `http://localhost:8888` with hot reload.

### Production Build
```bash
npm run build
```
Creates optimized build in `dist/` folder.

### Preview Production
```bash
npm run preview
```
Preview the production build locally.

## Component Architecture Guide

### 1. **Component Patterns**

#### Functional Components with Hooks
```jsx
import React, { useState, useEffect } from 'react';

function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects here
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  return (
    <div className="my-component">
      {/* JSX here */}
    </div>
  );
}

export default MyComponent;
```

#### Custom Hooks Pattern
```jsx
// hooks/useMyFeature.js
import { useState, useEffect } from 'react';

export function useMyFeature(param) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/endpoint?param=${param}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (param) {
      fetchData();
    }
  }, [param]);
  
  return { data, loading, error };
}
```

### 2. **Context Provider Pattern**

```jsx
// context/MyContext.jsx
import React, { createContext, useContext, useState } from 'react';

const MyContext = createContext(null);

export function MyProvider({ children }) {
  const [state, setState] = useState(initialValue);
  
  const someMethod = () => {
    // Do something
  };
  
  const value = {
    state,
    setState,
    someMethod
  };
  
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

### 3. **Form Handling Pattern**

```jsx
function FormComponent() {
  const [formData, setFormData] = useState({
    field1: '',
    field2: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    if (!formData.field1) {
      newErrors.field1 = 'Field 1 is required';
    }
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setSubmitting(true);
    try {
      await submitData(formData);
      // Success handling
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="field1"
        value={formData.field1}
        onChange={handleChange}
      />
      {errors.field1 && <span className="error">{errors.field1}</span>}
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### 4. **List Rendering Pattern**

```jsx
function ListComponent({ items }) {
  if (items.length === 0) {
    return <div className="empty-state">No items found</div>;
  }
  
  return (
    <div className="list">
      {items.map((item) => (
        <ItemComponent 
          key={item.id}  // Always use unique key
          item={item}
        />
      ))}
    </div>
  );
}
```

### 5. **Conditional Rendering Pattern**

```jsx
function ConditionalComponent({ user, loading, error }) {
  // Loading state
  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="error-state">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  // No data state
  if (!user) {
    return <div className="empty-state">No user found</div>;
  }
  
  // Success state
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

### 6. **Event Handling Pattern**

```jsx
function EventComponent() {
  const handleClick = (e) => {
    e.preventDefault();  // Prevent default if needed
    e.stopPropagation();  // Stop event bubbling if needed
    // Handle click
  };
  
  const handleClickWithParam = (id) => {
    return (e) => {
      // Handle click with parameter
      console.log('Clicked item:', id);
    };
  };
  
  return (
    <div>
      <button onClick={handleClick}>Click Me</button>
      
      {items.map(item => (
        <button
          key={item.id}
          onClick={handleClickWithParam(item.id)}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
}
```

### 7. **Modal/Dialog Pattern**

```jsx
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// Usage
function ParentComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="My Modal"
      >
        <p>Modal content here</p>
      </Modal>
    </>
  );
}
```

### 8. **Tabs Pattern**

```jsx
function TabbedComponent() {
  const [activeTab, setActiveTab] = useState('tab1');
  
  const tabs = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3' }
  ];
  
  return (
    <div className="tabbed-component">
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="tab-content">
        {activeTab === 'tab1' && <Tab1Content />}
        {activeTab === 'tab2' && <Tab2Content />}
        {activeTab === 'tab3' && <Tab3Content />}
      </div>
    </div>
  );
}
```

### 9. **Data Fetching with useEffect**

```jsx
function DataFetchingComponent({ id }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let isMounted = true;  // Prevent state updates if unmounted
    
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/data/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    if (id) {
      fetchData();
    }
    
    return () => {
      isMounted = false;  // Cleanup
    };
  }, [id]);  // Re-fetch when id changes
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;
  
  return <div>{/* Render data */}</div>;
}
```

### 10. **Ref Pattern (for DOM access)**

```jsx
import { useRef, useEffect } from 'react';

function RefComponent() {
  const inputRef = useRef(null);
  const divRef = useRef(null);
  
  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
    
    // Access DOM element
    console.log('Div height:', divRef.current?.offsetHeight);
  }, []);
  
  const handleClick = () => {
    // Programmatically focus input
    inputRef.current?.focus();
  };
  
  return (
    <div ref={divRef}>
      <input ref={inputRef} type="text" />
      <button onClick={handleClick}>Focus Input</button>
    </div>
  );
}
```

## Best Practices

### 1. **Component Organization**
- One component per file
- Use meaningful component names (PascalCase)
- Keep components small and focused
- Extract reusable logic into custom hooks

### 2. **State Management**
- Use `useState` for local component state
- Use Context for global state that doesn't change often
- Consider state management library (Redux, Zustand) for complex apps
- Lift state up when multiple components need it

### 3. **Props**
- Destructure props in function signature
- Use PropTypes or TypeScript for type checking
- Keep prop names descriptive
- Use default props when appropriate

```jsx
function MyComponent({ 
  title = 'Default Title',
  onSave, 
  data,
  isLoading = false 
}) {
  // Component logic
}
```

### 4. **Performance**
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for memoized callbacks
- Avoid inline function definitions in render

```jsx
import React, { useMemo, useCallback } from 'react';

const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveOperation(item));
  }, [data]);
  
  const handleClick = useCallback(() => {
    // Handle click
  }, [/* dependencies */]);
  
  return <div onClick={handleClick}>{/* render */}</div>;
});
```

### 5. **Error Handling**
```jsx
function SafeComponent() {
  const [error, setError] = useState(null);
  
  const handleError = (err) => {
    setError(err.message);
    // Log to error tracking service
    console.error(err);
  };
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => setError(null)} />;
  }
  
  return <div>{/* Normal content */}</div>;
}
```

## Project-Specific Examples

### Creating a Calendar Component

```jsx
// components/CalendarCreationForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from './DatePicker';
import ParticipantsList from './ParticipantsList';

function CalendarCreationForm({ onSuccess }) {
  const { getAuthHeaders } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    participants: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/.netlify/functions/create-calendar', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create calendar');
      }
      
      const result = await response.json();
      onSuccess(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="calendar-form">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        placeholder="Calendar Name"
        required
      />
      
      <textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Description"
      />
      
      <DatePicker
        startDate={formData.startDate}
        endDate={formData.endDate}
        onDateChange={(start, end) => {
          setFormData(prev => ({ ...prev, startDate: start, endDate: end }));
        }}
      />
      
      <ParticipantsList
        participants={formData.participants}
        onChange={(participants) => {
          setFormData(prev => ({ ...prev, participants }));
        }}
      />
      
      {error && <div className="error-message">{error}</div>}
      
      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? 'Creating...' : 'Create Calendar'}
      </button>
    </form>
  );
}

export default CalendarCreationForm;
```

## Next Steps

1. **Test the build**: Run `npm run dev` and visit `http://localhost:8888`
2. **Create more components**: Build out the DatePicker, AvailabilityView, etc.
3. **Add styling**: Customize `src/styles/index.css` with component-specific styles
4. **Add routing**: Update `App.jsx` with more routes
5. **Add error boundaries**: Wrap components in error boundaries
6. **Add tests**: Create test files in `tests/` directory

## Resources

- [React Docs](https://react.dev/)
- [Vite Guide](https://vite.dev/guide/)
- [React Router](https://reactrouter.com/)
- [Flatpickr](https://flatpickr.js.org/)

