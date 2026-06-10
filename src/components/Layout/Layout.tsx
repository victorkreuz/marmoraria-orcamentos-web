import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { ReactNode } from 'react';
import styles from './Layout.module.css';

interface Props {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/orcamentos', label: 'Orçamentos' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/produtos', label: 'Produtos' },
  { to: '/observacoes', label: 'Obs. e Pagamentos' },
];

export function Layout({ title, action, children }: Props) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <nav className={styles.topnav}>
        <span className={styles.logo}>Gaúcha Mármores</span>
        <div className={styles.navItems}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [styles.navLink, isActive ? styles.active : ''].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login'); }}>
          Sair
        </button>
      </nav>

      <main className={styles.content}>
        <div className={styles.contentWrap}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{title}</h1>
            {action && <div className={styles.pageAction}>{action}</div>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
