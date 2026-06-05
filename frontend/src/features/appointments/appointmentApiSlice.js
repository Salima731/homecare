import { apiSlice } from '../../api/apiSlice';

export const appointmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createAppointment: builder.mutation({
      query: (data) => ({
        url: '/appointments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Appointment'],
    }),
    getMyAppointments: builder.query({
      query: (params) => ({
        url: '/appointments',
        params,
      }),
      providesTags: ['Appointment'],
    }),
    getAppointmentById: builder.query({
      query: (id) => `/appointments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Appointment', id }],
    }),
    updateAppointmentStatus: builder.mutation({
      query: ({ id, status, notes }) => ({
        url: `/appointments/${id}/status`,
        method: 'PUT',
        body: { status, notes },
      }),
      invalidatesTags: ['Appointment'],
    }),
    cancelAppointment: builder.mutation({
      query: (id) => ({
        url: `/appointments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Appointment'],
    }),
    getHospitalAppointments: builder.query({
      query: (params) => ({
        url: '/appointments/hospital',
        params,
      }),
      providesTags: ['Appointment'],
    }),
    getAdminAppointments: builder.query({
      query: (params) => ({
        url: '/admin/appointments',
        params,
      }),
      providesTags: ['Appointment'],
    }),
  }),
});

export const {
  useCreateAppointmentMutation,
  useGetMyAppointmentsQuery,
  useGetAppointmentByIdQuery,
  useUpdateAppointmentStatusMutation,
  useCancelAppointmentMutation,
  useGetHospitalAppointmentsQuery,
  useGetAdminAppointmentsQuery,
} = appointmentApiSlice;
