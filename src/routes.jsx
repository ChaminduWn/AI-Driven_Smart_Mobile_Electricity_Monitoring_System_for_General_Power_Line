import Dashboard from "./pages/Dashboard";
import Outages from "./pages/Outages";
import Technicians from "./pages/Technicians";

const routes = [
  { path: "/", element: <Dashboard /> },
  { path: "/outages", element: <Outages /> },
  { path: "/technicians", element: <Technicians /> },
];

export default routes;
