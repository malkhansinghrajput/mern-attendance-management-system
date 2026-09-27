import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/users`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getAllUsers: builder.query({
      query: (params) => ({ url: '/', params }),
      providesTags: ['Users'],
    }),
    getTeamUsers: builder.query({
      query: () => '/team',
      providesTags: ['Users'],
    }),
    getUserById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: '/create', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useGetTeamUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserStatusMutation,
} = usersApi;
