import { apiSlice } from '../../api/apiSlice';

export const hospitalApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHospitalProfile: builder.query({
      query: () => '/hospitals/my/profile',
      providesTags: ['Hospital'],
    }),
    updateHospitalProfile: builder.mutation({
      query: (data) => ({
        url: `/hospitals/${data.id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Hospital'],
    }),
    getHospitalReferrals: builder.query({
      query: (params) => ({
        url: '/referrals',
        params, // e.g. { hospitalId: ... } or the backend infers it
      }),
      providesTags: ['Referral'],
    }),
    createReferral: builder.mutation({
      query: (data) => ({
        url: '/referrals',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Referral'],
    }),
    getHospitalPatients: builder.query({
      query: (params) => ({
        url: '/patients',
        params,
      }),
      providesTags: ['Patient'],
    }),
    searchPatients: builder.query({
      query: (params) => ({
        url: '/patients/search',
        params,
      }),
    }),
    getHospitalDoctors: builder.query({
      query: (params) => ({
        url: '/doctors/my',
        params,
      }),
      providesTags: ['Doctor'],
    }),
    getHospitalDepartments: builder.query({
      query: (params) => ({
        url: '/departments/my',
        params,
      }),
      providesTags: ['Department'],
    }),
    getHospitalEmergencies: builder.query({
      query: (params) => ({
        url: '/emergency',
        params,
      }),
      providesTags: ['Emergency'],
    }),
    getHospitalAnalytics: builder.query({
      query: () => '/hospitals/my/analytics',
      providesTags: ['HospitalAnalytics'],
    }),
    createDepartment: builder.mutation({
      query: (data) => ({
        url: '/departments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Department'],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Department'],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Department'],
    }),
    getPatientById: builder.query({
      query: (id) => `/patients/${id}`,
      providesTags: ['Patient'],
    }),
    addDoctor: builder.mutation({
      query: (data) => ({
        url: '/doctors',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Doctor'],
    }),
    updateDoctor: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/doctors/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Doctor'],
    }),
    deleteDoctor: builder.mutation({
      query: (id) => ({
        url: `/doctors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Doctor'],
    }),
    admitPatient: builder.mutation({
      query: (patientId) => ({
        url: `/hospitals/admit/${patientId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Patient', 'HospitalAnalytics'],
    }),
  }),
});

export const {
  useGetHospitalProfileQuery,
  useUpdateHospitalProfileMutation,
  useGetHospitalReferralsQuery,
  useCreateReferralMutation,
  useGetHospitalPatientsQuery,
  useSearchPatientsQuery,
  useLazySearchPatientsQuery,
  useGetHospitalDoctorsQuery,
  useGetHospitalDepartmentsQuery,
  useGetHospitalEmergenciesQuery,
  useGetHospitalAnalyticsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetPatientByIdQuery,
  useAddDoctorMutation,
  useUpdateDoctorMutation,
  useDeleteDoctorMutation,
  useAdmitPatientMutation,
} = hospitalApiSlice;
