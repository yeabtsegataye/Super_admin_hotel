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
      if (response) {
        dispatch(setCredentials(response));
      } else {
        dispatch(logOut());
      }
    } catch (error) {
      dispatch(logOut());
    }
  };
  return refreshAccessToken;
};

export default useRefreshToken;
