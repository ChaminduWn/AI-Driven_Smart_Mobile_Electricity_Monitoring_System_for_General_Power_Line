import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div style={{ width: "200px", padding: "10px" }}>
      <h3>Admin Panel</h3>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/outages">Outages</Link></li>
        <li><Link to="/technicians">Technicians</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
