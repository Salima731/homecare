import { apiSlice } from '../../api/apiSlice';

export const complaintApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getComplaints: builder.query({
      query: (params) => ({
        url: '/complaints',
        params,
      }),
      providesTags: ['Complaint'],
    }),
    getMyComplaints: builder.query({
      query: (params) => ({
        url: '/complaints/my',
        params,
      }),
      providesTags: ['Complaint'],
    }),
    createComplaint: builder.mutation({
      query: (data) => ({
        url: '/complaints',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Complaint'],
    }),
    getComplaintById: builder.query({
      query: (id) => `/complaints/${id}`,
      providesTags: (result, error, id) => [{ type: 'Complaint', id }],
    }),
    updateComplaintStatus: builder.mutation({
      query: ({ id, status, resolution }) => ({
        url: `/complaints/${id}/status`,
        method: 'PATCH',
        body: { status, resolution },
      }),
      invalidatesTags: (result, error, { id }) => ['Complaint', { type: 'Complaint', id }],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useGetMyComplaintsQuery,
  useCreateComplaintMutation,
  useGetComplaintByIdQuery,
  useUpdateComplaintStatusMutation,
} = complaintApiSlice;
