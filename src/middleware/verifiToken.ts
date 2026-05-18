// middleware/verifiToken.ts
import axios from "axios";
import { logOut } from "../features/auth/authSlice.js";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const verifyToken = async (
  token: string | null,
  dispatch: any,
  refresh: (arg?: unknown) => Promise<any>,
) => {
  if (!token) {
    return false;
  }

  const url = `${VITE_API_URL}/auth/verify-token`;
  const config = {
    headers: {
      authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  };

  try {
    const response = await axios.post(url, {}, config);

    // If token is valid
    if (response.data.verified) {
      return true;
    }

    // Try to refresh token if verification failed but not due to token expiration
    if (response.data.statusCode !== 401) {
      try {
        const refreshResult = await refresh(undefined);
        if (refreshResult?.accessToken) {
          return true;
        }
      } catch (refreshError) {
        console.error('Refresh failed:', refreshError);
      }
    }

    return false;
  } catch (error: any) {
    console.log('Token verification error:', error.response?.data);

    // Token expired - try to refresh
    if (error.response?.status === 401 || error.response?.data?.statusCode === 401) {
      try {
        const refreshResult = await refresh(undefined);
        if (refreshResult?.accessToken) {
          return true;
        }
      } catch (refreshError) {
        console.error('Refresh failed:', refreshError);
        dispatch(logOut(undefined));
        return false;
      }
    }

    dispatch(logOut(undefined));
    return false;
  }
};

export default verifyToken;
