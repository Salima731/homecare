import { apiSlice } from "../../api/apiSlice";

export const caregiverApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCaregivers: builder.query({
      query: (params) => ({
        url: "/caregivers/search",
        params,
      }),
      providesTags: ["Caregiver"],
    }),
    getCaregiverById: builder.query({
      query: (id) => `/caregivers/${id}`,
      providesTags: (result, error, id) => [{ type: "Caregiver", id }],
    }),
    registerCaregiver: builder.mutation({
      query: (data) => ({
        url: "/caregivers/profile",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Caregiver"],
    }),
    updateCaregiver: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/caregivers/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Caregiver",
        { type: "Caregiver", id },
      ],
    }),
    updateCaregiverAvailability: builder.mutation({
      query: ({ id, availability }) => ({
        url: `/caregivers/${id}/availability`,
        method: "PATCH",
        body: { availability },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Caregiver", id }],
    }),

    getCaregiverDashboard: builder.query({
      query: () => "/caregivers/dashboard",
      providesTags: ["Caregiver"],
    }),
    addCaregiverByAgency: builder.mutation({
      query: (data) => ({
        url: "/caregivers/agency/add",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Caregiver"],
    }),
    getCaregiverEarnings: builder.query({
      query: () => "/caregivers/earnings",
      providesTags: ["Payment"],
    }),
    getMyReviews: builder.query({
      query: () => "/caregivers/reviews/me",
      providesTags: ["Review"],
    }),
  }),
});

export const {
  useGetCaregiversQuery,
  useGetCaregiverByIdQuery,
  useRegisterCaregiverMutation,
  useUpdateCaregiverMutation,
  useUpdateCaregiverAvailabilityMutation,
  useGetCaregiverDashboardQuery,
  useGetCaregiverEarningsQuery,
  useGetMyReviewsQuery,
  useAddCaregiverByAgencyMutation,
} = caregiverApiSlice;
