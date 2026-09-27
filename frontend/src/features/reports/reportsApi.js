import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const reportsApi = createApi({
  reducerPath: 'reportsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/reports`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Reports'],
  endpoints: (builder) => ({
    getDailyReport: builder.query({
      query: (params) => ({ url: '/daily', params }),
      providesTags: ['Reports'],
    }),
    getAdminStats: builder.query({
      query: () => '/stats',
      providesTags: ['Reports'],
    }),
  }),
});

export const { useGetDailyReportQuery, useGetAdminStatsQuery } = reportsApi;

export {
  exportAttendancePDF,
  exportAttendanceExcel,
  downloadAttendanceReport,
} from './reportsExport';
