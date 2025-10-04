import React from 'react';
import '../styles/StaticPages.css';

const Why = () => {
  return (
    <div className="static-page container">
      <div className="hero">
        <h1>Pourquoi nous ?</h1>
        <p>Découvrez ce qui nous distingue et pourquoi des milliers de clients nous font confiance.</p>
      </div>

      <div className="features">
        <div className="feature">
          <h3>Qualité garantie</h3>
          <p>Nos produits sont soigneusement sélectionnés et testés pour assurer la meilleure qualité.</p>
        </div>
        <div className="feature">
          <h3>Livraison rapide</h3>
          <p>Expédition rapide avec suivi en temps réel pour que vous receviez vos articles rapidement.</p>
        </div>
        <div className="feature">
          <h3>Service client</h3>
          <p>Notre équipe est disponible pour vous aider 7 jours sur 7.</p>
        </div>
      </div>
    </div>
  );
}

export default Why;
