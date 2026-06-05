import { apiSlice } from '../../api/apiSlice';

export const prescriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPrescription: builder.mutation({
      query: (data) => ({
        url: '/prescriptions',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Prescription'],
    }),
    getPatientPrescriptions: builder.query({
      query: (patientId) => `/prescriptions/patient/${patientId}`,
      providesTags: ['Prescription'],
    }),
    getPrescriptionById: builder.query({
      query: (id) => `/prescriptions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Prescription', id }],
    }),
    updatePrescription: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/prescriptions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Prescription'],
    }),
    getHospitalPrescriptions: builder.query({
      query: (params) => ({
        url: '/prescriptions/hospital',
        params,
      }),
      providesTags: ['Prescription'],
    }),
    getMyPrescriptions: builder.query({
      query: () => '/prescriptions/me',
      providesTags: ['Prescription'],
    }),
  }),
});

export const {
  useCreatePrescriptionMutation,
  useGetPatientPrescriptionsQuery,
  useGetPrescriptionByIdQuery,
  useUpdatePrescriptionMutation,
  useGetHospitalPrescriptionsQuery,
  useGetMyPrescriptionsQuery,
} = prescriptionApiSlice;
