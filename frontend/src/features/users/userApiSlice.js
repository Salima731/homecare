import { apiSlice } from '../../api/apiSlice';

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: () => '/users/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    updatePassword: builder.mutation({
      query: (data) => ({
        url: '/users/change-password',
        method: 'PUT',
        body: data,
      }),
    }),
    updateNotificationSettings: builder.mutation({
      query: (settings) => ({
        url: '/users/notification-settings',
        method: 'PUT',
        body: { settings },
      }),
      invalidatesTags: ['User'],
    }),
    getDashboardStats: builder.query({
      query: () => '/users/dashboard',
    }),
    getFavorites: builder.query({
      query: () => '/users/favorites',
      providesTags: ['User', 'Caregiver'],
    }),
    toggleFavorite: builder.mutation({
      query: (caregiverId) => ({
        url: '/users/favorites',
        method: 'POST',
        body: { caregiverId },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useUpdateNotificationSettingsMutation,
  useGetDashboardStatsQuery,
  useGetFavoritesQuery,
  useToggleFavoriteMutation,
} = userApiSlice;
