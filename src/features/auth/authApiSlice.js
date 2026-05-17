import { apiSlice } from "../../app/api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation({
      query: credentials => ({
        url: '/auth/super_login',
        method: 'POST',
        body: { ...credentials }
      })
    }),
    signup: builder.mutation({
      query: credentials => ({
        url: '/auth/signup',
        method: 'POST',
        body: { ...credentials }
      })
    }),
    refresh: builder.mutation({
      query: () => ({
        url: '/auth/super-refresh-token',
        method: 'POST',
        body: {},
        credentials: 'include'
      })
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/log-out',
        method: 'POST',
        body: {},
        credentials: 'include'
      })
    }),
    verifyToken: builder.mutation({
      query: ({ token }) => ({
        url: '/auth/verify-token',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      })
    }),
    package: builder.mutation({
      query: ({ token }) => ({
        url: '/packeage/get',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include'
      })
    }),
    ////////////////////////////
    sendResetCode: builder.mutation({
      query: (email) => ({
        url: "/auth/send_otp",
        method: "POST",
        body: { email },
      }),
    }),
    resetPassword: builder.mutation({
      query: ({email, otp, newPassword}) => ({
        url: "/auth/reset_password",
        method: "POST",
        body: { email, otp, newPassword },
      }),
    }),
  })
})

export const {
  useLoginMutation,
  useSignupMutation,
  useRefreshMutation,
  useVerifyTokenMutation,
  useLogoutMutation,
  usePackageMutation,
  useSendResetCodeMutation,
  useResetPasswordMutation,
} = authApiSlice;
