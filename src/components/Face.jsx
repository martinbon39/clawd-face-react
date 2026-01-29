import { forwardRef } from 'react';
import styles from './Face.module.css';

export const Face = forwardRef(({ state, eyeTransform, mouthStyle, faceTransform }, ref) => {
  return (
    <div 
      ref={ref}
      className={styles.face} 
      style={{ transform: faceTransform }}
    >
      <div className={styles.eyes}>
        <div 
          className={`${styles.eye} ${styles.left} ${styles[state]}`}
          style={{ transform: eyeTransform }}
        />
        <div 
          className={`${styles.eye} ${styles.right} ${styles[state]}`}
          style={{ transform: eyeTransform }}
        />
      </div>
      <div 
        className={`${styles.mouth} ${styles[state]}`}
        style={mouthStyle}
      />
    </div>
  );
});

Face.displayName = 'Face';
