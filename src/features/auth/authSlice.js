import { createSlice } from "@reduxjs/toolkit"

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: null, token: null },
    reducers: {
        setCredentials: (state, action) => {
            const { payload, accessToken } = action.payload
            state.user = payload
            state.token = accessToken
            try {
                if (accessToken) {
                    localStorage.setItem('super_admin_token', accessToken)
                }
            } catch (e) {}
        },
        logOut: (state, action) => {
            state.user = null
            state.token = null
            try { localStorage.removeItem('super_admin_token') } catch(e) {}
        }
    },
})

export const { setCredentials, logOut } = authSlice.actions

export default authSlice.reducer

export const selectCurrentUser = (state) => state.auth.user
export const selectCurrentToken = (state) => state.auth.token