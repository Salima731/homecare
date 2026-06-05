import { apiSlice } from '../../api/apiSlice';

export const healthLogApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create health log
    createHealthLog: builder.mutation({
      query: (data) => ({
        url: '/health-logs',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'HealthLog',
        { type: 'HealthLog', id: arg.patientId },
        'HealthTrends',
      ],
    }),

    // Get patient health logs with pagination and filters
    getPatientLogs: builder.query({
      query: ({ patientId, page = 1, limit = 20, startDate, endDate, isAbnormal, sortBy }) => ({
        url: `/health-logs/patient/${patientId}`,
        params: {
          page,
          limit,
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
          ...(isAbnormal !== undefined && { isAbnormal }),
          ...(sortBy && { sortBy }),
        },
      }),
      providesTags: (result, error, arg) => [
        { type: 'HealthLog', id: arg.patientId },
        'HealthLog',
      ],
    }),

    // Get latest health summary (quick dashboard data)
    getLatestHealthSummary: builder.query({
      query: (patientId) => `/health-logs/latest/${patientId}`,
      providesTags: (result, error, patientId) => [
        { type: 'HealthLog', id: patientId },
        'HealthSummary',
      ],
    }),

    // Get vital trends for charting
    getVitalTrends: builder.query({
      query: ({ patientId, days = 30 }) => ({
        url: `/health-logs/trends/${patientId}`,
        params: { days },
      }),
      providesTags: (result, error, arg) => [
        'HealthTrends',
        { type: 'HealthLog', id: arg.patientId },
      ],
    }),

    // Get single health log
    getHealthLogById: builder.query({
      query: (id) => `/health-logs/${id}`,
      providesTags: (result, error, id) => [{ type: 'HealthLog', id }],
    }),

    // Update health log
    updateHealthLog: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/health-logs/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'HealthLog', id: arg.id },
        'HealthLog',
        'HealthTrends',
        'HealthSummary',
      ],
    }),

    // Delete health log (admin only)
    deleteHealthLog: builder.mutation({
      query: (id) => ({
        url: `/health-logs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HealthLog', 'HealthTrends', 'HealthSummary'],
    }),

    // Get caregiver's assigned patients
    getCaregiverPatients: builder.query({
      query: () => '/health-logs/caregiver/patients',
      providesTags: ['CaregiverPatients', 'HealthLog'],
    }),

    // Create/update health profile
    createOrUpdateHealthProfile: builder.mutation({
      query: (data) => ({
        url: '/health-logs/profile',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'HealthProfile', id: arg.patientId },
        'HealthProfile',
      ],
    }),

    // Get health profile
    getHealthProfile: builder.query({
      query: (patientId) => `/health-logs/profile/${patientId}`,
      providesTags: (result, error, patientId) => [
        { type: 'HealthProfile', id: patientId },
        'HealthProfile',
      ],
    }),
  }),
});

export const {
  useCreateHealthLogMutation,
  useGetPatientLogsQuery,
  useGetLatestHealthSummaryQuery,
  useGetVitalTrendsQuery,
  useGetHealthLogByIdQuery,
  useUpdateHealthLogMutation,
  useDeleteHealthLogMutation,
  useGetCaregiverPatientsQuery,
  useCreateOrUpdateHealthProfileMutation,
  useGetHealthProfileQuery,
} = healthLogApiSlice;
