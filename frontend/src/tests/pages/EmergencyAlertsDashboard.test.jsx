import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import EmergencyAlertsDashboard from '../../pages/dashboard/common/EmergencyAlertsDashboard';
import { useGetAlertsQuery } from '../../features/emergencyAlerts/emergencyAlertApiSlice';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Mock react-redux
vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

// Mock loading spinner
vi.mock('../../../src/components/common/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

// Mock the API slice hooks
vi.mock('../../features/emergencyAlerts/emergencyAlertApiSlice', () => ({
  useGetAlertsQuery: vi.fn(),
}));

describe('EmergencyAlertsDashboard Component', () => {
  const mockNavigate = vi.fn();
  const mockRefetch = vi.fn();
  const mockUser = {
    role: 'admin',
    name: 'Admin User',
  };

  const mockAlerts = [
    {
      _id: 'alert1',
      alertType: 'Medical Emergency',
      severityLevel: 'Critical',
      status: 'Open',
      description: 'Patient is having difficulty breathing.',
      createdAt: '2026-06-15T10:00:00.000Z',
      patientId: { name: 'Alice Smith' },
      caregiverId: { name: 'Bob Nurse' },
      agencyId: { name: 'HealthAgency' },
    },
    {
      _id: 'alert2',
      alertType: 'Fall Incident',
      severityLevel: 'Low',
      status: 'Resolved',
      description: 'Patient slipped but is okay now.',
      createdAt: '2026-06-15T09:00:00.000Z',
      patientId: { name: 'Charlie Patient' },
      caregiverId: { name: 'Bob Nurse' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useSelector.mockReturnValue(mockUser);
    useNavigate.mockReturnValue(mockNavigate);
    useGetAlertsQuery.mockReturnValue({
      data: { data: mockAlerts },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    });
  });

  test('renders loading spinner when loading is true', () => {
    useGetAlertsQuery.mockReturnValue({
      data: null,
      isLoading: true,
      isFetching: false,
      refetch: mockRefetch,
    });

    render(<EmergencyAlertsDashboard />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders "All Safe" state when no alerts exist', () => {
    useGetAlertsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    });

    render(<EmergencyAlertsDashboard />);
    expect(screen.getByText(/All Safe/i)).toBeInTheDocument();
    expect(screen.getByText(/No emergency alerts are currently active in the system/i)).toBeInTheDocument();
  });

  test('renders list of alerts correctly with correct details and badges', () => {
    render(<EmergencyAlertsDashboard />);

    expect(screen.getByText('Medical Emergency')).toBeInTheDocument();
    expect(screen.getByText('Patient is having difficulty breathing.')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();

    expect(screen.getByText('Fall Incident')).toBeInTheDocument();
    expect(screen.getByText('Patient slipped but is okay now.')).toBeInTheDocument();
    expect(screen.getByText('Charlie Patient')).toBeInTheDocument();
  });

  test('filters alerts by search term correctly', () => {
    render(<EmergencyAlertsDashboard />);

    const searchInput = screen.getByPlaceholderText(/Search alerts by caregiver/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    // Alice Smith matches medical emergency, Charlie Patient should not be shown
    expect(screen.getByText('Medical Emergency')).toBeInTheDocument();
    expect(screen.queryByText('Fall Incident')).not.toBeInTheDocument();
  });

  test('clears filters when clear button is clicked', () => {
    render(<EmergencyAlertsDashboard />);

    const searchInput = screen.getByPlaceholderText(/Search alerts by caregiver/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    const clearBtn = screen.getByTitle('Clear filters');
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(searchInput.value).toBe('');
    expect(screen.getByText('Fall Incident')).toBeInTheDocument();
  });

  test('navigates to details page when "View Details" is clicked', () => {
    render(<EmergencyAlertsDashboard />);

    const viewDetailsButtons = screen.getAllByRole('button', { name: /View Details/i });
    fireEvent.click(viewDetailsButtons[0]); // first is alert1 (Critical, Open sorted first)

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/admin/emergency-alerts/alert1');
  });

  test('calls refetch when Refresh button is clicked', () => {
    render(<EmergencyAlertsDashboard />);

    const refreshBtn = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshBtn);

    expect(mockRefetch).toHaveBeenCalled();
  });
});
