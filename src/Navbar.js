import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src="/logo.png" alt="Logo" />
          <span className="brand-name">Universal Skill</span>
        </div>
        <ul className="nav-links">
          <li>FAQ</li>
          <li>Pricing</li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
