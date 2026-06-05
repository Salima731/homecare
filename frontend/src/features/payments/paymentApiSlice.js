import { apiSlice } from '../../api/apiSlice';

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createRazorpayOrder: builder.mutation({
      query: (data) => ({
        url: '/payments/create-order',
        method: 'POST',
        body: data,
      }),
    }),
    verifyRazorpayPayment: builder.mutation({
      query: (data) => ({
        url: '/payments/verify',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payment', 'Booking'],
    }),
    getPayments: builder.query({
      query: (params) => ({
        url: '/payments/my',
        params,
      }),
      providesTags: ['Payment'],
    }),
  }),
});

export const {
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
  useGetPaymentsQuery,
} = paymentApiSlice;
