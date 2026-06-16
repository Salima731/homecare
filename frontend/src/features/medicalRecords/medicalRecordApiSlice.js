import { apiSlice } from '../../api/apiSlice';

export const medicalRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/medical-records (FormData)
    uploadMedicalRecord: builder.mutation({
      query: (formData) => ({
        url: '/medical-records',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['MedicalRecord'],
    }),

    // GET /api/medical-records/patient/:patientId
    getPatientRecords: builder.query({
      query: ({ patientId, ...params }) => ({
        url: `/medical-records/patient/${patientId}`,
        params,
      }),
      providesTags: ['MedicalRecord'],
    }),

    // GET /api/medical-records/:id
    getRecordById: builder.query({
      query: (id) => `/medical-records/${id}`,
      providesTags: (result, error, id) => [{ type: 'MedicalRecord', id }],
    }),

    // GET /api/medical-records
    getAllRecords: builder.query({
      query: (params) => ({
        url: '/medical-records',
        params,
      }),
      providesTags: ['MedicalRecord'],
    }),

    // PUT /api/medical-records/:id (FormData)
    updateMedicalRecord: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/medical-records/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['MedicalRecord'],
    }),

    // DELETE /api/medical-records/:id
    deleteMedicalRecord: builder.mutation({
      query: (id) => ({
        url: `/medical-records/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MedicalRecord'],
    }),
  }),
});

export const {
  useUploadMedicalRecordMutation,
  useGetPatientRecordsQuery,
  useGetRecordByIdQuery,
  useGetAllRecordsQuery,
  useUpdateMedicalRecordMutation,
  useDeleteMedicalRecordMutation,
} = medicalRecordApiSlice;
