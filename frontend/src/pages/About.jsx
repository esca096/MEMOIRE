import React from 'react';
import '../styles/StaticPages.css';

const About = () => {
  return (
    <div className="static-page container">
      <div className="hero">
        <h1>À propos</h1>
        <p>Apprenez-en davantage sur notre mission, notre histoire et notre équipe.</p>
      </div>

      <section>
        <h2>Notre histoire</h2>
        <p>Fondée en 2024, notre boutique a pour objectif de proposer des produits technologiques abordables et de qualité.</p>
      </section>

      <section>
        <h2>Notre équipe</h2>
        <p>Une petite équipe dédiée composée d'experts en produit et service client.</p>
      </section>
    </div>
  );
}

export default About;
