import React from "react";
import "../styles/Header.css";
import bgwoman from "../assets/bg-woman.jpg";


const Header = () => {
    return (
        <div className="header">
            <img src={bgwoman} alt="Background woman " className="header-bg" />
            <div className="header-content">
                <h1>Bienvenue sur notre site Web</h1> 
                <h3>Achetez chez nous maintenant!</h3>
                <button> Commencer à acheter </button>
            </div>
        </div>
    );
}

export default Header;