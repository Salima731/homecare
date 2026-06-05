import { apiSlice } from '../../api/apiSlice';

export const agencyApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAgencies: builder.query({
      query: (params) => ({
        url: '/agencies',
        params,
      }),
      providesTags: ['Agency'],
    }),
    getAgencyById: builder.query({
      query: (id) => `/agencies/${id}`,
      providesTags: (result, error, id) => [{ type: 'Agency', id }],
    }),
    registerAgency: builder.mutation({
      query: (data) => ({
        url: '/agencies/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Agency'],
    }),
    updateAgency: builder.mutation({
      query: (data) => ({
        url: '/agencies/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Agency'],
    }),
    getAgencyCaregivers: builder.query({
      query: () => '/caregivers/agency/list',
      providesTags: ['Caregiver'],
    }),
    getAgencyStats: builder.query({
      query: () => '/agencies/stats',
      providesTags: ['Agency'],
    }),
    getMyAgency: builder.query({
      query: () => '/agencies/profile',
      providesTags: ['Agency'],
    }),
    verifyCaregiver: builder.mutation({
      query: ({ id, verify }) => ({
        url: `/caregivers/${id}/verify`,
        method: 'PUT',
        body: { verify },
      }),
      invalidatesTags: ['Caregiver'],
    }),
    toggleCaregiverStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/caregivers/${id}/toggle-status`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['Caregiver'],
    }),
    getAgencyEarnings: builder.query({
      query: () => '/agencies/earnings',
      providesTags: ['Payment'],
    }),
    assignCaregiverToBooking: builder.mutation({
      query: ({ bookingId, caregiverId }) => ({
        url: '/agencies/assign-caregiver',
        method: 'PUT',
        body: { bookingId, caregiverId },
      }),
      invalidatesTags: ['Booking', 'Caregiver'],
    }),
    getAgencyReferrals: builder.query({
  query: () => '/agencies/referrals',
  providesTags: ['Referral'],
}),
assignReferralCaregiver: builder.mutation({
  query: ({ referralId, caregiverId }) => ({
    url: `/agencies/${referralId}/assign`,
    method: 'PUT',
    body: { caregiverId },
  }),
  invalidatesTags: ['Referral', 'Booking'],
}),
  }),
});

export const {
  useGetAgenciesQuery,
  useGetAgencyByIdQuery,
  useRegisterAgencyMutation,
  useUpdateAgencyMutation,
  useGetAgencyCaregiversQuery,
  useGetAgencyStatsQuery,
  useGetMyAgencyQuery,
  useVerifyCaregiverMutation,
  useToggleCaregiverStatusMutation,
  useGetAgencyEarningsQuery,
  useAssignCaregiverToBookingMutation,
  useGetAgencyReferralsQuery,
  useAssignReferralCaregiverMutation
} = agencyApiSlice;
