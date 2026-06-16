import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import RaiseEmergencyModal from '../../components/dashboard/RaiseEmergencyModal';
import { useRaiseAlertMutation } from '../../features/emergencyAlerts/emergencyAlertApiSlice';
import { toast } from 'react-hot-toast';

// Mock framer-motion to avoid jsdom rendering/animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => {
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
  };
  return {
    default: mockToast,
    toast: mockToast,
  };
});

// Mock loading spinner
vi.mock('../../components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock the API slice hooks
vi.mock('../../features/emergencyAlerts/emergencyAlertApiSlice', () => {
  const raiseAlertMock = vi.fn().mockImplementation(() => ({
    unwrap: vi.fn().mockResolvedValue({ success: true, data: {} }),
  }));
  return {
    useRaiseAlertMutation: vi.fn(() => [raiseAlertMock, { isLoading: false }]),
  };
});

describe('RaiseEmergencyModal Component', () => {
  const mockClose = vi.fn();
  const mockBooking = {
    _id: 'booking_1234567890abcdef',
    status: 'ongoing',
    user: {
      name: 'John Doe',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not render if isOpen is false or booking is missing', () => {
    const { container } = render(
      <RaiseEmergencyModal isOpen={false} onClose={mockClose} booking={mockBooking} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders modal when isOpen is true and booking is provided', () => {
    render(
      <RaiseEmergencyModal isOpen={true} onClose={mockClose} booking={mockBooking} />
    );

    expect(screen.getByText(/Raise Emergency Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/For Booking #abcdef/i)).toBeInTheDocument();
    expect(screen.getByText(/Patient: John Doe/i)).toBeInTheDocument();
  });

  test('renders all emergency type options and allows selection', () => {
    render(
      <RaiseEmergencyModal isOpen={true} onClose={mockClose} booking={mockBooking} />
    );

    const medicalButton = screen.getByRole('button', { name: 'Medical Emergency' });
    expect(medicalButton).toBeInTheDocument();
    // Default selected should be Medical Emergency (based on component state)
    expect(medicalButton.className).toContain('border-red-500');

    // Click another alert type
    const fallButton = screen.getByRole('button', { name: 'Fall Incident' });
    fireEvent.click(fallButton);

    // Verify it updates styled selection class
    expect(fallButton.className).toContain('border-red-500');
  });

  test('renders severity levels and updates active selection', () => {
    render(
      <RaiseEmergencyModal isOpen={true} onClose={mockClose} booking={mockBooking} />
    );

    const highBtn = screen.getByRole('button', { name: 'High' });
    fireEvent.click(highBtn);
    expect(highBtn.className).toContain('border-orange-500');
  });

  test('shows toast warning when description is empty and form is submitted', async () => {
    render(
      <RaiseEmergencyModal isOpen={true} onClose={mockClose} booking={mockBooking} />
    );

    const form = screen.getByRole('button', { name: /Raise Alert/i }).closest('form');
    fireEvent.submit(form);

    expect(toast.error).toHaveBeenCalledWith('Please provide a description of the emergency');
  });

  test('submits form correctly with user selections and closes modal', async () => {
    const [mockRaiseAlert] = useRaiseAlertMutation();

    render(
      <RaiseEmergencyModal isOpen={true} onClose={mockClose} booking={mockBooking} />
    );

    const textarea = screen.getByPlaceholderText(/Describe the situation/i);
    fireEvent.change(textarea, { target: { value: 'Patient collapsed on the floor.' } });

    // Select severity level High
    fireEvent.click(screen.getByRole('button', { name: 'High' }));

    // Select alert type Fall Incident
    fireEvent.click(screen.getByRole('button', { name: 'Fall Incident' }));

    const submitBtn = screen.getByRole('button', { name: /Raise Alert/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockRaiseAlert).toHaveBeenCalledWith({
        bookingId: 'booking_1234567890abcdef',
        alertType: 'Fall Incident',
        severityLevel: 'High',
        description: 'Patient collapsed on the floor.',
      });
      expect(toast.success).toHaveBeenCalledWith('Emergency alert raised successfully! Notifications sent.');
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
