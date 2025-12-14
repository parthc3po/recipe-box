import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RecipeEditor from './RecipeEditor';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the API calls
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}));

// Wrapper for context
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('RecipeEditor', () => {
  it('renders the recipe editor form', () => {
    renderWithProviders(<RecipeEditor />);

    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
  });

  it('allows adding ingredients', () => {
    renderWithProviders(<RecipeEditor />);

    const addBtn = screen.getByText('Add');
    fireEvent.click(addBtn);

    // Check if new input fields appear
    const inputs = screen.getAllByPlaceholderText('Ingredient name');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('updates ingredient values correctly', () => {
    renderWithProviders(<RecipeEditor />);

    // Add an ingredient first
    const addBtn = screen.getByText('Add');
    fireEvent.click(addBtn);

    const nameInput = screen.getByPlaceholderText('Ingredient name');
    fireEvent.change(nameInput, { target: { value: 'chicken' } });
    expect(nameInput).toHaveValue('chicken');

    const qtyInput = screen.getByPlaceholderText('Qty');
    fireEvent.change(qtyInput, { target: { value: '500' } });
    expect(qtyInput).toHaveValue('500');

    const unitInput = screen.getByPlaceholderText('Unit');
    fireEvent.change(unitInput, { target: { value: 'g' } });
    expect(unitInput).toHaveValue('g');
  });
});
