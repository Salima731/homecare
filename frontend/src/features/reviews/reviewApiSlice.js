import { apiSlice } from '../../api/apiSlice';

export const reviewApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createReview: builder.mutation({
      query: (data) => ({
        url: '/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Review', 'Caregiver'],
    }),
    getCaregiverReviews: builder.query({
      query: (caregiverId) => `/reviews/caregiver/${caregiverId}`,
      providesTags: (result, error, caregiverId) => [
        { type: 'Review', id: caregiverId },
        'Review',
      ],
      refetchOnMountOrArgChange: true,
    }),
  }),
});

export const {
  useCreateReviewMutation,
  useGetCaregiverReviewsQuery,
} = reviewApiSlice;
