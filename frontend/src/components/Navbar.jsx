import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">m2c</Link>
        <span className="navbar-tagline">Meeting to Code</span>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Dashboard</Link>
        </li>
        <li>
          <Link to="/new">New Meeting</Link>
        </li>
      </ul>
    </nav>
  );
}
