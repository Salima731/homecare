import { apiSlice } from '../../api/apiSlice';

export const scheduleApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCaregiverAvailability: builder.query({
      query: (caregiverId) => `/schedules/caregiver/${caregiverId}`,
      providesTags: ['Schedule'],
    }),
    getMySchedule: builder.query({
      query: () => '/schedules/me',
      providesTags: ['Schedule'],
    }),
    setAvailability: builder.mutation({
      query: (data) => ({
        url: '/schedules',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Schedule', 'Caregiver'],
    }),
    deleteSchedule: builder.mutation({
      query: (id) => ({
        url: `/schedules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Schedule'],
    }),
  }),
});

export const {
  useGetCaregiverAvailabilityQuery,
  useGetMyScheduleQuery,
  useSetAvailabilityMutation,
  useDeleteScheduleMutation,
} = scheduleApiSlice;
