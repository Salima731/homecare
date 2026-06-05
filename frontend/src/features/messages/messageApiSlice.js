import { apiSlice } from '../../api/apiSlice';

export const messageApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query({
      query: () => '/messages/conversations',
      providesTags: ['Message'],
    }),
    getMessages: builder.query({
      query: (otherUserId) => `/messages/${otherUserId}`,
      providesTags: ['Message'],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: '/messages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Message'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
} = messageApiSlice;
