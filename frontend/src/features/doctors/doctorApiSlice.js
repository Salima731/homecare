import { apiSlice } from '../../api/apiSlice';

export const doctorApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPublicDoctors: builder.query({
      query: (params) => ({
        url: '/doctors',
        params,
      }),
      providesTags: ['Doctor'],
    }),
    getDoctorPublicProfile: builder.query({
      query: (id) => `/doctors/${id}`,
      providesTags: (result, error, id) => [{ type: 'Doctor', id }],
    }),
    getMyDoctorProfile: builder.query({
      query: () => '/doctors/me',
      providesTags: ['Doctor'],
    }),
    inviteDoctor: builder.mutation({
      query: ({ id, email, password }) => ({
        url: `/doctors/${id}/invite`,
        method: 'POST',
        body: { email, password },
      }),
      invalidatesTags: ['Doctor'],
    }),
    suspendDoctor: builder.mutation({
      query: (id) => ({
        url: `/doctors/${id}/suspend`,
        method: 'PUT',
      }),
      invalidatesTags: ['Doctor'],
    }),
    getMyPatients: builder.query({
      query: () => '/doctors/me/patients',
      providesTags: ['Patient'],
    }),
    getAdminDoctors: builder.query({
      query: (params) => ({
        url: '/admin/doctors',
        params,
      }),
      providesTags: ['Doctor'],
    }),
  }),
});

export const {
  useGetPublicDoctorsQuery,
  useGetDoctorPublicProfileQuery,
  useGetMyDoctorProfileQuery,
  useInviteDoctorMutation,
  useSuspendDoctorMutation,
  useGetMyPatientsQuery,
  useGetAdminDoctorsQuery,
} = doctorApiSlice;
