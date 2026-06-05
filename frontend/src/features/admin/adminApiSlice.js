import { apiSlice } from '../../api/apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query({
      query: () => '/admin/stats',
      providesTags: ['Admin'],
    }),
    getAllUsers: builder.query({
      query: (params) => ({
        url: '/admin/users',
        params,
      }),
      providesTags: ['User'],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['User'],
    }),
    getPendingVerifications: builder.query({
      query: () => '/admin/pending-verifications',
      providesTags: ['Agency', 'Caregiver'],
    }),
    verifyEntity: builder.mutation({
      query: ({ type, id, status, remarks }) => ({
        url: `/admin/verify/${type}/${id}`,
        method: 'POST',
        body: { status, remarks },
      }),
      invalidatesTags: ['Agency', 'Caregiver'],
    }),
    getPlatformSettings: builder.query({
      query: () => '/admin/settings',
    }),
    updatePlatformSettings: builder.mutation({
      query: (settings) => ({
        url: '/admin/settings',
        method: 'PUT',
        body: settings,
      }),
    }),
    getAgencies: builder.query({
      query: () => '/admin/agencies',
      providesTags: ['Agency'],
    }),
    updateAgencyStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/agencies/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Agency'],
    }),
    getComplaints: builder.query({
      query: (params) => ({
        url: '/admin/complaints',
        params,
      }),
      providesTags: ['Complaint'],
    }),
    updateComplaintStatus: builder.mutation({
      query: ({ id, status, adminNote }) => ({
        url: `/admin/complaints/${id}/status`,
        method: 'PATCH',
        body: { status, adminNote },
      }),
      invalidatesTags: ['Complaint'],
    }),
    getAllBookings: builder.query({
      query: (params) => ({
        url: '/admin/bookings',
        params,
      }),
      providesTags: ['Booking'],
    }),
    getAllPayments: builder.query({
      query: (params) => ({
        url: '/admin/payments',
        params,
      }),
      providesTags: ['Payment'],
    }),
    getHospitals: builder.query({
  query: () => '/admin/hospitals',
  providesTags: ['Hospital'],
}),

updateHospitalStatus: builder.mutation({
  query: ({ id, status }) => ({
    url: `/admin/hospitals/${id}/status`,
    method: 'PATCH',
    body: { status },
  }),
  invalidatesTags: ['Hospital'],
}),

getCaregivers: builder.query({
  query: () => '/admin/caregivers',
  providesTags: ['Caregiver'],
}),

updateCaregiverStatus: builder.mutation({
  query: ({ id, isActive }) => ({
    url: `/admin/caregivers/${id}/status`,
    method: 'PATCH',
    body: { isActive },
  }),
  invalidatesTags: ['Caregiver'],
}),

  }),
});

export const {
  useGetAdminStatsQuery,
  useGetAllUsersQuery,
  useUpdateUserStatusMutation,
  useGetPendingVerificationsQuery,
  useVerifyEntityMutation,
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useGetAgenciesQuery,
  useUpdateAgencyStatusMutation,
  useGetComplaintsQuery,
  useUpdateComplaintStatusMutation,
  useGetAllBookingsQuery,
  useGetAllPaymentsQuery,
  useGetHospitalsQuery,
  useUpdateHospitalStatusMutation,
  useGetCaregiversQuery,
  useUpdateCaregiverStatusMutation
} = adminApiSlice;
