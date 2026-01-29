import { useState, useEffect } from 'react';
import styles from './Particles.module.css';

export function Particles({ particles }) {
  return (
    <>
      {particles.map(p => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: p.x + '%',
            top: p.y + '%',
            color: p.green ? '#0f0' : 'inherit',
            textShadow: p.green ? '0 0 8px #0f0' : 'none',
            fontFamily: p.green ? 'monospace' : 'inherit',
          }}
        >
          {p.emoji}
        </div>
      ))}
    </>
  );
}

export function useParticles() {
  const [particles, setParticles] = useState([]);

  const spawn = (emoji, count, green = false) => {
    const newParticles = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i + Math.random(),
        emoji,
        x: 15 + Math.random() * 70,
        y: 25 + Math.random() * 50,
        green,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
    
    // Remove after animation
    setTimeout(() => {
      setParticles(prev => 
        prev.filter(p => !newParticles.find(np => np.id === p.id))
      );
    }, 1500);
  };

  return { particles, spawn };
}
