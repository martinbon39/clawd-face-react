import styles from './HelpPanel.module.css';

export function HelpPanel({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <h2>🎭 Easter Eggs</h2>
        
        <div className={styles.section}>
          <div className={styles.title}>⌨️ Mots secrets</div>
          <div className={styles.keys}>
            <kbd>dance</kbd> <kbd>love</kbd> <kbd>sleep</kbd> <kbd>hello</kbd> <kbd>matrix</kbd>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.title}>🖱️ Clics sur le visage</div>
          <p>1× sursaut · 3× danse · 5× vertige · 10× rainbow</p>
        </div>

        <div className={styles.section}>
          <div className={styles.title}>🎮 Konami</div>
          <kbd>↑↑↓↓←→←→BA</kbd>
        </div>

        <div className={styles.hint}>
          Appuie <kbd>?</kbd> pour fermer · Auto-sleep après 1min
        </div>
      </div>
    </div>
  );
}
