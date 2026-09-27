import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const settingsApi = createApi({
  reducerPath: 'settingsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/settings`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getGeofenceSettings: builder.query({
      query: () => '/geofence',
      providesTags: ['Settings'],
    }),
    updateGeofenceSettings: builder.mutation({
      query: (body) => ({
        url: '/geofence',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetGeofenceSettingsQuery, useUpdateGeofenceSettingsMutation } = settingsApi;
