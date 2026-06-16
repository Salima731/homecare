import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../features/auth/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5005/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result?.error?.status === 401) {
    console.log('🔄 Access token expired, attempting refresh...');
    
    // Try to get a new token
    const refreshResult = await baseQuery('/auth/refresh-token', api, extraOptions);
    
    if (refreshResult?.data) {
      const user = api.getState().auth.user;
      const newToken = refreshResult.data.data.accessToken;
      
      // Store the new token
      api.dispatch(setCredentials({ user, token: newToken }));
      
      // Retry the original query with the new token
      result = await baseQuery(args, api, extraOptions);
      console.log('✅ Token refreshed and request retried');
    } else {
      console.log('❌ Refresh failed, logging out...');
      api.dispatch(logOut());
    }
  }

  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Agency',
    'Caregiver',
    'Booking',
    'Payment',
    'Review',
    'Complaint',
    'Notification',
    'Admin',
    'Schedule',
    'HealthLog',
    'HealthTrends',
    'HealthSummary',
    'HealthProfile',
    'CaregiverPatients',
    'Doctor',
    'Appointment',
    'Prescription',
    'CareReport',
    'Family',
    'FamilyDashboard',
    'Patient',
    'Medication',
    'Attendance',
    'Emergency',
    'Hospital',
    'Department',
    'Referral',
    'HospitalAnalytics',
    'MedicalRecord',
    'EmergencyAlert',
  ],
  endpoints: (builder) => ({}),
});
