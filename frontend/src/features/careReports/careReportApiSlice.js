import { apiSlice } from '../../api/apiSlice';

export const careReportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // POST /api/care-reports  (FormData — supports file attachments)
    createCareReport: builder.mutation({
      query: (formData) => ({
        url: '/care-reports',
        method: 'POST',
        body: formData,
        // Do NOT set Content-Type — browser sets it with correct boundary for FormData
        formData: true,
      }),
      invalidatesTags: ['CareReport'],
    }),

    // GET /api/care-reports/patient/:patientId
    getReportsByPatient: builder.query({
      query: ({ patientId, ...params }) => ({
        url: `/care-reports/patient/${patientId}`,
        params,
      }),
      providesTags: ['CareReport'],
    }),

    // GET /api/care-reports/booking/:bookingId
    getReportsByBooking: builder.query({
      query: ({ bookingId, ...params }) => ({
        url: `/care-reports/booking/${bookingId}`,
        params,
      }),
      providesTags: ['CareReport'],
    }),

    // PUT /api/care-reports/:id
    updateCareReport: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/care-reports/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['CareReport'],
    }),
  }),
});

export const {
  useCreateCareReportMutation,
  useGetReportsByPatientQuery,
  useGetReportsByBookingQuery,
  useUpdateCareReportMutation,
} = careReportApiSlice;
