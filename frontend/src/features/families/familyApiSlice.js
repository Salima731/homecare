import { apiSlice } from '../../api/apiSlice';

export const familyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFamilyProfile: builder.query({
      query: () => '/families/profile',
      providesTags: ['Family'],
    }),
    updateFamilyProfile: builder.mutation({
      query: (data) => ({
        url: '/families/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Family'],
    }),
    getFamilyDashboardStats: builder.query({
      query: () => '/families/dashboard-stats',
      providesTags: ['FamilyDashboard', 'Patient', 'Booking', 'Emergency', 'HealthLog', 'Medication'],
    }),
    linkPatient: builder.mutation({
      query: (data) => ({
        url: '/families/link-patient',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Family', 'FamilyDashboard'],
    }),
    generateFamilyAccessCode: builder.mutation({
      query: () => ({
        url: '/families/generate-code',
        method: 'POST',
      }),
      invalidatesTags: ['Patient'],
    }),
    getLinkedPatient: builder.query({
      query: () => '/families/my-patient',
      providesTags: ['Patient'],
    }),
    // ── Patient Profile ────────────────────────────────────────────
    getPatientProfile: builder.query({
      query: () => '/patients/profile',
      providesTags: ['Patient'],
    }),
    updatePatientProfile: builder.mutation({
      query: (data) => ({
        url: '/patients/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Patient'],
    }),
    getPatientById: builder.query({
      query: (id) => `/patients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Patient', id }],
    }),
    // ── Health Logs ────────────────────────────────────────────────
    getFamilyHealthLogs: builder.query({
      query: (patientId) => `/health-logs/patient/${patientId}`,
      providesTags: ['HealthLog'],
    }),
    getFamilyHealthTrends: builder.query({
      query: (patientId) => `/health-logs/trends/${patientId}?days=30`,
      providesTags: ['HealthLog'],
    }),
    // Patient self-log vitals
    logVitals: builder.mutation({
      query: (data) => ({
        url: '/health-logs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['HealthLog'],
    }),
    // Patient's own logs (for LogVitals history view)
    getMyHealthLogs: builder.query({
      query: (patientId) => `/health-logs/patient/${patientId}?limit=10`,
      providesTags: ['HealthLog'],
    }),
    // ── Family sub-queries ─────────────────────────────────────────
    getFamilyMedications: builder.query({
      query: (patientId) => `/medications/patient/${patientId}`,
      providesTags: ['Medication'],
    }),
    getFamilyAttendance: builder.query({
      query: (patientId) => `/attendance/patient/${patientId}`,
      providesTags: ['Attendance'],
    }),
    getFamilyBookings: builder.query({
      query: (patientId) => `/bookings/patient/${patientId}`,
      providesTags: ['Booking'],
    }),
    getFamilyEmergencies: builder.query({
      query: (patientId) => `/emergency/patient/${patientId}`,
      providesTags: ['Emergency'],
    }),
  }),
});

export const {
  useGetFamilyProfileQuery,
  useUpdateFamilyProfileMutation,
  useGetFamilyDashboardStatsQuery,
  useLinkPatientMutation,
  useGenerateFamilyAccessCodeMutation,
  useGetLinkedPatientQuery,
  useGetPatientProfileQuery,
  useUpdatePatientProfileMutation,
  useGetPatientByIdQuery,
  useGetFamilyHealthLogsQuery,
  useGetFamilyHealthTrendsQuery,
  useLogVitalsMutation,
  useGetMyHealthLogsQuery,
  useGetFamilyMedicationsQuery,
  useGetFamilyAttendanceQuery,
  useGetFamilyBookingsQuery,
  useGetFamilyEmergenciesQuery,
} = familyApiSlice;
