import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { isTokenValid } from "../utils/jwt";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (isTokenValid(token) && user) {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;