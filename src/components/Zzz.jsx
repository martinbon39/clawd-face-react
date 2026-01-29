import styles from './Zzz.module.css';

export function Zzz({ visible }) {
  if (!visible) return null;
  
  return (
    <div className={styles.container}>
      <span className={styles.z}>z</span>
      <span className={styles.z}>z</span>
      <span className={styles.z}>z</span>
    </div>
  );
}
