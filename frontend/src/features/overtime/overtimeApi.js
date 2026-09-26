import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const overtimeApi = createApi({
  reducerPath: 'overtimeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/overtime`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Overtime'],
  endpoints: (builder) => ({
    getMyOvertime: builder.query({
      query: (params) => ({ url: '/my', params }),
      providesTags: ['Overtime'],
    }),
    getPendingOvertime: builder.query({
      query: (params) => ({ url: '/pending', params }),
      providesTags: ['Overtime'],
    }),
    requestOvertime: builder.mutation({
      query: (body) => ({ url: '/', method: 'POST', body }),
      invalidatesTags: ['Overtime'],
    }),
    approveOvertime: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/${id}/approve`, method: 'PATCH', body }),
      invalidatesTags: ['Overtime'],
    }),
    rejectOvertime: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/${id}/reject`, method: 'PATCH', body }),
      invalidatesTags: ['Overtime'],
    }),
  }),
});

export const {
  useGetMyOvertimeQuery,
  useGetPendingOvertimeQuery,
  useRequestOvertimeMutation,
  useApproveOvertimeMutation,
  useRejectOvertimeMutation,
} = overtimeApi;
