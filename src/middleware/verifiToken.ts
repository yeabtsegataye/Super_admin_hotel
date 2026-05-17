import axios from "axios";
import { logOut } from "../features/auth/authSlice";

const VITE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const verifyToken = async (token: string | null, dispatch: any, refresh: () => Promise<void>) => {
  if (token) {
    const url = `${VITE_API_URL}/auth/verify-token`;
    const config = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      withCredentials: true,
    };

    try {
      const response = await axios.post(url, {}, config);
      return response.data.verified;
    } catch (error: any) {
      console.log(error.response?.data?.statusCode);
      if (error.response?.data?.statusCode === 403) {
        await refresh();
        return true;
      } else {
        dispatch(logOut());
        throw error;
      }
    }
  } else {
    return false;
  }
};

export default verifyToken;