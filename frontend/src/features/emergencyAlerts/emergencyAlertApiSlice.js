import { apiSlice } from '../../api/apiSlice';

export const emergencyAlertApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    raiseAlert: builder.mutation({
      query: (data) => ({
        url: '/emergency-alerts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['EmergencyAlert'],
    }),

    getAlerts: builder.query({
      query: (params) => ({
        url: '/emergency-alerts',
        params,
      }),
      providesTags: ['EmergencyAlert'],
    }),

    getAlertById: builder.query({
      query: (id) => `/emergency-alerts/${id}`,
      providesTags: (result, error, id) => [{ type: 'EmergencyAlert', id }],
    }),

    updateAlertStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/emergency-alerts/${id}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        'EmergencyAlert',
        { type: 'EmergencyAlert', id: arg.id },
      ],
    }),
  }),
});

export const {
  useRaiseAlertMutation,
  useGetAlertsQuery,
  useGetAlertByIdQuery,
  useUpdateAlertStatusMutation,
} = emergencyAlertApiSlice;
