import { apiSlice } from '../../api/apiSlice';

export const bookingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query({
      query: (params) => ({
        url: '/bookings/my',
        params,
      }),
      providesTags: ['Booking'],
    }),
    getAgencyBookings: builder.query({
      query: () => '/bookings/agency',
      providesTags: ['Booking'],
    }),
    getCaregiverBookings: builder.query({
      query: () => '/bookings/caregiver',
      providesTags: ['Booking'],
    }),
    getBookingById: builder.query({
      query: (id) => `/bookings/${id}`,
      providesTags: (result, error, id) => [{ type: 'Booking', id }],
    }),
    createBooking: builder.mutation({
      query: (data) => ({
        url: '/bookings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Booking'],
    }),
    acceptBooking: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}/accept`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => ['Booking', { type: 'Booking', id }],
    }),
    assignCaregiver: builder.mutation({
      query: ({ id, caregiverId }) => ({
        url: `/bookings/${id}/assign`,
        method: 'PUT',
        body: { caregiverId },
      }),
      invalidatesTags: (result, error, { id }) => ['Booking', 'Caregiver', { type: 'Booking', id }],
    }),
    completeBooking: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => ['Booking', { type: 'Booking', id }],
    }),
    cancelBooking: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/bookings/${id}/cancel`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => ['Booking', { type: 'Booking', id }],
    }),
    clockIn: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}/clock-in`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => ['Booking', 'Caregiver'],
    }),
    clockOut: builder.mutation({
      query: ({ id, otp }) => ({
        url: `/bookings/${id}/clock-out`,
        method: 'PUT',
        body: { otp },
      }),
      invalidatesTags: (result, error, { id }) => ['Booking', 'Caregiver', { type: 'Booking', id }],
    }),
  }),
});

export const {
  useGetBookingsQuery,
  useGetAgencyBookingsQuery,
  useGetCaregiverBookingsQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useAcceptBookingMutation,
  useAssignCaregiverMutation,
  useCompleteBookingMutation,
  useCancelBookingMutation,
  useClockInMutation,
  useClockOutMutation,
} = bookingApiSlice;
