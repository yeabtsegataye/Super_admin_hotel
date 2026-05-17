// hooks/useRefreshToken.ts
import { useDispatch } from "react-redux";
import { setCredentials, logOut } from "../features/auth/authSlice";
import { useRefreshMutation } from "../features/auth/authApiSlice.js";

const useRefreshToken = () => {
  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();

  const refreshAccessToken = async () => {
    try {
      const response = await refresh().unwrap();
      console.log("New access token received:", response);
      
      if (response?.accessToken) {
        dispatch(setCredentials({ token: response.accessToken, user: response.payload }));
        return response; // Return the response for chaining
      } else {
        dispatch(logOut());
        throw new Error('No access token in response');
      }
    } catch (error) {
      console.error('Refresh token failed:', error);
      dispatch(logOut());
      throw error;
    }
  };
  
  return refreshAccessToken;
};

export default useRefreshToken;