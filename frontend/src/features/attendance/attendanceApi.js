import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/attendance`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Attendance', 'TodayAttendance'],
  endpoints: (builder) => ({
    getTodayAttendance: builder.query({
      query: () => '/today',
      providesTags: ['TodayAttendance', 'Attendance'],
    }),
    getMyAttendance: builder.query({
      query: (params) => ({ url: '/my', params }),
      providesTags: ['Attendance'],
    }),
    getTeamAttendance: builder.query({
      query: (params) => ({ url: '/team', params }),
      providesTags: ['Attendance'],
    }),
    getAllAttendance: builder.query({
      query: (params) => ({ url: '/all', params }),
      providesTags: ['Attendance'],
    }),
    punchIn: builder.mutation({
      query: (body) => ({ url: '/punch-in', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'TodayAttendance'],
    }),
    punchOut: builder.mutation({
      query: (body) => ({ url: '/punch-out', method: 'POST', body }),
      invalidatesTags: ['Attendance', 'TodayAttendance'],
    }),
    validateAttendance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/${id}/validate`, method: 'PATCH', body }),
      invalidatesTags: ['Attendance'],
    }),
  }),
});

export const {
  useGetTodayAttendanceQuery,
  useGetMyAttendanceQuery,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useValidateAttendanceMutation,
} = attendanceApi;
